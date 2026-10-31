-- is_admin() restituiva sempre true (segnaposto della migrazione 20260204152622):
-- ora è true solo se l'utente corrente ha il ruolo admin in mycozyhome.user_roles.
CREATE OR REPLACE FUNCTION mycozyhome.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'mycozyhome'
AS $$
  SELECT mycozyhome.has_role(auth.uid(), 'admin'::mycozyhome.app_role)
$$;
