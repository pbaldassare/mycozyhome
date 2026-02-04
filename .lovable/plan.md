
# Analisi Completa: Cosa Manca e Priorità di Implementazione

## Stato Attuale del Progetto

Il progetto CasaFacile ha una buona struttura base ma **molte funzionalità usano ancora dati mock** invece di essere connesse al database reale.

---

## 1. Funzionalità con Dati Mock (da connettere al DB)

### Lato Cliente

| Pagina | Stato | Problema |
|--------|-------|----------|
| `Home.tsx` | Mock | Professionisti consigliati sono hardcoded |
| `Search.tsx` | Mock | Lista professionisti non query dal DB |
| `Bookings.tsx` | Mock | Prenotazioni non lette dalla tabella `bookings` |
| `Messages.tsx` | Mock | Conversazioni hardcoded |
| `Chat.tsx` | Mock | Messaggi demo, no realtime |
| `Profile.tsx` | Mock | Utente "Marco Belli" hardcoded |
| `PaymentMethods.tsx` | Mock | Carte di credito fittizie |

### Lato Professionista

| Pagina | Stato | Problema |
|--------|-------|----------|
| `Home.tsx` | Mock | Stats e prenotazioni hardcoded |
| `Services.tsx` | Mock | Servizi non letti dal DB |
| `Reviews.tsx` | Mock | Recensioni fittizie |
| `Profile.tsx` | Mock | Portfolio e promozioni statiche |

### Funzionanti (connessi al DB)

- `ProfessionalDetail.tsx` - Legge professionista, servizi e recensioni dal DB
- `BookingNew.tsx` - Legge disponibilità e servizi dal DB
- `BookingConfirm.tsx` - Salva prenotazione nel DB
- `Favorites.tsx` - Sistema preferiti funzionante
- `Dashboard.tsx` (Professional) - Stato onboarding reale

---

## 2. Funzionalità Mancanti Critiche

### A. Sistema di Autenticazione Incompleto

**Problema**: Le pagine client usano un utente mock. Non c'è verifica dell'utente loggato.

**Soluzione**:
- Creare hook `useAuth` per gestire stato autenticazione
- Proteggere le rotte con redirect a login
- Mostrare dati reali dell'utente nel profilo

### B. Prenotazioni Reali (Lato Cliente)

**Problema**: `Bookings.tsx` mostra prenotazioni hardcoded.

**Soluzione**:
- Query alla tabella `bookings` filtrata per `client_id`
- Mostrare prenotazioni "In arrivo" e "Passate" reali
- Aggiungere pagina dettaglio prenotazione

### C. Gestione Prenotazioni (Lato Professionista)

**Problema**: Professionista non può vedere/gestire prenotazioni ricevute.

**Soluzione**:
- Query `bookings` filtrata per `professional_id`
- Pulsanti Accetta/Rifiuta funzionanti
- Aggiornamento stato prenotazione

### D. Chat Real-time

**Problema**: Chat usa messaggi mock, no connessione Supabase.

**Soluzione**:
- Usare hook `useChat` già esistente
- Collegare `Messages.tsx` a conversazioni reali
- Implementare creazione nuova conversazione

### E. Sistema Recensioni Completo

**Problema**: Cliente non può lasciare recensioni dopo servizio completato.

**Soluzione**:
- Mostrare pulsante "Lascia recensione" su prenotazioni completate
- Usare `ReviewForm` già esistente
- Salvare in tabella `reviews`

### F. Ricerca Professionisti Reale

**Problema**: `Search.tsx` mostra professionisti mock.

**Soluzione**:
- Query con filtri per servizio, zona, rating
- Ricerca testuale per nome
- Ordinamento per distanza/rating

---

## 3. Piano di Implementazione Prioritizzato

### Fase 1: Autenticazione e Dati Utente (Priorità Alta)
1. **Hook `useAuth`** - Gestione stato autenticazione globale
2. **Protected Routes** - Redirect automatico a login
3. **Profilo Cliente Reale** - Leggere dati da `auth.users` o creare tabella `profiles`

### Fase 2: Prenotazioni Complete (Priorità Alta)
4. **Lista Prenotazioni Cliente** - Query reali in `Bookings.tsx`
5. **Dettaglio Prenotazione** - Nuova pagina con azioni (contatta, annulla, recensisci)
6. **Gestione Prenotazioni Professionista** - Dashboard con richieste pending

### Fase 3: Ricerca e Professionisti (Priorità Media)
7. **Home Professionisti Consigliati** - Query con ordinamento per rating/distanza
8. **Search con Filtri Reali** - Ricerca nel DB con filtri attivi
9. **Servizi Professionista Reali** - `Services.tsx` connesso al DB

### Fase 4: Comunicazione (Priorità Media)
10. **Lista Messaggi Reale** - `Messages.tsx` con query a `conversations`
11. **Chat Real-time** - Collegare `Chat.tsx` a Supabase realtime
12. **Creazione Nuova Chat** - Da pagina professionista

### Fase 5: Recensioni e Pagamenti (Priorità Bassa)
13. **Lascia Recensione** - Da prenotazione completata
14. **Integrazione Stripe** - Pagamenti reali (richiede configurazione)
15. **Storico Pagamenti** - Query a tabella pagamenti

---

## 4. Suggerimenti Nuove Funzionalità

### Lato Cliente

| Funzionalità | Descrizione | Impatto UX |
|--------------|-------------|------------|
| **Notifiche Push** | Avvisi per conferme, promemoria | Alto |
| **Mappa Ricerca** | Visualizzare professionisti su mappa | Medio |
| **Riprenotazione Rapida** | "Prenota di nuovo" da storico | Alto |
| **Condividi Professionista** | Link per raccomandare | Basso |
| **Wallet Crediti** | Saldo per rimborsi/promo | Medio |

### Lato Professionista

| Funzionalità | Descrizione | Impatto UX |
|--------------|-------------|------------|
| **Calendario Visuale** | Vista settimanale appuntamenti | Alto |
| **Analytics Guadagni** | Grafici entrate mensili | Medio |
| **Risposte Rapide** | Template per chat | Medio |
| **Blocca Date** | Gestione ferie/indisponibilità | Alto |
| **Portfolio Foto** | Galleria lavori svolti | Medio |

---

## 5. Prossimi Passi Consigliati

Per completare il progetto in modo funzionale, suggerisco di procedere in questo ordine:

1. **Connettere Prenotazioni al DB** - È il cuore dell'app
2. **Autenticazione Completa** - Necessaria per tutto il resto
3. **Ricerca Reale** - Per permettere di trovare professionisti
4. **Chat Funzionante** - Comunicazione cliente-professionista
5. **Sistema Recensioni** - Fiducia e qualità del servizio

Ogni fase può essere implementata indipendentemente, ma le prime due sono prerequisiti per il resto.
