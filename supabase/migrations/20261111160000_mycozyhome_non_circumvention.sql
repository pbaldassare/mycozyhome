-- Specifiche §8 (TP 9.10, PT): registro del primo servizio per ogni coppia cliente-professionista
-- (periodo di non aggiramento 12 mesi) e richiesta di "quota di riscatto" da 2.000 €.
CREATE TABLE mycozyhome.client_pro_relations (
  client_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  first_service_at timestamptz NOT NULL,
  buyout_requested_at timestamptz,
  buyout_amount numeric,
  buyout_paid_at timestamptz,
  PRIMARY KEY (client_id, professional_id)
);
ALTER TABLE mycozyhome.client_pro_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro and admin view relations" ON mycozyhome.client_pro_relations FOR SELECT TO authenticated
  USING (professional_id = mycozyhome.my_professional_id() OR mycozyhome.is_admin());
GRANT SELECT ON mycozyhome.client_pro_relations TO authenticated;

CREATE FUNCTION mycozyhome.record_first_service() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    INSERT INTO mycozyhome.client_pro_relations (client_id, professional_id, first_service_at)
    VALUES (NEW.client_id, NEW.professional_id, COALESCE(NEW.completed_at, now()))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_record_first_service AFTER UPDATE OF status ON mycozyhome.bookings
  FOR EACH ROW EXECUTE FUNCTION mycozyhome.record_first_service();

INSERT INTO mycozyhome.client_pro_relations (client_id, professional_id, first_service_at)
SELECT client_id, professional_id, min(COALESCE(completed_at, updated_at))
FROM mycozyhome.bookings WHERE status = 'completed' AND client_id IS NOT NULL
GROUP BY client_id, professional_id
ON CONFLICT DO NOTHING;

-- Il professionista comunica che vuole continuare fuori piattaforma con un cliente.
-- ponytail: l'addebito vero arriva con Stripe; per ora l'admin segna la quota come pagata.
CREATE FUNCTION mycozyhome.request_buyout(p_client_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  UPDATE mycozyhome.client_pro_relations
  SET buyout_requested_at = now(), buyout_amount = 2000
  WHERE client_id = p_client_id AND professional_id = mycozyhome.my_professional_id()
    AND buyout_requested_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.request_buyout(uuid) TO authenticated;

CREATE FUNCTION mycozyhome.mark_buyout_paid(p_client_id uuid, p_professional_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
BEGIN
  IF NOT mycozyhome.is_admin() THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
  UPDATE mycozyhome.client_pro_relations SET buyout_paid_at = now()
  WHERE client_id = p_client_id AND professional_id = p_professional_id AND buyout_requested_at IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'FC_NOT_FOUND'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION mycozyhome.mark_buyout_paid(uuid, uuid) TO authenticated;
