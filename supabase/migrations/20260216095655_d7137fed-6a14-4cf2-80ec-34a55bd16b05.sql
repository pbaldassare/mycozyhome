CREATE POLICY "Admin can create tickets for users"
ON public.support_tickets
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));