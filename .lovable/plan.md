

# Sistema di Geolocalizzazione per Verifica Presenze

## Obiettivo
Aggiungere un sistema di check-in/check-out geolocalizzato per i professionisti, in modo da registrare che il professionista si sia effettivamente recato dal cliente e sia rimasto per le ore previste.

## Come funziona

### Lato Professionista
Quando una prenotazione e' in stato "confermato" e il giorno della prenotazione e' oggi:
1. Appare un pulsante **"Check-in - Sono arrivato"** sulla card della prenotazione
2. Cliccando, l'app rileva la posizione GPS del professionista e la confronta con l'indirizzo del cliente
3. Se la distanza e' entro un raggio accettabile (es. 500 metri), il check-in viene registrato con successo
4. Se troppo lontano, viene mostrato un avviso ma il check-in viene comunque registrato (con flag "fuori zona")
5. Al termine del lavoro, il professionista clicca **"Check-out - Ho finito"**, che registra di nuovo la posizione e l'orario
6. Il sistema calcola automaticamente le ore effettive lavorate e le confronta con quelle previste

### Lato Admin
Nella sezione prenotazioni, l'admin puo' vedere:
- Orario di check-in e check-out
- Se il professionista era nella zona corretta
- Ore effettive vs ore previste
- Eventuali anomalie (check-in lontano, ore inferiori al previsto)

### Lato Cliente
Nel dettaglio prenotazione, il cliente vede lo stato di tracking (il professionista ha fatto check-in, ecc.)

---

## Dettagli Tecnici

### 1. Nuova tabella `booking_tracking`

```text
booking_tracking
+---------------------+------------------+
| Campo               | Tipo             |
+---------------------+------------------+
| id                  | uuid (PK)        |
| booking_id          | uuid (FK)        |
| professional_id     | uuid             |
| check_in_at         | timestamptz      |
| check_in_latitude   | numeric          |
| check_in_longitude  | numeric          |
| check_in_distance_m | numeric          |
| check_in_in_range   | boolean          |
| check_out_at        | timestamptz      |
| check_out_latitude  | numeric          |
| check_out_longitude | numeric          |
| check_out_distance_m| numeric          |
| check_out_in_range  | boolean          |
| actual_hours        | numeric          |
| status              | text             |
| created_at          | timestamptz      |
+---------------------+------------------+
```

RLS: i professionisti possono inserire/aggiornare i propri record, admin puo' leggere tutto, i clienti possono leggere i record delle proprie prenotazioni.

### 2. Hook `useBookingTracking`
- Gestisce la logica di check-in/check-out
- Usa `navigator.geolocation` per ottenere la posizione corrente
- Calcola la distanza dal punto della prenotazione (usando la formula Haversine gia' presente in `useGeolocation.ts`)
- Inserisce/aggiorna i record nella tabella `booking_tracking`

### 3. Modifiche UI - Professional Bookings
- Nella card delle prenotazioni confermate di oggi: pulsanti "Check-in" / "Check-out"
- Badge di stato del tracking (non ancora iniziato, in corso, completato)
- Indicatore visivo se in zona o fuori zona

### 4. Modifiche UI - Client BookingDetail
- Sezione "Stato presenza" che mostra check-in/check-out del professionista

### 5. Modifiche UI - Admin Bookings
- Colonna/badge con stato tracking
- Dettaglio con orari e distanze

### File coinvolti
- **Nuovo**: migrazione SQL per tabella `booking_tracking`
- **Nuovo**: `src/hooks/useBookingTracking.ts`
- **Modifica**: `src/pages/professional/Bookings.tsx` (pulsanti check-in/check-out)
- **Modifica**: `src/pages/client/BookingDetail.tsx` (stato tracking)
- **Modifica**: `src/pages/admin/Bookings.tsx` (visibilita' tracking)

