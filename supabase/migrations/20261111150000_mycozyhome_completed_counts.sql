-- Specifiche §3: l'ordinamento usa anche il numero di servizi completati. Solo il conteggio è pubblico.
CREATE FUNCTION mycozyhome.professional_completed_counts()
RETURNS TABLE (professional_id uuid, completed bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
  SELECT professional_id, count(*) FROM mycozyhome.bookings WHERE status = 'completed' GROUP BY professional_id;
$$;
GRANT EXECUTE ON FUNCTION mycozyhome.professional_completed_counts() TO anon, authenticated;
