-- Add last_read_at column to support_tickets for tracking unread responses
ALTER TABLE public.support_tickets ADD COLUMN last_read_at timestamp with time zone DEFAULT now();

-- Update existing tickets to have last_read_at set to created_at
UPDATE public.support_tickets SET last_read_at = created_at;
