
-- Add VAT and revenue tracking columns to professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS has_vat_number boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS vat_registered_at timestamptz,
  ADD COLUMN IF NOT EXISTS revenue_blocked boolean NOT NULL DEFAULT false;

-- Function: returns annual revenue (completed bookings, current calendar year)
CREATE OR REPLACE FUNCTION public.get_professional_annual_revenue(_prof_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0)::numeric
  FROM public.bookings
  WHERE professional_id = _prof_id
    AND status = 'completed'
    AND completed_at >= date_trunc('year', now())
    AND completed_at <  date_trunc('year', now()) + interval '1 year';
$$;

-- Trigger function: recompute and apply block when a booking is completed
CREATE OR REPLACE FUNCTION public.check_professional_revenue_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue numeric;
  v_has_vat boolean;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT has_vat_number INTO v_has_vat FROM public.professionals WHERE id = NEW.professional_id;
    IF v_has_vat = false THEN
      v_revenue := public.get_professional_annual_revenue(NEW.professional_id);
      IF v_revenue >= 5000 THEN
        UPDATE public.professionals
        SET revenue_blocked = true, updated_at = now()
        WHERE id = NEW.professional_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_revenue_limit ON public.bookings;
CREATE TRIGGER trg_check_revenue_limit
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_professional_revenue_limit();
