-- Fase 0: dati personali, storage e integrità di recensioni, dispute, chat e GPS.

-- 1. Professionisti: le colonne personali non sono più leggibili da tutti.
--    Lettura pubblica solo delle colonne del profilo; profilo completo dalla
--    vista professional_private (il proprio, o tutti per l'admin).
REVOKE SELECT ON mycozyhome.professionals FROM anon, authenticated;
GRANT SELECT (
  id, user_id, first_name, last_name, avatar_url, city, province, bio, years_experience,
  status, profile_completed, documents_submitted, latitude, longitude, max_radius_km,
  average_rating, review_count, created_at, updated_at
) ON mycozyhome.professionals TO anon, authenticated;

DROP POLICY "Anyone can view approved professionals" ON mycozyhome.professionals;
CREATE POLICY "Anyone can view approved professionals" ON mycozyhome.professionals FOR SELECT
  USING (status = 'approved' AND NOT is_blocked);

CREATE VIEW mycozyhome.professional_private AS
  SELECT * FROM mycozyhome.professionals
  WHERE user_id = auth.uid() OR mycozyhome.is_admin();
GRANT SELECT ON mycozyhome.professional_private TO authenticated;

-- 2. Richieste di servizio aperte: solo per i professionisti approvati.
DROP POLICY "Anyone can view open service requests" ON mycozyhome.service_requests;
CREATE POLICY "Approved professionals can view open service requests" ON mycozyhome.service_requests FOR SELECT TO authenticated
  USING (status = 'open' AND EXISTS (
    SELECT 1 FROM mycozyhome.professionals p
    WHERE p.user_id = auth.uid() AND p.status = 'approved' AND NOT p.is_blocked
  ));

-- 3. Recensioni sui clienti: non più pubbliche.
DROP POLICY "Anyone can view client reviews" ON mycozyhome.client_reviews;
CREATE POLICY "Professionals can view client reviews" ON mycozyhome.client_reviews FOR SELECT TO authenticated
  USING (mycozyhome.has_role(auth.uid(), 'professional') OR mycozyhome.is_admin());

-- 4. Conversazioni: le parti sono il cliente e l'utente del professionista
--    (professional_id è professionals.id, non l'utente).
CREATE FUNCTION mycozyhome.is_conversation_party(p_conversation_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM mycozyhome.conversations c
    LEFT JOIN mycozyhome.professionals p ON p.id = c.professional_id
    WHERE c.id = p_conversation_id AND (c.client_id = auth.uid() OR p.user_id = auth.uid())
  );
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.is_conversation_party(uuid) TO authenticated;

CREATE FUNCTION mycozyhome.my_professional_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT id FROM mycozyhome.professionals WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.my_professional_id() TO authenticated;

DROP POLICY "Users can create conversations" ON mycozyhome.conversations;
DROP POLICY "Users can update their conversations" ON mycozyhome.conversations;
DROP POLICY "Users can view their conversations" ON mycozyhome.conversations;
CREATE POLICY "Users can view their conversations" ON mycozyhome.conversations FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR professional_id = mycozyhome.my_professional_id() OR mycozyhome.is_admin());
CREATE POLICY "Users can create conversations" ON mycozyhome.conversations FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid() OR professional_id = mycozyhome.my_professional_id());
CREATE POLICY "Users can update their conversations" ON mycozyhome.conversations FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR professional_id = mycozyhome.my_professional_id())
  WITH CHECK (client_id = auth.uid() OR professional_id = mycozyhome.my_professional_id());

