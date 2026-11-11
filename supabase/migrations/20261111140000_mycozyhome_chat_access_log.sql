-- Specifiche §8: ogni accesso di un operatore a una chat tra utenti va registrato
-- (chi, quale chat, quando, perché). L'admin non legge più i messaggi direttamente:
-- passa da admin_read_chat, che scrive il registro.
CREATE TABLE mycozyhome.chat_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  reason text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mycozyhome.chat_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view chat access log" ON mycozyhome.chat_access_log FOR SELECT TO authenticated
  USING (mycozyhome.is_admin());
GRANT SELECT ON mycozyhome.chat_access_log TO authenticated;

ALTER POLICY "Users can view messages in their conversations" ON mycozyhome.messages
  USING (mycozyhome.is_conversation_party(conversation_id));

-- Messaggi tra due utenti (id auth di cliente e professionista, in qualsiasi ordine).
CREATE FUNCTION mycozyhome.admin_read_chat(p_user_a uuid, p_user_b uuid, p_reason text)
RETURNS SETOF mycozyhome.messages
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 5 THEN RAISE EXCEPTION 'FC_REPORT_REASON_REQUIRED'; END IF;

  INSERT INTO mycozyhome.chat_access_log (admin_id, conversation_id, reason)
  SELECT auth.uid(), c.id, trim(p_reason)
  FROM mycozyhome.conversations c JOIN mycozyhome.professionals p ON p.id = c.professional_id
  WHERE (c.client_id = p_user_a AND p.user_id = p_user_b) OR (c.client_id = p_user_b AND p.user_id = p_user_a);

  RETURN QUERY
  SELECT m.* FROM mycozyhome.messages m
  JOIN mycozyhome.conversations c ON c.id = m.conversation_id
  JOIN mycozyhome.professionals p ON p.id = c.professional_id
  WHERE (c.client_id = p_user_a AND p.user_id = p_user_b) OR (c.client_id = p_user_b AND p.user_id = p_user_a)
  ORDER BY m.created_at;
END; $$;
REVOKE EXECUTE ON FUNCTION mycozyhome.admin_read_chat(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mycozyhome.admin_read_chat(uuid, uuid, text) TO authenticated;
