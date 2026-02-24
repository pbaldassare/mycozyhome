
-- Allow admins to view all bookings
CREATE POLICY "Admin can view all bookings"
ON public.bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
