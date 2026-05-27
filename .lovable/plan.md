# Limite fatturato annuo senza P.IVA (5.000€)

## Obiettivo
Tracciare il fatturato annuo dei professionisti senza Partita IVA, avvisarli quando si avvicinano al limite di 5.000€/anno, e bloccare nuove prenotazioni se superano la soglia finché non registrano la P.IVA.

## Modifiche al database

**Tabella `professionals` — nuove colonne:**
- `has_vat_number` (boolean, default false) — indica se il professionista ha P.IVA
- `vat_number` (text, nullable) — numero P.IVA quando dichiarato
- `vat_registered_at` (timestamp, nullable) — data dichiarazione P.IVA
- `revenue_blocked` (boolean, default false) — flag di blocco automatico se supera 5k€ senza P.IVA

**Nuova funzione SQL `get_professional_annual_revenue(prof_id)`:**
- Somma `total_amount` dei `bookings` con status `completed` nell'anno solare corrente per quel professionista.

**Trigger su `bookings`:**
- Al cambio status a `completed`, ricalcola il fatturato annuo del professionista.
- Se professionista non ha P.IVA e fatturato ≥ 5.000€ → imposta `revenue_blocked = true`.

## Logica applicativa

**Lato professionista:**
- Banner in dashboard con barra di progresso fatturato annuo (es: "Hai fatturato 3.200€ / 5.000€ — 64%").
- Soglie di avviso:
  - ≥ 60% (3.000€): banner informativo giallo "Ti stai avvicinando al limite di 5k€/anno senza P.IVA"
  - ≥ 80% (4.000€): banner arancione + suggerimento di registrare P.IVA
  - ≥ 100% (5.000€): banner rosso bloccante — il professionista non può accettare nuove prenotazioni finché non dichiara la P.IVA
- Nuova pagina/sezione **"Dati Fiscali"** in profilo professionista: form per dichiarare P.IVA (numero + checkbox conferma). Salvataggio sblocca l'account.

**Blocco operativo:**
- In `useBookings` (accettazione prenotazione) e in `service_offers` (creazione offerta): se `revenue_blocked = true` e `has_vat_number = false`, blocca l'azione con toast esplicativo.
- RLS aggiornata su `bookings` (INSERT lato client) per impedire prenotazioni verso professionisti bloccati.

**Lato admin:**
- Nuova colonna nella pagina Professionisti che mostra: fatturato annuo, % della soglia, stato P.IVA, eventuale blocco.
- Admin può sbloccare manualmente in caso di necessità.

## File coinvolti

**Nuovi:**
- `supabase/migrations/...sql` (colonne, funzione, trigger)
- `src/hooks/useProfessionalRevenue.ts` (hook per leggere fatturato annuo + stato blocco)
- `src/components/professional/RevenueLimitBanner.tsx` (banner con progress bar)
- `src/pages/professional/profile/FiscalData.tsx` (form dichiarazione P.IVA)

**Modificati:**
- `src/pages/professional/Dashboard.tsx` (mostra banner)
- `src/pages/professional/Bookings.tsx` (blocco accettazione)
- `src/pages/professional/ServiceBoard.tsx` (blocco creazione offerta)
- `src/pages/professional/Profile.tsx` (link a Dati Fiscali)
- `src/pages/admin/Professionals.tsx` (colonna fatturato + sblocco)
- `src/App.tsx` (route nuova pagina)

## Conferme richieste
1. **Soglia 5.000€**: confermi che è il limite annuo solare (1 gen – 31 dic)?
2. **Validazione P.IVA**: basta dichiarazione testuale (numero + checkbox) o vuoi anche upload di un documento da approvare manualmente dall'admin?
3. **Blocco**: blocchiamo SOLO le nuove prenotazioni/offerte, oppure anche quelle già confermate non ancora completate?
