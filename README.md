# MyCozyHome

Web app (PWA) che mette in contatto clienti e professionisti per i servizi per la casa: pulizie, stiro, babysitter e altro. Ha tre aree: cliente, professionista e admin, con prenotazioni, chat, wallet a crediti, dispute e shop.

## Stack

- React 18 + TypeScript, Vite, Tailwind CSS e shadcn/ui
- TanStack Query, React Router, PWA con `vite-plugin-pwa`
- Supabase (auth, Postgres, storage, edge functions) tramite `@supabase/supabase-js`
- Test con Vitest

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
npm test           # Vitest
npx tsc --noEmit -p tsconfig.app.json   # typecheck
```

## Supabase

L'app usa il progetto Supabase condiviso `yjzeujiozbgrlqwwycik`, dove tutti i dati di MyCozyHome stanno nello schema dedicato `mycozyhome` (il client lo imposta in `src/integrations/supabase/client.ts`). Gli altri schemi del progetto appartengono ad altre app: non vanno toccati.

- Migrazioni: `supabase/migrations/`. Da `20261031150000_mycozyhome_schema.sql` in poi lavorano sullo schema `mycozyhome`; le precedenti sono la storia dello schema originale in `public` e servono solo come riferimento.
- Edge functions: `supabase/functions/`, con prefisso `mycozyhome-` (`create-user`, `geo-service`, `get-maps-key`, `match-professionals`). Deploy:

  ```bash
  supabase functions deploy mycozyhome-geo-service --project-ref yjzeujiozbgrlqwwycik --use-api
  ```

- Bucket storage con prefisso `mycozyhome-`.
- Il segreto `GOOGLE_MAPS_API_KEY` delle edge functions si imposta nella dashboard Supabase.
- Tipi TypeScript: `supabase gen types typescript --project-id yjzeujiozbgrlqwwycik --schema mycozyhome > src/integrations/supabase/types.ts`, poi nella riga `type DefaultSchema` sostituisci `"public"` con `"mycozyhome"`.
