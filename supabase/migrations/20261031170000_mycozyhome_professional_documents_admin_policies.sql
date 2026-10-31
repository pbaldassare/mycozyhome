-- Le policy "Admin ..." su professional_documents (migrazione 20260204152622) erano
-- USING (true) sul ruolo public: chiunque, anche senza login, poteva leggere e
-- modificare tutti i documenti. Ora valgono solo per gli admin MyCozyHome.
-- I professionisti continuano a gestire i propri documenti tramite
-- "Professionals can manage their own documents".
DROP POLICY "Admin can view all professional documents" ON mycozyhome.professional_documents;
DROP POLICY "Admin can update professional documents" ON mycozyhome.professional_documents;

CREATE POLICY "Admin can view all professional documents"
ON mycozyhome.professional_documents
FOR SELECT
TO authenticated
USING (mycozyhome.is_admin());

CREATE POLICY "Admin can update professional documents"
ON mycozyhome.professional_documents
FOR UPDATE
TO authenticated
USING (mycozyhome.is_admin())
WITH CHECK (mycozyhome.is_admin());
