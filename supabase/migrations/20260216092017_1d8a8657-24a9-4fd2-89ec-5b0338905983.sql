
-- Add attachment support to ticket_responses
ALTER TABLE public.ticket_responses
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for support-attachments bucket
CREATE POLICY "Authenticated users can upload support attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

CREATE POLICY "Users can view their support attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'support-attachments');

-- Allow admin to view/update all tickets
CREATE POLICY "Admin can view all tickets"
ON public.support_tickets
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update all tickets"
ON public.support_tickets
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to insert responses
CREATE POLICY "Admin can respond to tickets"
ON public.ticket_responses
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admin to view all responses
CREATE POLICY "Admin can view all responses"
ON public.ticket_responses
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
