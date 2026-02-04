
# Piano: Correggere il Redirect Login per Professionisti

## Problema Identificato

Quando un professionista fa login, viene reindirizzato alle schermate del **cliente** invece che a quelle del **professionista**.

### Causa Tecnica

Il file `Login.tsx` (riga 58) controlla il ruolo dell'utente così:

```typescript
const role = data.user?.user_metadata?.role;
```

Ma `user_metadata` contiene solo `{ email_verified: true }` - **il campo `role` non esiste**.

I ruoli sono salvati correttamente nella tabella `user_roles`:

| email | role |
|-------|------|
| admin@domesticdelight.app | admin |
| professionista@domesticdelight.app | professional |
| cliente@domesticdelight.app | client |

Ma il login non consulta questa tabella, quindi tutti finiscono nel caso default → `/client`.

## Soluzione

Modificare `Login.tsx` per consultare la tabella `user_roles` invece di `user_metadata`:

```text
Prima:
  const role = data.user?.user_metadata?.role;

Dopo:
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();
  
  const role = roleData?.role;
```

## File da Modificare

| File | Modifica |
|------|----------|
| `src/pages/Login.tsx` | Cambiare la logica per leggere il ruolo dalla tabella `user_roles` |

## Flusso Corretto dopo la Modifica

```text
┌─────────────────────────────────────────────────────────┐
│                    LOGIN                                │
│                                                         │
│  1. Utente inserisce email + password                   │
│  2. Supabase autentica l'utente                        │
│  3. Query a user_roles per ottenere il ruolo           │
│                                                         │
│     ┌──────────────┬──────────────┬───────────────┐    │
│     │    admin     │ professional │    client     │    │
│     └──────┬───────┴──────┬───────┴───────┬───────┘    │
│            │              │               │            │
│            ▼              ▼               ▼            │
│        /admin      /professional      /client          │
└─────────────────────────────────────────────────────────┘
```

## Codice Completo della Modifica

Sostituiremo le righe 57-77 di `Login.tsx` con:

```typescript
// Check user role from user_roles table
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", data.user.id)
  .single();

const role = roleData?.role;

if (role === "professional") {
  // Check if professional has completed onboarding
  const { data: prof } = await supabase
    .from("professionals")
    .select("status, profile_completed")
    .eq("user_id", data.user.id)
    .single();

  if (prof?.profile_completed) {
    navigate("/professional");
  } else {
    navigate("/professional/onboarding/personal");
  }
} else if (role === "admin") {
  navigate("/admin");
} else {
  navigate("/client");
}
```

## Risultato Atteso

| Account | Redirect |
|---------|----------|
| `admin@domesticdelight.app` | `/admin` |
| `professionista@domesticdelight.app` | `/professional` |
| `cliente@domesticdelight.app` | `/client` |