-- 5. Messaggi: mittente vero, filtro dei contatti nel DB, testo originale
--    visibile solo all'admin, aggiornamento solo dello stato di lettura.
CREATE TABLE mycozyhome.message_moderation (
    message_id uuid PRIMARY KEY,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    original_content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mycozyhome.message_moderation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view moderation" ON mycozyhome.message_moderation FOR SELECT TO authenticated
  USING (mycozyhome.is_admin());
GRANT SELECT ON mycozyhome.message_moderation TO authenticated;

CREATE FUNCTION mycozyhome.filter_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_conv mycozyhome.conversations; v_prof_user uuid; v_clean text; v_original text;
BEGIN
  SELECT * INTO v_conv FROM mycozyhome.conversations WHERE id = NEW.conversation_id;
  SELECT user_id INTO v_prof_user FROM mycozyhome.professionals WHERE id = v_conv.professional_id;
  IF NEW.sender_type <> 'system' OR auth.uid() IS NOT NULL THEN
    NEW.sender_type := CASE WHEN NEW.sender_id = v_conv.client_id THEN 'client'
                            WHEN NEW.sender_id = v_prof_user THEN 'professional'
                            ELSE NEW.sender_type END;
  END IF;
  v_original := COALESCE(NEW.original_content, NEW.content);
  v_clean := v_original;
  v_clean := regexp_replace(v_clean, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email nascosta]', 'g');
  v_clean := regexp_replace(v_clean, '(https?://|www\.)[^[:space:]]+', '[link rimosso]', 'gi');
  v_clean := regexp_replace(v_clean, '[A-Za-z0-9-]+\.(com|it|org|net|io|app|co|info|biz|eu)([/?#][^[:space:]]*)?([[:space:]]|$)', '[link rimosso]\3', 'gi');
  v_clean := regexp_replace(v_clean, '(\+?[0-9]{1,4}[ .-]?)?\(?[0-9]{2,4}\)?[ .-]?[0-9]{3,4}[ .-]?[0-9]{3,4}', '[numero nascosto]', 'g');
  NEW.content := v_clean;
  NEW.is_blocked := v_clean <> v_original
    OR v_original ~* '(chiamami|contattami|scrivimi su|whatsapp|telegram|messenger|instagram|facebook|il mio numero|la mia e?mail)';
  NEW.original_content := NULL;
  IF NEW.is_blocked THEN
    INSERT INTO mycozyhome.message_moderation (message_id, conversation_id, sender_id, original_content)
    VALUES (NEW.id, NEW.conversation_id, NEW.sender_id, v_original);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER filter_message BEFORE INSERT ON mycozyhome.messages
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.filter_message();

CREATE FUNCTION mycozyhome.guard_message_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR mycozyhome.is_admin() THEN RETURN NEW; END IF;
  IF (NEW.id, NEW.conversation_id, NEW.sender_id, NEW.sender_type, NEW.content, NEW.message_type,
      NEW.file_url, NEW.created_at, NEW.is_blocked, NEW.original_content)
     IS DISTINCT FROM
     (OLD.id, OLD.conversation_id, OLD.sender_id, OLD.sender_type, OLD.content, OLD.message_type,
      OLD.file_url, OLD.created_at, OLD.is_blocked, OLD.original_content)
     OR OLD.sender_id = auth.uid() THEN
    RAISE EXCEPTION 'FC_FORBIDDEN';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER guard_message_update BEFORE UPDATE ON mycozyhome.messages
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.guard_message_update();

DROP POLICY "Users can send messages in their conversations" ON mycozyhome.messages;
DROP POLICY "Users can update read status in their conversations" ON mycozyhome.messages;
DROP POLICY "Users can view messages in their conversations" ON mycozyhome.messages;
CREATE POLICY "Users can view messages in their conversations" ON mycozyhome.messages FOR SELECT TO authenticated
  USING (mycozyhome.is_conversation_party(conversation_id) OR mycozyhome.is_admin());
CREATE POLICY "Users can send messages in their conversations" ON mycozyhome.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND mycozyhome.is_conversation_party(conversation_id));
CREATE POLICY "Users can update read status in their conversations" ON mycozyhome.messages FOR UPDATE TO authenticated
  USING (mycozyhome.is_conversation_party(conversation_id))
  WITH CHECK (mycozyhome.is_conversation_party(conversation_id));

-- 6. Recensioni: solo dopo un servizio completato, moderazione riservata.
ALTER TABLE mycozyhome.reviews ADD CONSTRAINT reviews_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES mycozyhome.bookings(id);

DROP POLICY "Clients can create reviews for their bookings" ON mycozyhome.reviews;
CREATE POLICY "Clients can create reviews for their bookings" ON mycozyhome.reviews FOR INSERT TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND is_visible = true AND admin_hidden = false AND admin_notes IS NULL
    AND EXISTS (
      SELECT 1 FROM mycozyhome.bookings b
      WHERE b.id = reviews.booking_id AND b.client_id = auth.uid()
        AND b.professional_id = reviews.professional_id AND b.status = 'completed'
    )
  );

