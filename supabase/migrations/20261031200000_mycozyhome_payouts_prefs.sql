-- Fase 2: prelievi dei professionisti, preferenze salvate, uscita da MyCozyHome,
-- statistiche reali per l'admin.

-- 1. Richieste di prelievo: il saldo viene scalato subito e restituito se
--    l'admin rifiuta la richiesta.
CREATE TABLE mycozyhome.payout_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES mycozyhome.professionals(id),
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    iban text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
    admin_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    processed_by uuid
);
ALTER TABLE mycozyhome.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professionals can view own payouts" ON mycozyhome.payout_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR mycozyhome.is_admin());
GRANT SELECT ON mycozyhome.payout_requests TO authenticated;

ALTER TABLE mycozyhome.wallet_transactions DROP CONSTRAINT wallet_transactions_type_check;
ALTER TABLE mycozyhome.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('top_up', 'hold', 'refund', 'release', 'payout', 'payout_reversal', 'dispute_refund', 'dispute_payout'));

CREATE FUNCTION mycozyhome.request_payout(p_amount numeric, p_iban text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_prof mycozyhome.professionals; v_iban text; v_id uuid; v_balance numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  SELECT * INTO v_prof FROM mycozyhome.professionals WHERE user_id = v_uid;
  IF NOT FOUND OR v_prof.status <> 'approved' THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF v_prof.is_blocked THEN RAISE EXCEPTION 'FC_ACCOUNT_BLOCKED'; END IF;
  v_iban := upper(regexp_replace(COALESCE(p_iban, ''), '\s', '', 'g'));
  IF v_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$' THEN RAISE EXCEPTION 'FC_PAYOUT_IBAN'; END IF;
  IF p_amount IS NULL OR p_amount < 10 THEN RAISE EXCEPTION 'FC_PAYOUT_AMOUNT'; END IF;
  SELECT balance INTO v_balance FROM mycozyhome.professional_wallets WHERE professional_id = v_prof.id FOR UPDATE;
  IF COALESCE(v_balance, 0) < p_amount THEN RAISE EXCEPTION 'FC_PAYOUT_BALANCE'; END IF;
  UPDATE mycozyhome.professional_wallets SET balance = balance - p_amount, updated_at = now()
  WHERE professional_id = v_prof.id;
  INSERT INTO mycozyhome.payout_requests (professional_id, user_id, amount, iban)
  VALUES (v_prof.id, v_uid, round(p_amount, 2), v_iban) RETURNING id INTO v_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, type, amount, direction, description)
  VALUES (v_uid, v_prof.id, 'payout', round(p_amount, 2), 'debit', 'Richiesta di prelievo');
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.request_payout(numeric, text) TO authenticated;

CREATE FUNCTION mycozyhome.process_payout(p_payout_id uuid, p_status text, p_notes text DEFAULT NULL) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_payout mycozyhome.payout_requests;
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF p_status NOT IN ('paid', 'rejected') THEN RAISE EXCEPTION 'FC_BOOKING_STATUS'; END IF;
  SELECT * INTO v_payout FROM mycozyhome.payout_requests WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND OR v_payout.status <> 'pending' THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  UPDATE mycozyhome.payout_requests
  SET status = p_status, admin_notes = NULLIF(trim(COALESCE(p_notes, '')), ''), processed_at = now(), processed_by = auth.uid()
  WHERE id = p_payout_id;
  IF p_status = 'rejected' THEN
    UPDATE mycozyhome.professional_wallets SET balance = balance + v_payout.amount, updated_at = now()
    WHERE professional_id = v_payout.professional_id;
    INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, type, amount, direction, description)
    VALUES (v_payout.user_id, v_payout.professional_id, 'payout_reversal', v_payout.amount, 'credit', 'Prelievo rifiutato: importo riaccreditato');
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.process_payout(uuid, text, text) TO authenticated;

-- Il professionista vede il proprio saldo (la policy esistente usa user_id).
-- I movimenti del professionista sono già leggibili con "Users can view own wallet transactions".

