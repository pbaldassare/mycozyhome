
-- Rimuovo temporaneamente il vincolo FK per inserire dati fake
ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS professionals_user_id_fkey;
ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS professionals_user_id_key;

-- Inserisco professionisti fake con status approved
INSERT INTO public.professionals (id, user_id, first_name, last_name, email, phone, city, province, postal_code, bio, status, average_rating, review_count, years_experience, profile_completed, documents_submitted)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Maria', 'Rossi', 'maria.rossi@email.com', '+39 333 1234567', 'Milano', 'MI', '20100', 'Professionista delle pulizie con 8 anni di esperienza. Specializzata in pulizie profonde e sanificazione. Attenta ai dettagli e molto affidabile.', 'approved', 4.8, 24, 8, true, true),
  ('a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Giuseppe', 'Bianchi', 'giuseppe.bianchi@email.com', '+39 334 2345678', 'Milano', 'MI', '20121', 'Esperto in pulizie domestiche e stiro. Lavoro con passione e precisione da oltre 5 anni.', 'approved', 4.6, 18, 5, true, true),
  ('a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Francesca', 'Verdi', 'francesca.verdi@email.com', '+39 335 3456789', 'Roma', 'RM', '00185', 'Babysitter certificata con esperienza in famiglie con bambini da 0 a 10 anni. Paziente e creativa.', 'approved', 4.9, 32, 6, true, true),
  ('a4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Luca', 'Neri', 'luca.neri@email.com', '+39 336 4567890', 'Roma', 'RM', '00100', 'Dog sitter appassionato. Adoro gli animali e ho esperienza con cani di tutte le taglie.', 'approved', 4.7, 15, 4, true, true),
  ('a5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Anna', 'Colombo', 'anna.colombo@email.com', '+39 337 5678901', 'Torino', 'TO', '10100', 'Specializzata in pulizie ufficio e sanificazione ambienti. Lavoro anche nei weekend.', 'approved', 4.5, 21, 7, true, true),
  ('a6666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Marco', 'Ferrari', 'marco.ferrari@email.com', '+39 338 6789012', 'Napoli', 'NA', '80100', 'Tuttofare per la casa. Pulizie, stiro e piccole riparazioni. Massima disponibilità.', 'approved', 4.4, 12, 3, true, true),
  ('a7777777-7777-7777-7777-777777777777', 'b7777777-7777-7777-7777-777777777777', 'Sofia', 'Russo', 'sofia.russo@email.com', '+39 339 7890123', 'Milano', 'MI', '20145', 'Pulizie eco-friendly con prodotti naturali. Rispetto per l ambiente e la tua casa.', 'approved', 4.8, 28, 5, true, true),
  ('a8888888-8888-8888-8888-888888888888', 'b8888888-8888-8888-8888-888888888888', 'Paolo', 'Gallo', 'paolo.gallo@email.com', '+39 340 8901234', 'Bologna', 'BO', '40100', 'Stiro professionale a domicilio. Capi perfetti in poco tempo.', 'approved', 4.6, 16, 4, true, true)
ON CONFLICT (id) DO NOTHING;

