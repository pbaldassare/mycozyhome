-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat attachments bucket
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- Check if user is part of the conversation (file path includes conversation_id)
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.client_id = auth.uid() OR c.professional_id = auth.uid())
      AND (storage.foldername(name))[1] = c.id::text
    )
  )
);

-- Add blocked_content column to messages for moderation tracking
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS original_content text;

-- Update conversations to track booking relationship
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS unread_count_client integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_professional integer DEFAULT 0;

-- Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_professional_id ON public.conversations(professional_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update last_message_at on new message
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Policy for updating message read status
CREATE POLICY "Users can update read status in their conversations"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
  )
);

-- Policy for updating conversation unread counts
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
USING (
  client_id = auth.uid() OR professional_id = auth.uid()
)
WITH CHECK (
  client_id = auth.uid() OR professional_id = auth.uid()
);