DROP POLICY "Professionals can create client reviews" ON mycozyhome.client_reviews;
CREATE POLICY "Professionals can create client reviews" ON mycozyhome.client_reviews FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = mycozyhome.my_professional_id()
    AND EXISTS (
      SELECT 1 FROM mycozyhome.bookings b
      WHERE b.id = client_reviews.booking_id AND b.client_id = client_reviews.client_id
        AND b.professional_id = client_reviews.professional_id AND b.status = 'completed'
    )
  );

-- 7. Dispute: solo le parti della prenotazione, stato iniziale fissato.
DROP POLICY "Users can create disputes" ON mycozyhome.disputes;
CREATE POLICY "Users can create disputes" ON mycozyhome.disputes FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND status = 'open' AND resolution IS NULL AND admin_notes IS NULL
    AND resolved_by IS NULL AND resolved_at IS NULL
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM mycozyhome.bookings b
      JOIN mycozyhome.professionals p ON p.id = b.professional_id
      WHERE b.id = disputes.booking_id
        AND (
          (disputes.reporter_type = 'client' AND b.client_id = auth.uid()
            AND disputes.reported_type = 'professional' AND disputes.reported_id = p.user_id)
          OR
          (disputes.reporter_type = 'professional' AND p.user_id = auth.uid()
            AND disputes.reported_type = 'client' AND disputes.reported_id = b.client_id)
        )
    )
  );

DROP POLICY "Users can upload evidence to their disputes" ON mycozyhome.dispute_evidence;
CREATE POLICY "Users can upload evidence to their disputes" ON mycozyhome.dispute_evidence FOR INSERT TO authenticated
  WITH CHECK (uploader_id = auth.uid() AND EXISTS (
    SELECT 1 FROM mycozyhome.disputes d
    WHERE d.id = dispute_evidence.dispute_id AND (d.reporter_id = auth.uid() OR d.reported_id = auth.uid())
  ));
CREATE POLICY "Admin can view dispute evidence" ON mycozyhome.dispute_evidence FOR SELECT TO authenticated
  USING (mycozyhome.is_admin());
CREATE POLICY "Admin can view disputes" ON mycozyhome.disputes FOR SELECT TO authenticated
  USING (mycozyhome.is_admin());
CREATE POLICY "Admin can update disputes" ON mycozyhome.disputes FOR UPDATE TO authenticated
  USING (mycozyhome.is_admin()) WITH CHECK (mycozyhome.is_admin());

-- 8. Tracciamento GPS: solo sulle proprie prenotazioni confermate, ping
--    conservati 30 giorni, visibili al cliente solo durante il servizio.
CREATE FUNCTION mycozyhome.owns_booking_as_professional(p_booking_id uuid, p_professional_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM mycozyhome.bookings b
    JOIN mycozyhome.professionals p ON p.id = b.professional_id
    WHERE b.id = p_booking_id AND b.professional_id = p_professional_id
      AND p.user_id = auth.uid() AND b.status IN ('confirmed', 'completed')
  );
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.owns_booking_as_professional(uuid, uuid) TO authenticated;

DROP POLICY "Professionals can insert their own tracking" ON mycozyhome.booking_tracking;
DROP POLICY "Professionals can update their own tracking" ON mycozyhome.booking_tracking;
DROP POLICY "Professionals can insert their own pings" ON mycozyhome.tracking_pings;
CREATE POLICY "Professionals can insert their own tracking" ON mycozyhome.booking_tracking FOR INSERT TO authenticated
  WITH CHECK (mycozyhome.owns_booking_as_professional(booking_id, professional_id));
CREATE POLICY "Professionals can update their own tracking" ON mycozyhome.booking_tracking FOR UPDATE TO authenticated
  USING (mycozyhome.owns_booking_as_professional(booking_id, professional_id))
  WITH CHECK (mycozyhome.owns_booking_as_professional(booking_id, professional_id));
CREATE POLICY "Professionals can insert their own pings" ON mycozyhome.tracking_pings FOR INSERT TO authenticated
  WITH CHECK (mycozyhome.owns_booking_as_professional(booking_id, professional_id)
    AND EXISTS (SELECT 1 FROM mycozyhome.booking_tracking t
                WHERE t.id = tracking_pings.tracking_id AND t.booking_id = tracking_pings.booking_id));

