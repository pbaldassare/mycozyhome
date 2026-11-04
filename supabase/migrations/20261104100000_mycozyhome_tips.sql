-- Mance: tipo "tip" nei movimenti wallet + funzione add_tip (pagata col wallet; Stripe dopo).
ALTER TABLE mycozyhome.wallet_transactions DROP CONSTRAINT wallet_transactions_type_check;
ALTER TABLE mycozyhome.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('top_up', 'hold', 'refund', 'release', 'payout', 'payout_reversal', 'dispute_refund', 'dispute_payout', 'tip'));

CREATE OR REPLACE FUNCTION mycozyhome.add_tip(p_booking_id uuid, p_amount numeric) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_uid uuid := auth.uid(); v_booking RECORD; v_amount numeric := round(p_amount, 2); v_balance numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FC_NOT_AUTHENTICATED'; END IF;
  IF v_amount IS NULL OR v_amount < 1 OR v_amount > 100 THEN RAISE EXCEPTION 'FC_TIP_AMOUNT'; END IF;
  SELECT b.*, p.user_id AS prof_user_id INTO v_booking
  FROM mycozyhome.bookings b JOIN mycozyhome.professionals p ON p.id = b.professional_id
  WHERE b.id = p_booking_id FOR UPDATE OF b;
  IF NOT FOUND OR v_booking.client_id <> v_uid THEN RAISE EXCEPTION 'FC_FORBIDDEN'; END IF;
  IF v_booking.status <> 'completed' OR COALESCE(v_booking.tip_amount, 0) > 0 THEN RAISE EXCEPTION 'FC_BOOKING_STATUS'; END IF;

  PERFORM mycozyhome.ensure_client_wallet(v_uid);
  SELECT balance INTO v_balance FROM mycozyhome.client_wallets WHERE user_id = v_uid FOR UPDATE;
  IF COALESCE(v_balance, 0) < v_amount THEN RAISE EXCEPTION 'FC_INSUFFICIENT_CREDITS'; END IF;

  -- ponytail: mancia pagata col wallet (crediti finti). Con Stripe qui arriva il PaymentIntent.
  UPDATE mycozyhome.client_wallets SET balance = balance - v_amount, updated_at = now() WHERE user_id = v_uid;
  PERFORM mycozyhome.ensure_professional_wallet(v_booking.professional_id, v_booking.prof_user_id);
  UPDATE mycozyhome.professional_wallets SET balance = balance + v_amount, updated_at = now()
  WHERE professional_id = v_booking.professional_id;
  INSERT INTO mycozyhome.wallet_transactions (user_id, professional_id, booking_id, type, amount, direction, description)
  VALUES (v_uid, v_booking.professional_id, p_booking_id, 'tip', v_amount, 'debit', 'Mancia al professionista'),
         (v_booking.prof_user_id, v_booking.professional_id, p_booking_id, 'tip', v_amount, 'credit', 'Mancia ricevuta');
  UPDATE mycozyhome.bookings SET tip_amount = v_amount, tipped_at = now() WHERE id = p_booking_id;
  RETURN v_amount;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.add_tip(uuid, numeric) TO authenticated;
