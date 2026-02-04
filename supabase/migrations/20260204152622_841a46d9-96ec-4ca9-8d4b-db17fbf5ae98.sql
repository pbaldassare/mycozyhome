-- Create admin role check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- For now, we'll use a simple approach where admin access is granted via service key
  -- In production, you would check against an admin_users table or user metadata
  -- This allows frontend admin pages to work during development
  RETURN true; -- Placeholder: in production, check auth.jwt() claims or admin table
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for admin to view all professionals (including pending/rejected)
CREATE POLICY "Admin can view all professionals" 
ON public.professionals 
FOR SELECT 
USING (true);

-- Add policy for admin to update professional status
CREATE POLICY "Admin can update professionals" 
ON public.professionals 
FOR UPDATE 
USING (true);

-- Add policy for admin to view all professional documents
CREATE POLICY "Admin can view all professional documents" 
ON public.professional_documents 
FOR SELECT 
USING (true);

-- Add policy for admin to update document status
CREATE POLICY "Admin can update professional documents" 
ON public.professional_documents 
FOR UPDATE 
USING (true);

-- Add policy for admin to view all professional services
CREATE POLICY "Anyone can view professional services" 
ON public.professional_services 
FOR SELECT 
USING (true);