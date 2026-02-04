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

### ✅ Fase 4 - COMPLETATA

| Task | Stato | File |
|------|-------|------|
| Lista Messaggi Reale | ✅ | `src/pages/client/Messages.tsx` |
| Chat Real-time | ✅ | `src/pages/client/Chat.tsx` |
| Creazione Nuova Chat | ✅ | `useCreateConversation` hook |

### ✅ Fase 5 - COMPLETATA

| Task | Stato | File |
|------|-------|------|
| Lascia Recensione | ✅ | `src/pages/client/BookingDetail.tsx` |
| Le Mie Recensioni | ✅ | `src/pages/client/profile/MyReviews.tsx` |

---

### 🔄 Da Fare - Fase 6: Professionista

| Task | Priorità | Descrizione |
|------|----------|-------------|
| Home Professionista | Media | Stats e prenotazioni reali |
| Gestione Servizi | Media | `Services.tsx` connesso al DB |
| Gestione Prenotazioni | Alta | Accetta/Rifiuta richieste |
| Chat Professionista | Media | Stesso sistema ma lato pro |

---

## File Creati/Modificati

### Hook
- `src/hooks/useAuth.tsx` - Autenticazione globale con AuthProvider
- `src/hooks/useBookings.ts` - Query/mutations prenotazioni
- `src/hooks/useProfessionals.ts` - Ricerca professionisti
- `src/hooks/useFavorites.ts` - Gestione preferiti
- `src/hooks/useConversations.ts` - Lista conversazioni e creazione nuove
- `src/hooks/useReviews.ts` - Gestione recensioni

### Pagine
- `src/pages/client/BookingDetail.tsx` - Dettaglio con azioni e recensioni
- `src/pages/client/Messages.tsx` - Lista conversazioni reali
- `src/pages/client/Chat.tsx` - Chat real-time con Supabase
- `src/pages/client/profile/MyReviews.tsx` - Recensioni lasciate
- `src/pages/client/profile/Favorites.tsx` - Professionisti preferiti

### Database
- Tabella `client_profiles` con RLS policies
- Tabella `favorites` con RLS policies

---

## Prossimi Passi

1. ⬜ **Gestione Prenotazioni Pro** - Accetta/Rifiuta richieste
2. ⬜ **Home Professionista Reale** - Stats e prenotazioni dal DB
3. ⬜ **Servizi Professionista** - Gestione servizi offerti
4. ⬜ **Integrazione Stripe** - Pagamenti reali
