# Piano Implementazione CasaFacile

## Stato Aggiornato (4 Feb 2026)

### ✅ Fase 1 & 2 - COMPLETATE

| Task | Stato | File |
|------|-------|------|
| Hook `useAuth` | ✅ | `src/hooks/useAuth.tsx` |
| Tabella `client_profiles` | ✅ | Migration eseguita |
| Prenotazioni Reali | ✅ | `src/pages/client/Bookings.tsx` |
| Dettaglio Prenotazione | ✅ | `src/pages/client/BookingDetail.tsx` |
| Ricerca Reale | ✅ | `src/pages/client/Search.tsx` |
| Home Professionisti | ✅ | `src/pages/client/Home.tsx` |
| Profilo Cliente | ✅ | `src/pages/client/Profile.tsx` |

### ✅ Fase 3 - COMPLETATA

| Task | Stato | File |
|------|-------|------|
| Professionisti Consigliati | ✅ | `useFeaturedProfessionals` hook |
| Search con Filtri | ✅ | `useSearchProfessionals` hook |

---

### 🔄 Da Fare - Fase 4: Comunicazione

| Task | Priorità | Descrizione |
|------|----------|-------------|
| Lista Messaggi Reale | Media | `Messages.tsx` query `conversations` |
| Chat Real-time | Media | Collegare a Supabase realtime |
| Creazione Nuova Chat | Media | Da profilo professionista |

### 🔄 Da Fare - Fase 5: Professionista

| Task | Priorità | Descrizione |
|------|----------|-------------|
| Home Professionista | Media | Stats e prenotazioni reali |
| Gestione Servizi | Media | `Services.tsx` connesso al DB |
| Gestione Prenotazioni | Alta | Accetta/Rifiuta richieste |

### 🔄 Da Fare - Fase 6: Recensioni

| Task | Priorità | Descrizione |
|------|----------|-------------|
| Lascia Recensione | Media | Form da prenotazione completata |
| Le Mie Recensioni | Bassa | Lista recensioni lasciate |

---

## Nuovi File Creati

### Hook
- `src/hooks/useAuth.tsx` - Autenticazione globale con AuthProvider
- `src/hooks/useBookings.ts` - Query/mutations prenotazioni
- `src/hooks/useProfessionals.ts` - Ricerca professionisti

### Pagine
- `src/pages/client/BookingDetail.tsx` - Dettaglio con azioni

### Database
- Tabella `client_profiles` con RLS policies

---

## Prossimi Passi

1. ⬜ **Chat Real-time** - Messaggi in tempo reale
2. ⬜ **Gestione Prenotazioni Pro** - Accetta/Rifiuta
3. ⬜ **Sistema Recensioni** - Lascia e visualizza
