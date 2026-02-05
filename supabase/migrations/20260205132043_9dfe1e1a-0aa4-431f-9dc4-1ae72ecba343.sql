-- Add RLS policy for admin to view documents in professional-documents bucket
CREATE POLICY "Admin can view professional documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND public.has_role(auth.uid(), 'admin')
);

-- Add RLS policy for admin to download documents
CREATE POLICY "Admin can download professional documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND public.has_role(auth.uid(), 'admin')
);