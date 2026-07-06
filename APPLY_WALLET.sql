-- MyCozyHome — Wallet top-up (minimal)
-- Esegui in Supabase Dashboard → SQL Editor (progetto Lovable Cloud)
-- Idempotente: puoi rieseguire senza errori.
--
-- Per il sistema pagamenti completo (prenotazioni, dispute, ecc.)
-- esegui anche: supabase/migrations/20260706150000_wallet_credit_payment_system.sql

-- Tabelle wallet
CREATE TABLE IF NOT EXISTS public.client_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- RLS
ALTER TABLE public.client_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own client wallet" ON public.client_wallets;
CREATE POLICY "Users can view own client wallet"
  ON public.client_wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.client_wallets;
CREATE POLICY "Admins can view all wallets"
  ON public.client_wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Helper: crea wallet se mancante
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

-- Ricarica simulata (demo)
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

GRANT EXECUTE ON FUNCTION public.simulate_wallet_top_up(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_wallet_balance() TO authenticated;
