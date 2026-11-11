-- TU 6.1 / TP 12.1: la disponibilità nella data scelta entra nell'ordinamento della ricerca.
-- Prima gli orari settimanali li leggeva solo il professionista (anche BookingNew li riceveva vuoti).
CREATE POLICY "Anyone can view availability of approved professionals" ON mycozyhome.professional_availability
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM mycozyhome.professionals p WHERE p.id = professional_id AND p.status = 'approved'));
GRANT SELECT ON mycozyhome.professional_availability TO anon, authenticated;
