-- Test di sicurezza e dei flussi di soldi dello schema mycozyhome.
-- Gira sul DB vero dentro una transazione annullata alla fine: non lascia dati.
-- Uso: npm run test:db
-- Ogni controllo fallito solleva 'TEST FALLITO: ...' e interrompe lo script.

BEGIN;

-- 1. Permessi di base -------------------------------------------------------
DO $$ BEGIN
  IF has_function_privilege('anon', 'mycozyhome.simulate_wallet_top_up(numeric)', 'EXECUTE') THEN
    RAISE EXCEPTION 'TEST FALLITO: anon può ricaricare il wallet';
  END IF;
  IF has_function_privilege('authenticated', 'mycozyhome.release_booking_payment(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'TEST FALLITO: release_booking_payment eseguibile dal client';
  END IF;
  IF has_column_privilege('anon', 'mycozyhome.professionals', 'email', 'SELECT')
     OR has_column_privilege('authenticated', 'mycozyhome.professionals', 'fiscal_code', 'SELECT') THEN
    RAISE EXCEPTION 'TEST FALLITO: dati personali dei professionisti leggibili';
  END IF;
  IF has_table_privilege('authenticated', 'mycozyhome.bookings', 'INSERT')
     OR has_table_privilege('authenticated', 'mycozyhome.bookings', 'UPDATE') THEN
    RAISE EXCEPTION 'TEST FALLITO: prenotazioni scrivibili direttamente';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'mycozyhome' AND c.relkind = 'r' AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'TEST FALLITO: tabella senza RLS';
  END IF;
END $$;

-- 2. Dati di prova (come owner) --------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
  ('00000000-0000-4000-8000-0000000000c1', 'test-cliente@mycozyhome.invalid',
   '{"app":"mycozyhome","role":"client","first_name":"Carla","last_name":"Test"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b1', 'test-pro@mycozyhome.invalid',
   '{"app":"mycozyhome","role":"professional","first_name":"Paolo","last_name":"Test"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a1', 'test-altra-app@mycozyhome.invalid',
   '{}', 'authenticated', 'authenticated');

DO $$ BEGIN
  IF NOT mycozyhome.has_role('00000000-0000-4000-8000-0000000000c1', 'client')
     OR NOT EXISTS (SELECT 1 FROM mycozyhome.client_profiles WHERE user_id = '00000000-0000-4000-8000-0000000000c1') THEN
    RAISE EXCEPTION 'TEST FALLITO: ruolo o profilo cliente non creati alla registrazione';
  END IF;
  IF NOT mycozyhome.has_role('00000000-0000-4000-8000-0000000000b1', 'professional')
     OR NOT EXISTS (SELECT 1 FROM mycozyhome.professionals WHERE user_id = '00000000-0000-4000-8000-0000000000b1' AND status = 'pending') THEN
    RAISE EXCEPTION 'TEST FALLITO: ruolo o profilo professionista non creati alla registrazione';
  END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.user_roles WHERE user_id = '00000000-0000-4000-8000-0000000000a1') THEN
    RAISE EXCEPTION 'TEST FALLITO: un utente di un altra app ha ricevuto un ruolo';
  END IF;
END $$;

UPDATE mycozyhome.professionals SET status = 'approved', city = 'Milano', phone = '000'
WHERE user_id = '00000000-0000-4000-8000-0000000000b1';
INSERT INTO mycozyhome.professional_services (professional_id, service_type, hourly_rate, min_hours, is_active)
SELECT id, 'cleaning', 20, 2, true FROM mycozyhome.professionals WHERE user_id = '00000000-0000-4000-8000-0000000000b1';
INSERT INTO mycozyhome.client_wallets (user_id, balance) VALUES ('00000000-0000-4000-8000-0000000000c1', 100)
ON CONFLICT (user_id) DO UPDATE SET balance = 100;

-- 3. Come cliente -----------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);