-- Inserisco servizi per ogni professionista
INSERT INTO public.professional_services (professional_id, service_type, hourly_rate, description, min_hours, years_experience, is_active)
VALUES
  -- Maria Rossi - Pulizie
  ('a1111111-1111-1111-1111-111111111111', 'cleaning', 15, 'Pulizie complete della casa con prodotti professionali', 2, 8, true),
  ('a1111111-1111-1111-1111-111111111111', 'sanitization', 20, 'Sanificazione ambienti con prodotti certificati', 2, 5, true),
  -- Giuseppe Bianchi - Pulizie e stiro
  ('a2222222-2222-2222-2222-222222222222', 'cleaning', 14, 'Pulizie domestiche accurate', 2, 5, true),
  ('a2222222-2222-2222-2222-222222222222', 'ironing', 12, 'Stiro professionale di ogni tipo di tessuto', 1, 5, true),
  -- Francesca Verdi - Babysitter
  ('a3333333-3333-3333-3333-333333333333', 'babysitter', 12, 'Babysitting con attività educative e creative', 3, 6, true),
  -- Luca Neri - Dog sitter
  ('a4444444-4444-4444-4444-444444444444', 'dog_sitter', 10, 'Passeggiate e cura di cani di tutte le taglie', 2, 4, true),
  -- Anna Colombo - Ufficio e sanificazione
  ('a5555555-5555-5555-5555-555555555555', 'office_cleaning', 18, 'Pulizie uffici e spazi commerciali', 3, 7, true),
  ('a5555555-5555-5555-5555-555555555555', 'sanitization', 22, 'Sanificazione professionale ambienti lavorativi', 2, 5, true),
  -- Marco Ferrari - Tuttofare
  ('a6666666-6666-6666-6666-666666666666', 'cleaning', 13, 'Pulizie generali della casa', 2, 3, true),
  ('a6666666-6666-6666-6666-666666666666', 'ironing', 11, 'Servizio di stiro a domicilio', 1, 2, true),
  -- Sofia Russo - Eco-friendly
  ('a7777777-7777-7777-7777-777777777777', 'cleaning', 16, 'Pulizie eco-friendly con prodotti naturali al 100%', 2, 5, true),
  -- Paolo Gallo - Stiro
  ('a8888888-8888-8888-8888-888888888888', 'ironing', 13, 'Stiro impeccabile per camicie, pantaloni e abiti', 1, 4, true);

-- Inserisco disponibilità per i professionisti
INSERT INTO public.professional_availability (professional_id, day_of_week, start_time, end_time, is_available)
VALUES
  -- Maria Rossi - Lun-Ven 8-18
  ('a1111111-1111-1111-1111-111111111111', 1, '08:00', '18:00', true),
  ('a1111111-1111-1111-1111-111111111111', 2, '08:00', '18:00', true),
  ('a1111111-1111-1111-1111-111111111111', 3, '08:00', '18:00', true),
  ('a1111111-1111-1111-1111-111111111111', 4, '08:00', '18:00', true),
  ('a1111111-1111-1111-1111-111111111111', 5, '08:00', '18:00', true),
  -- Giuseppe Bianchi - Lun-Sab 9-17
  ('a2222222-2222-2222-2222-222222222222', 1, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', 2, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', 3, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', 4, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', 5, '09:00', '17:00', true),
  ('a2222222-2222-2222-2222-222222222222', 6, '09:00', '14:00', true),
  -- Francesca Verdi - Disponibile tutti i giorni
  ('a3333333-3333-3333-3333-333333333333', 1, '07:00', '20:00', true),
  ('a3333333-3333-3333-3333-333333333333', 2, '07:00', '20:00', true),
  ('a3333333-3333-3333-3333-333333333333', 3, '07:00', '20:00', true),
  ('a3333333-3333-3333-3333-333333333333', 4, '07:00', '20:00', true),
  ('a3333333-3333-3333-3333-333333333333', 5, '07:00', '20:00', true),
  ('a3333333-3333-3333-3333-333333333333', 6, '08:00', '18:00', true),
  ('a3333333-3333-3333-3333-333333333333', 0, '08:00', '18:00', true),
  -- Sofia Russo - Lun-Ven
  ('a7777777-7777-7777-7777-777777777777', 1, '08:30', '17:30', true),
  ('a7777777-7777-7777-7777-777777777777', 2, '08:30', '17:30', true),
  ('a7777777-7777-7777-7777-777777777777', 3, '08:30', '17:30', true),
  ('a7777777-7777-7777-7777-777777777777', 4, '08:30', '17:30', true),
  ('a7777777-7777-7777-7777-777777777777', 5, '08:30', '17:30', true);

-- Inserisco aree di copertura
INSERT INTO public.professional_areas (professional_id, city, province, max_distance_km)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Milano', 'MI', 15),
  ('a2222222-2222-2222-2222-222222222222', 'Milano', 'MI', 10),
  ('a3333333-3333-3333-3333-333333333333', 'Roma', 'RM', 20),
  ('a4444444-4444-4444-4444-444444444444', 'Roma', 'RM', 25),
  ('a5555555-5555-5555-5555-555555555555', 'Torino', 'TO', 15),
  ('a6666666-6666-6666-6666-666666666666', 'Napoli', 'NA', 12),
  ('a7777777-7777-7777-7777-777777777777', 'Milano', 'MI', 10),
  ('a8888888-8888-8888-8888-888888888888', 'Bologna', 'BO', 15);
