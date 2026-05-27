
DROP TRIGGER IF EXISTS trg_check_revenue_limit ON public.bookings;
CREATE TRIGGER trg_check_revenue_limit
AFTER INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.check_professional_revenue_limit();