DO $$
DECLARE v_pro uuid; v_booking uuid; v_row mycozyhome.bookings; v_balance numeric;
BEGIN
  SELECT id INTO v_pro FROM mycozyhome.professionals WHERE first_name = 'Paolo' AND status = 'approved' LIMIT 1;

  BEGIN
    PERFORM mycozyhome.create_booking(v_pro, 'cleaning', current_date + 1, '10:00', 1, 'Via Roma 1, Milano');
    RAISE EXCEPTION 'TEST FALLITO: accettata una durata sotto il minimo';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%FC_BOOKING_MIN_HOURS%' THEN RAISE; END IF;
  END;

  v_booking := mycozyhome.create_booking(v_pro, 'cleaning', current_date + 1, '10:00', 3, 'Via Roma 1, Milano', NULL, 'prima20');
  SELECT * INTO v_row FROM mycozyhome.bookings WHERE id = v_booking;
  IF v_row.total_amount <> 48 OR v_row.discount_amount <> 12 OR v_row.payment_status <> 'held' OR v_row.status <> 'pending' THEN
    RAISE EXCEPTION 'TEST FALLITO: prezzo o stato calcolati male (totale %, sconto %, pagamento %)',
      v_row.total_amount, v_row.discount_amount, v_row.payment_status;
  END IF;
  SELECT balance INTO v_balance FROM mycozyhome.client_wallets WHERE user_id = auth.uid();
  IF v_balance <> 52 THEN RAISE EXCEPTION 'TEST FALLITO: saldo dopo la prenotazione %', v_balance; END IF;

  BEGIN
    PERFORM mycozyhome.create_booking(v_pro, 'cleaning', current_date + 2, '10:00', 2, 'Via Roma 1, Milano', NULL, 'PRIMA20');
    RAISE EXCEPTION 'TEST FALLITO: codice promo usato due volte';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%FC_PROMO_USED%' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE mycozyhome.bookings SET total_amount = 1 WHERE id = v_booking;
    RAISE EXCEPTION 'TEST FALLITO: il cliente ha modificato l importo';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM mycozyhome.simulate_wallet_top_up(100);
    RAISE EXCEPTION 'TEST FALLITO: ricarica simulata con flag spento';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%FC_TOP_UP_DISABLED%' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE mycozyhome.client_profiles SET average_rating = 5 WHERE user_id = auth.uid();
    RAISE EXCEPTION 'TEST FALLITO: il cliente ha cambiato la propria valutazione';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%FC_FORBIDDEN%' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO mycozyhome.reviews (booking_id, professional_id, client_id, rating)
    VALUES (v_booking, v_pro, auth.uid(), 1);
    RAISE EXCEPTION 'TEST FALLITO: recensione senza servizio completato';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('mycozyhome_test.booking', v_booking::text, true);
END $$;

-- 4. Come professionista -----------------------------------------------------
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);

DO $$
DECLARE v_booking uuid := current_setting('mycozyhome_test.booking')::uuid; v_pro uuid; v_conv uuid; v_msg mycozyhome.messages;
BEGIN
  SELECT id INTO v_pro FROM mycozyhome.professionals WHERE user_id = auth.uid();

  BEGIN
    UPDATE mycozyhome.professionals SET average_rating = 5, revenue_blocked = false WHERE user_id = auth.uid();
    RAISE EXCEPTION 'TEST FALLITO: il professionista ha cambiato colonne riservate';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%FC_FORBIDDEN%' THEN RAISE; END IF;
  END;

  PERFORM mycozyhome.professional_set_booking_status(v_booking, 'confirmed');
  IF (SELECT status FROM mycozyhome.bookings WHERE id = v_booking) <> 'confirmed' THEN
    RAISE EXCEPTION 'TEST FALLITO: conferma della prenotazione';
  END IF;

  INSERT INTO mycozyhome.conversations (client_id, professional_id, booking_id)
  VALUES ('00000000-0000-4000-8000-0000000000c1', v_pro, v_booking) RETURNING id INTO v_conv;
  INSERT INTO mycozyhome.messages (conversation_id, sender_id, sender_type, content)
  VALUES (v_conv, auth.uid(), 'client', 'Chiamami al 333 123 4567 o scrivi a test@example.com')
  RETURNING * INTO v_msg;
  IF v_msg.content LIKE '%333%' OR v_msg.content LIKE '%@example%' OR NOT v_msg.is_blocked
     OR v_msg.original_content IS NOT NULL OR v_msg.sender_type <> 'professional' THEN
    RAISE EXCEPTION 'TEST FALLITO: filtro della chat (%)', v_msg.content;
  END IF;

  BEGIN
    INSERT INTO mycozyhome.messages (conversation_id, sender_id, sender_type, content)
    VALUES (v_conv, '00000000-0000-4000-8000-0000000000c1', 'client', 'messaggio finto');
    RAISE EXCEPTION 'TEST FALLITO: messaggio a nome di un altro utente';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- 5. Il cliente annulla e riceve il rimborso --------------------------------
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);

DO $$
DECLARE v_booking uuid := current_setting('mycozyhome_test.booking')::uuid; v_balance numeric;
BEGIN
  PERFORM mycozyhome.cancel_booking(v_booking, 'Test');
  SELECT balance INTO v_balance FROM mycozyhome.client_wallets WHERE user_id = auth.uid();
  IF v_balance <> 100 OR (SELECT payment_status FROM mycozyhome.bookings WHERE id = v_booking) <> 'refunded' THEN
    RAISE EXCEPTION 'TEST FALLITO: rimborso dopo l annullamento (saldo %)', v_balance;
  END IF;
END $$;

RESET ROLE;
SELECT 'TUTTI I TEST SUPERATI' AS esito;
ROLLBACK;
