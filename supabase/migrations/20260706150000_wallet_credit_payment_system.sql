-- Simulated wallet / escrow payment system

-- Client wallets
CREATE TABLE IF NOT EXISTS public.client_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Professional wallets (payout balance)
CREATE TABLE IF NOT EXISTS public.professional_wallets (
  professional_id UUID PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'top_up', 'hold', 'refund', 'release', 'payout', 'dispute_refund', 'dispute_payout'
  )),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booking payment columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'none'
    CHECK (payment_status IN (
      'none', 'held', 'pending_release', 'released', 'refunded', 'disputed'
    )),
  ADD COLUMN IF NOT EXISTS payment_held_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS dispute_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMPTZ;

-- Extend dispute reasons
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_reason_check;
ALTER TABLE public.disputes
  ADD CONSTRAINT disputes_reason_check CHECK (reason IN (
    'no_show', 'poor_quality', 'inappropriate_behavior', 'payment_issue',
    'damage', 'late_arrival', 'early_departure', 'other'
  ));

-- RLS
ALTER TABLE public.client_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client wallet"
  ON public.client_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view own wallet"
  ON public.professional_wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.client_wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all professional wallets"
  ON public.professional_wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Helpers
CREATE OR REPLACE FUNCTION public.ensure_client_wallet(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_professional_wallet(p_professional_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.professional_wallets (professional_id, user_id, balance)
  VALUES (p_professional_id, p_user_id, 0)
  ON CONFLICT (professional_id) DO NOTHING;
END;
$$;

-- Simulated top-up (dev)
CREATE OR REPLACE FUNCTION public.simulate_wallet_top_up(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_balance NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 10000 THEN
    RAISE EXCEPTION 'Importo non valido (max €10.000 per ricarica simulata)';
  END IF;

  PERFORM public.ensure_client_wallet(v_user_id);

  UPDATE public.client_wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = v_user_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.wallet_transactions (user_id, type, amount, direction, description)
  VALUES (v_user_id, 'top_up', p_amount, 'credit', 'Ricarica crediti simulata');

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_client_wallet_balance()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RETURN 0; END IF;
  PERFORM public.ensure_client_wallet(v_user_id);
  SELECT balance INTO v_balance FROM public.client_wallets WHERE user_id = v_user_id;
  RETURN COALESCE(v_balance, 0);
END;
$$;

-- Hold credits on booking insert
CREATE OR REPLACE FUNCTION public.hold_booking_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
    RAISE EXCEPTION 'Importo prenotazione non valido';
  END IF;

  PERFORM public.ensure_client_wallet(NEW.client_id);

  SELECT balance INTO v_balance
  FROM public.client_wallets
  WHERE user_id = NEW.client_id
  FOR UPDATE;

  IF COALESCE(v_balance, 0) < NEW.total_amount THEN
    RAISE EXCEPTION 'Saldo crediti insufficiente. Ricarica il wallet per prenotare.';
  END IF;

  UPDATE public.client_wallets
  SET balance = balance - NEW.total_amount, updated_at = now()
  WHERE user_id = NEW.client_id;

  NEW.payment_status := 'held';
  NEW.payment_held_amount := NEW.total_amount;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hold_booking_payment ON public.bookings;
CREATE TRIGGER trg_hold_booking_payment
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.hold_booking_payment();

-- Log hold after insert (needs booking id)
CREATE OR REPLACE FUNCTION public.log_booking_payment_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'held' AND NEW.payment_held_amount IS NOT NULL THEN
    INSERT INTO public.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (
      NEW.client_id,
      NEW.id,
      'hold',
      NEW.payment_held_amount,
      'debit',
      'Crediti bloccati per prenotazione'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_booking_payment_hold ON public.bookings;
CREATE TRIGGER trg_log_booking_payment_hold
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_payment_hold();

-- Refund on cancellation
CREATE OR REPLACE FUNCTION public.refund_booking_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC;
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled'
     AND OLD.payment_status IN ('held', 'pending_release', 'disputed')
  THEN
    v_amount := COALESCE(OLD.payment_held_amount, OLD.total_amount);

    PERFORM public.ensure_client_wallet(OLD.client_id);

    UPDATE public.client_wallets
    SET balance = balance + v_amount, updated_at = now()
    WHERE user_id = OLD.client_id;

    INSERT INTO public.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (OLD.client_id, OLD.id, 'refund', v_amount, 'credit', 'Rimborso crediti per annullamento');

    NEW.payment_status := 'refunded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refund_booking_payment ON public.bookings;
CREATE TRIGGER trg_refund_booking_payment
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.refund_booking_payment();

-- Start pending release when service completed
CREATE OR REPLACE FUNCTION public.start_booking_payment_release()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND OLD.payment_status = 'held'
  THEN
    NEW.payment_status := 'pending_release';
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    NEW.dispute_deadline_at := COALESCE(NEW.completed_at, now()) + interval '5 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_start_booking_payment_release ON public.bookings;
CREATE TRIGGER trg_start_booking_payment_release
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.start_booking_payment_release();

-- Complete booking when tracking check-out completes
CREATE OR REPLACE FUNCTION public.complete_booking_on_tracking_checkout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.bookings
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = NEW.booking_id AND status IN ('confirmed', 'pending');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complete_booking_on_tracking ON public.booking_tracking;
CREATE TRIGGER trg_complete_booking_on_tracking
AFTER UPDATE ON public.booking_tracking
FOR EACH ROW
EXECUTE FUNCTION public.complete_booking_on_tracking_checkout();

-- Release payment to professional
CREATE OR REPLACE FUNCTION public.release_booking_payment(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_prof_user_id UUID;
BEGIN
  SELECT b.*, p.user_id AS prof_user_id
  INTO v_booking
  FROM public.bookings b
  JOIN public.professionals p ON p.id = b.professional_id
  WHERE b.id = p_booking_id
  FOR UPDATE OF b;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_booking.payment_status NOT IN ('pending_release') THEN RETURN FALSE; END IF;

  -- Block if open dispute
  IF EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.booking_id = p_booking_id
      AND d.status IN ('open', 'investigating', 'escalated')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Must be past dispute deadline
  IF v_booking.dispute_deadline_at IS NOT NULL AND v_booking.dispute_deadline_at > now() THEN
    RETURN FALSE;
  END IF;

  PERFORM public.ensure_professional_wallet(v_booking.professional_id, v_booking.prof_user_id);

  UPDATE public.professional_wallets
  SET balance = balance + v_booking.payment_held_amount, updated_at = now()
  WHERE professional_id = v_booking.professional_id;

  INSERT INTO public.wallet_transactions (
    user_id, professional_id, booking_id, type, amount, direction, description
  ) VALUES (
    v_booking.prof_user_id,
    v_booking.professional_id,
    p_booking_id,
    'release',
    v_booking.payment_held_amount,
    'credit',
    'Pagamento servizio completato'
  );

  UPDATE public.bookings
  SET payment_status = 'released', payment_released_at = now(), updated_at = now()
  WHERE id = p_booking_id;

  RETURN TRUE;
END;
$$;

-- Try release all eligible bookings for current user context
CREATE OR REPLACE FUNCTION public.process_pending_payment_releases()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_booking IN
    SELECT id FROM public.bookings
    WHERE payment_status = 'pending_release'
      AND dispute_deadline_at IS NOT NULL
      AND dispute_deadline_at <= now()
  LOOP
    IF public.release_booking_payment(v_booking.id) THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Suspend payment on dispute open
CREATE OR REPLACE FUNCTION public.suspend_payment_on_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  IF NEW.booking_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = NEW.booking_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- 5-day dispute window: from completion, or from scheduled date if not yet completed
  IF v_booking.completed_at IS NOT NULL THEN
    IF now() > v_booking.completed_at + interval '5 days' THEN
      RAISE EXCEPTION 'Termine per contestare scaduto (5 giorni dal completamento del servizio)';
    END IF;
  ELSIF v_booking.scheduled_date IS NOT NULL THEN
    IF now() > (v_booking.scheduled_date::timestamptz + interval '5 days') THEN
      RAISE EXCEPTION 'Termine per contestare scaduto (5 giorni dalla data del servizio)';
    END IF;
  END IF;

  IF v_booking.payment_status NOT IN ('held', 'pending_release') THEN
    RAISE EXCEPTION 'Non è possibile contestare il pagamento per questa prenotazione';
  END IF;

  IF v_booking.payment_status IN ('held', 'pending_release') THEN
    UPDATE public.bookings
    SET payment_status = 'disputed', updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suspend_payment_on_dispute ON public.disputes;
CREATE TRIGGER trg_suspend_payment_on_dispute
BEFORE INSERT ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.suspend_payment_on_dispute();

-- Admin resolve dispute payment
CREATE OR REPLACE FUNCTION public.resolve_dispute_payment(
  p_dispute_id UUID,
  p_favor TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute RECORD;
  v_booking RECORD;
  v_amount NUMERIC;
  v_prof_user_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo gli admin possono risolvere i pagamenti delle dispute';
  END IF;

  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id;
  IF NOT FOUND OR v_dispute.booking_id IS NULL THEN RETURN FALSE; END IF;

  SELECT b.*, p.user_id AS prof_user_id
  INTO v_booking
  FROM public.bookings b
  JOIN public.professionals p ON p.id = b.professional_id
  WHERE b.id = v_dispute.booking_id;

  v_amount := COALESCE(v_booking.payment_held_amount, v_booking.total_amount);

  IF p_favor = 'client' AND v_booking.payment_status IN ('disputed', 'pending_release', 'held') THEN
    PERFORM public.ensure_client_wallet(v_booking.client_id);
    UPDATE public.client_wallets
    SET balance = balance + v_amount, updated_at = now()
    WHERE user_id = v_booking.client_id;

    INSERT INTO public.wallet_transactions (user_id, booking_id, type, amount, direction, description)
    VALUES (v_booking.client_id, v_booking.id, 'dispute_refund', v_amount, 'credit', 'Rimborso da contestazione');

    UPDATE public.bookings SET payment_status = 'refunded', updated_at = now() WHERE id = v_booking.id;
    RETURN TRUE;

  ELSIF p_favor = 'professional' AND v_booking.payment_status IN ('disputed', 'pending_release', 'held') THEN
    PERFORM public.ensure_professional_wallet(v_booking.professional_id, v_booking.prof_user_id);
    UPDATE public.professional_wallets
    SET balance = balance + v_amount, updated_at = now()
    WHERE professional_id = v_booking.professional_id;

    INSERT INTO public.wallet_transactions (
      user_id, professional_id, booking_id, type, amount, direction, description
    ) VALUES (
      v_booking.prof_user_id, v_booking.professional_id, v_booking.id,
      'dispute_payout', v_amount, 'credit', 'Pagamento dopo contestazione'
    );

    UPDATE public.bookings
    SET payment_status = 'released', payment_released_at = now(), updated_at = now()
    WHERE id = v_booking.id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_wallet_top_up(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_wallet_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_pending_payment_releases() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dispute_payment(UUID, TEXT) TO authenticated;
