## Contesto

- **GitHub sync**: Lovable ha sync bidirezionale automatico con GitHub. I file delle migration `20260706120000_user_platform_block.sql` e `20260706150000_wallet_credit_payment_system.sql` sono già presenti nel repo del progetto (verificato in `supabase/migrations/`). Non serve un'operazione di pull manuale.
- **Stato DB remoto** (verificato via `psql`):
  - `public.client_wallets` / `public.wallet_transactions`: **non esistono**
  - Colonne `payment_status`, `payment_held_amount`, `dispute_deadline_at`, `payment_released_at` su `bookings`: **assenti**
  - Colonna `is_blocked` su `client_profiles`: **assente**
  - Funzioni `simulate_wallet_top_up`, `get_client_wallet_balance`, `process_pending_payment_releases`, `resolve_dispute_payment`: **non presenti**

Quindi entrambe le migration vanno applicate. Il frontend NON viene toccato.

## Piano

1. **Migration 1 — Blocco piattaforma utenti** (`20260706120000_user_platform_block.sql`)
   Applicata via tool migration. Aggiunge `is_blocked`, `blocked_at`, `blocked_reason`, `blocked_by` a `client_profiles` e `professionals`, con le relative RLS/policy per admin.

2. **Migration 2 — Sistema wallet a crediti** (`20260706150000_wallet_credit_payment_system.sql`)
   Applicata via tool migration subito dopo. Crea:
   - Tabelle: `client_wallets`, `professional_wallets`, `wallet_transactions` (con GRANT + RLS + policy)
   - Colonne su `bookings`: `payment_status`, `payment_held_amount`, `dispute_deadline_at`, `payment_released_at`
   - RPC: `ensure_client_wallet`, `simulate_wallet_top_up`, `get_client_wallet_balance`, `hold_booking_payment`, `refund_booking_payment`, `release_booking_payment`, `process_pending_payment_releases`, `resolve_dispute_payment`

   Entrambi gli script sono già idempotenti (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`).

   > Nota: `APPLY_WALLET.sql` alla root è un sottoinsieme della migration 2. Applicando direttamente la migration 2 completa non serve eseguirlo separatamente.

3. **Verifica post-migration** (SELECT read-only):
   - Tabelle wallet presenti
   - Colonne pagamento su `bookings` presenti
   - Colonne `is_blocked` presenti su `client_profiles` e `professionals`
   - Funzioni RPC presenti
   - Test funzionale `simulate_wallet_top_up` via `curl` all'endpoint PostgREST usando la anon key + un access token utente **non è possibile senza credenziali test**: la verifica end-to-end della ricarica va fatta dall'utente in `/client/profile/payments` (basta un login cliente e cliccare "+ €20"). Confermerò comunque che l'RPC esista ed è eseguibile dai ruoli corretti.

## Cosa NON farò

- Nessuna modifica al frontend (già allineato).
- Nessun `pg_dump` / export.
- Non modificherò `APPLY_WALLET.sql` né i file di migration.

## Output finale atteso

Messaggio di conferma con: (1) codice già sincronizzato via GitHub sync, (2) le due migration applicate, (3) checklist di verifica DB + istruzioni brevi per il test manuale della ricarica in `/client/profile/payments`.
