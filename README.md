# MyCozyHome

Web app (PWA) che mette in contatto clienti e professionisti per i servizi per la casa: pulizie, stiratura, riordino, cura di piante e animali. Ha tre aree: cliente, professionista e admin, con prenotazioni, chat, crediti, incassi, contestazioni e assistenza.

## Stack

- React 18 + TypeScript, Vite, Tailwind CSS e shadcn/ui
- TanStack Query, React Router, PWA con `vite-plugin-pwa`
- Supabase (auth, Postgres, storage, edge functions) tramite `@supabase/supabase-js`
- Test con Vitest e test SQL sul database

## Avvio in locale

```bash
cp .env.example .env   # poi compila i valori
npm install
npm run dev            # http://localhost:8080
```

Altri comandi:

```bash
npm run build      # build di produzione in dist/
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Vitest (funzioni pure)
npm run test:db    # test di sicurezza sul DB, in una transazione annullata
npm run gen:types  # rigenera src/integrations/supabase/types.ts
```

La CI su GitHub (`.github/workflows/ci.yml`) esegue lint, typecheck, test e build a ogni push.

## Supabase

L'app usa il progetto Supabase condiviso `yjzeujiozbgrlqwwycik`, dove tutti i dati di MyCozyHome stanno nello schema dedicato `mycozyhome` (il client lo imposta in `src/integrations/supabase/client.ts`). Gli altri schemi e l'autenticazione sono condivisi con altre app: non vanno toccati, e un account di un'altra app entra su MyCozyHome solo se sceglie di usarlo come cliente.

- Migrazioni: `supabase/migrations/`. Da `20261031150000_mycozyhome_schema.sql` in poi lavorano sullo schema `mycozyhome`; le precedenti sono la storia dello schema originale e servono solo come riferimento.
- Regole di sicurezza principali:
  - le funzioni del DB non sono eseguibili per default: ogni RPC usata dal client ha il suo `GRANT EXECUTE`;
  - prenotazioni create, confermate e annullate solo da RPC (`create_booking`, `professional_set_booking_status`, `cancel_booking`) che calcolano prezzi e sconti;
  - colonne di stato e moderazione modificabili solo dall'admin (trigger `guard_*`);
  - i dati personali dei professionisti si leggono solo dalla vista `professional_private` (il proprio profilo, o tutti per l'admin); quelli dei clienti visibili ai professionisti sono in `client_public`.
- Job pianificati (pg_cron): rilascio dei pagamenti ogni 15 minuti, cancellazione dei ping GPS oltre 30 giorni.
- Edge functions: `supabase/functions/`, con prefisso `mycozyhome-`, richiedono un utente con login. Deploy:

  ```bash
  supabase functions deploy mycozyhome-geo-service --project-ref yjzeujiozbgrlqwwycik --use-api
  ```

- Bucket storage privati con prefisso `mycozyhome-`: nel DB si salva il percorso del file, l'app crea URL firmati brevi.
- Il segreto `GOOGLE_MAPS_API_KEY` delle edge functions si imposta nella dashboard Supabase.
- La ricarica simulata dei crediti si attiva o disattiva dall'admin (Impostazioni); i codici promo stanno nella tabella `promo_codes`.