-- 2. Preferenze di notifica e privacy salvate nel profilo.
ALTER TABLE mycozyhome.client_profiles ADD COLUMN preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE mycozyhome.professionals ADD COLUMN preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
GRANT SELECT (preferences) ON mycozyhome.professionals TO authenticated;
CREATE OR REPLACE VIEW mycozyhome.professional_private AS
  SELECT * FROM mycozyhome.professionals
  WHERE user_id = auth.uid() OR mycozyhome.is_admin();

-- 3. Uscire da MyCozyHome: l'autenticazione è condivisa con altre app, quindi
--    l'account non si cancella; si anonimizza il profilo e si toglie il ruolo.
--    Lo storico (prenotazioni, recensioni) resta.
CREATE FUNCTION mycozyhome.leave_mycozyhome() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_prof_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  SELECT id INTO v_prof_id FROM mycozyhome.professionals WHERE user_id = v_uid;
  IF EXISTS (
    SELECT 1 FROM mycozyhome.bookings
    WHERE (client_id = v_uid OR professional_id = v_prof_id)
      AND (status IN ('pending', 'confirmed') OR payment_status IN ('held', 'pending_release', 'disputed'))
  ) THEN
    RAISE EXCEPTION 'FC_LEAVE_ACTIVE_BOOKINGS';
  END IF;
  IF EXISTS (SELECT 1 FROM mycozyhome.payout_requests WHERE user_id = v_uid AND status = 'pending') THEN
    RAISE EXCEPTION 'FC_LEAVE_ACTIVE_BOOKINGS';
  END IF;
  UPDATE mycozyhome.client_profiles
  SET first_name = 'Utente', last_name = 'eliminato', email = NULL, phone = NULL, avatar_url = NULL,
      address = NULL, city = NULL, province = NULL, postal_code = NULL, latitude = NULL, longitude = NULL,
      preferences = '{}'::jsonb, updated_at = now()
  WHERE user_id = v_uid;
  UPDATE mycozyhome.professionals
  SET first_name = 'Utente', last_name = 'eliminato', email = '', phone = '', birth_date = NULL,
      fiscal_code = NULL, avatar_url = NULL, address = NULL, postal_code = NULL, bio = NULL,
      latitude = NULL, longitude = NULL, formatted_address = NULL, vat_number = NULL,
      status = 'suspended', preferences = '{}'::jsonb, updated_at = now()
  WHERE user_id = v_uid;
  UPDATE mycozyhome.professional_services SET is_active = false WHERE professional_id = v_prof_id;
  DELETE FROM mycozyhome.favorites WHERE client_id = v_uid;
  DELETE FROM mycozyhome.user_roles WHERE user_id = v_uid;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.leave_mycozyhome() TO authenticated;

-- 4. Numeri reali per la dashboard admin.
CREATE FUNCTION mycozyhome.admin_dashboard_stats() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  RETURN jsonb_build_object(
    'clients', (SELECT count(*) FROM mycozyhome.user_roles WHERE role = 'client'),
    'professionals_approved', (SELECT count(*) FROM mycozyhome.professionals WHERE status = 'approved'),
    'professionals_to_review', (SELECT count(*) FROM mycozyhome.professionals WHERE status = 'in_review'),
    'bookings_month', (SELECT count(*) FROM mycozyhome.bookings WHERE created_at >= date_trunc('month', now())),
    'bookings_open', (SELECT count(*) FROM mycozyhome.bookings WHERE status IN ('pending', 'confirmed')),
    'revenue_month', (SELECT COALESCE(sum(total_amount), 0) FROM mycozyhome.bookings
                      WHERE status = 'completed' AND completed_at >= date_trunc('month', now())),
    'disputes_open', (SELECT count(*) FROM mycozyhome.disputes WHERE status IN ('open', 'investigating', 'escalated')),
    'tickets_open', (SELECT count(*) FROM mycozyhome.support_tickets WHERE status IN ('open', 'in_progress')),
    'payouts_pending', (SELECT count(*) FROM mycozyhome.payout_requests WHERE status = 'pending')
  );
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.admin_dashboard_stats() TO authenticated;