-- Il servizio si completa solo con un check-in già fatto.
CREATE OR REPLACE FUNCTION mycozyhome.complete_booking_on_tracking_checkout() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.check_in_at IS NOT NULL THEN
    UPDATE mycozyhome.bookings SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = NEW.booking_id AND status = 'confirmed';
  END IF;
  RETURN NEW;
END; $$;

DROP POLICY "Clients can view pings for their bookings" ON mycozyhome.tracking_pings;
CREATE POLICY "Clients can view pings for their bookings" ON mycozyhome.tracking_pings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mycozyhome.bookings b
    WHERE b.id = tracking_pings.booking_id AND b.client_id = auth.uid() AND b.status = 'confirmed'
  ));

SELECT cron.schedule('mycozyhome-purge-pings', '30 3 * * *',
  $$DELETE FROM mycozyhome.tracking_pings WHERE created_at < now() - interval '30 days'$$);

-- 9. Shop: le pagine non sono collegate e i prezzi arrivavano dal client.
--    Ordini chiusi finché non ci sarà una RPC che calcola i totali.
DROP POLICY "Professionals can create their own orders" ON mycozyhome.shop_orders;
DROP POLICY "Professionals can insert items for own orders" ON mycozyhome.shop_order_items;
DROP POLICY "Professionals can cancel own pending orders" ON mycozyhome.shop_orders;
REVOKE INSERT, UPDATE, DELETE ON mycozyhome.shop_orders, mycozyhome.shop_order_items FROM anon, authenticated;
GRANT UPDATE ON mycozyhome.shop_orders TO authenticated;

-- 10. Storage: ogni allegato nella cartella di chi ne ha diritto, limiti di
--     dimensione e tipo sui bucket.
UPDATE storage.buckets SET file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
WHERE id IN ('mycozyhome-chat-attachments', 'mycozyhome-dispute-evidence',
             'mycozyhome-professional-documents', 'mycozyhome-support-attachments');
UPDATE storage.buckets SET file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'mycozyhome-shop-products';

DROP POLICY "mycozyhome: Authenticated users can upload support attachments" ON storage.objects;
DROP POLICY "mycozyhome: Users can view their support attachments" ON storage.objects;
DROP POLICY "mycozyhome: Users can upload chat attachments" ON storage.objects;
DROP POLICY "mycozyhome: Users can view attachments in their conversations" ON storage.objects;
DROP POLICY "mycozyhome: Users can upload dispute evidence" ON storage.objects;
DROP POLICY "mycozyhome: Users can view their dispute evidence" ON storage.objects;
DROP POLICY "mycozyhome: Admin can download professional documents" ON storage.objects;

CREATE FUNCTION mycozyhome.can_access_ticket(p_ticket text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT mycozyhome.is_admin() OR EXISTS (
    SELECT 1 FROM mycozyhome.support_tickets t WHERE t.id::text = p_ticket AND t.user_id = auth.uid()
  );
$$;
CREATE FUNCTION mycozyhome.can_access_dispute(p_dispute text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT mycozyhome.is_admin() OR EXISTS (
    SELECT 1 FROM mycozyhome.disputes d
    WHERE d.id::text = p_dispute AND (d.reporter_id = auth.uid() OR d.reported_id = auth.uid())
  );
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.can_access_ticket(text), mycozyhome.can_access_dispute(text) TO authenticated;

CREATE POLICY "mycozyhome: Users can upload support attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mycozyhome-support-attachments' AND mycozyhome.can_access_ticket((storage.foldername(name))[1]));
CREATE POLICY "mycozyhome: Users can view their support attachments" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mycozyhome-support-attachments' AND mycozyhome.can_access_ticket((storage.foldername(name))[1]));
CREATE POLICY "mycozyhome: Users can upload chat attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mycozyhome-chat-attachments'
    AND mycozyhome.is_conversation_party(((storage.foldername(name))[1])::uuid));
CREATE POLICY "mycozyhome: Users can view attachments in their conversations" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mycozyhome-chat-attachments'
    AND (mycozyhome.is_admin() OR mycozyhome.is_conversation_party(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "mycozyhome: Users can upload dispute evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mycozyhome-dispute-evidence' AND mycozyhome.can_access_dispute((storage.foldername(name))[1]));
CREATE POLICY "mycozyhome: Users can view their dispute evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mycozyhome-dispute-evidence' AND mycozyhome.can_access_dispute((storage.foldername(name))[1]));
