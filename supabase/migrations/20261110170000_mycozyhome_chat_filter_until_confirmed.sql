-- Specifiche §8 (TU 6.2, TP 8.1): contatti oscurati solo fino alla conferma della prenotazione.
CREATE OR REPLACE FUNCTION mycozyhome.filter_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'mycozyhome'
    AS $$
DECLARE v_conv mycozyhome.conversations; v_prof_user uuid; v_clean text; v_original text;
BEGIN
  SELECT * INTO v_conv FROM mycozyhome.conversations WHERE id = NEW.conversation_id;
  SELECT user_id INTO v_prof_user FROM mycozyhome.professionals WHERE id = v_conv.professional_id;
  IF NEW.sender_type <> 'system' OR auth.uid() IS NOT NULL THEN
    NEW.sender_type := CASE WHEN NEW.sender_id = v_conv.client_id THEN 'client'
                            WHEN NEW.sender_id = v_prof_user THEN 'professional'
                            ELSE NEW.sender_type END;
  END IF;
  v_original := COALESCE(NEW.original_content, NEW.content);
  NEW.original_content := NULL;

  -- Dopo una prenotazione confermata tra i due, i contatti si possono scambiare.
  IF EXISTS (SELECT 1 FROM mycozyhome.bookings b
             WHERE b.client_id = v_conv.client_id AND b.professional_id = v_conv.professional_id
               AND b.status IN ('confirmed', 'completed')) THEN
    NEW.content := v_original;
    NEW.is_blocked := false;
    RETURN NEW;
  END IF;

  v_clean := v_original;
  v_clean := regexp_replace(v_clean, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email nascosta]', 'g');
  v_clean := regexp_replace(v_clean, '(https?://|www\.)[^[:space:]]+', '[link rimosso]', 'gi');
  v_clean := regexp_replace(v_clean, '[A-Za-z0-9-]+\.(com|it|org|net|io|app|co|info|biz|eu)([/?#][^[:space:]]*)?([[:space:]]|$)', '[link rimosso]\3', 'gi');
  v_clean := regexp_replace(v_clean, '(\+?[0-9]{1,4}[ .-]?)?\(?[0-9]{2,4}\)?[ .-]?[0-9]{3,4}[ .-]?[0-9]{3,4}', '[numero nascosto]', 'g');
  NEW.content := v_clean;
  NEW.is_blocked := v_clean <> v_original
    OR v_original ~* '(chiamami|contattami|scrivimi su|whatsapp|telegram|messenger|instagram|facebook|il mio numero|la mia e?mail)';
  IF NEW.is_blocked THEN
    INSERT INTO mycozyhome.message_moderation (message_id, conversation_id, sender_id, original_content)
    VALUES (NEW.id, NEW.conversation_id, NEW.sender_id, v_original);
  END IF;
  RETURN NEW;
END; $$;
