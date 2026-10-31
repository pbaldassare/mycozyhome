-- Fase 3: letture raccolte in una richiesta e profilo cliente minimo per i professionisti.

-- 1. Profilo cliente visibile al professionista che ha (o ha avuto) una
--    prenotazione o una conversazione con lui: nome, iniziale del cognome,
--    foto e valutazione. Telefono e indirizzo restano privati.
CREATE VIEW mycozyhome.client_public AS
  SELECT c.user_id, c.first_name, left(c.last_name, 1) AS last_name, c.avatar_url,
         c.average_rating, c.review_count
  FROM mycozyhome.client_profiles c
  WHERE c.user_id = auth.uid()
     OR mycozyhome.is_admin()
     OR EXISTS (SELECT 1 FROM mycozyhome.bookings b
                WHERE b.client_id = c.user_id AND b.professional_id = mycozyhome.my_professional_id())
     OR EXISTS (SELECT 1 FROM mycozyhome.conversations v
                WHERE v.client_id = c.user_id AND v.professional_id = mycozyhome.my_professional_id());
GRANT SELECT ON mycozyhome.client_public TO authenticated;

-- 2. Ticket di assistenza con risposte non lette: un conteggio, una query.
CREATE FUNCTION mycozyhome.my_unread_support_count() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT count(*)::integer FROM mycozyhome.support_tickets t
  WHERE t.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM mycozyhome.ticket_responses r
      WHERE r.ticket_id = t.id AND r.responder_type = 'admin'
        AND r.created_at > COALESCE(t.last_read_at, 'epoch'::timestamptz)
    );
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.my_unread_support_count() TO authenticated;

-- 3. Conversazioni dell'utente con ultimo messaggio e nomi delle parti.
CREATE FUNCTION mycozyhome.my_conversations() RETURNS TABLE (
    id uuid, booking_id uuid, client_id uuid, professional_id uuid, status text,
    created_at timestamptz, updated_at timestamptz, last_message_at timestamptz,
    unread_count_client integer, unread_count_professional integer,
    last_content text, last_created_at timestamptz, last_sender_id uuid,
    client_first_name text, client_last_name text, client_avatar_url text,
    professional_first_name text, professional_last_name text, professional_avatar_url text
)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT v.id, v.booking_id, v.client_id, v.professional_id, v.status,
         v.created_at, v.updated_at, v.last_message_at,
         v.unread_count_client, v.unread_count_professional,
         m.content, m.created_at, m.sender_id,
         c.first_name, left(c.last_name, 1), c.avatar_url,
         p.first_name, p.last_name, p.avatar_url
  FROM mycozyhome.conversations v
  JOIN mycozyhome.professionals p ON p.id = v.professional_id
  LEFT JOIN mycozyhome.client_profiles c ON c.user_id = v.client_id
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id FROM mycozyhome.messages
    WHERE conversation_id = v.id ORDER BY created_at DESC LIMIT 1
  ) m ON true
  WHERE v.status = 'active' AND (v.client_id = auth.uid() OR p.user_id = auth.uid())
  ORDER BY v.last_message_at DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.my_conversations() TO authenticated;

-- Indici per le letture più frequenti.
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON mycozyhome.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_client_idx ON mycozyhome.bookings (client_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS bookings_professional_idx ON mycozyhome.bookings (professional_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS ticket_responses_ticket_idx ON mycozyhome.ticket_responses (ticket_id, created_at);
