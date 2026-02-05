

# Piano: Correggere Login Professionisti - Schermate Cliente

## Problema

Quando un professionista fa login, viene mostrata la UI del cliente invece di quella del professionista.

### Causa Tecnica

Ci sono due pagine di login diverse con logiche differenti:

| Pagina | Redirect dopo login |
|--------|---------------------|
| `/login` | Controlla `user_roles` e reindirizza correttamente |
| `/professional/auth` | **Ignora** `user_roles`, va sempre a `/professional/dashboard` |

Il problema è che `/professional/auth` (riga 73) fa:
```typescript
navigate("/professional/dashboard");
```

Ma dovrebbe controllare la tabella `user_roles` come fa `/login`.

Inoltre, `useAuth.tsx` cerca sempre di creare/caricare un `client_profile` per tutti gli utenti - questo è corretto solo per i clienti, non per i professionisti.

## Soluzione

### 1. Correggere `/professional/auth` - Login professionisti

Modificare la logica di login per verificare il ruolo dalla tabella `user_roles`:

```typescript
// Dopo signInWithPassword
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", data.user.id)
  .maybeSingle();

const role = roleData?.role;

if (role === "professional") {
  // Controlla se ha completato l'onboarding
  const { data: prof } = await supabase
    .from("professionals")
    .select("profile_completed")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (prof?.profile_completed) {
    navigate("/professional");
  } else {
    navigate("/professional/onboarding/personal");
  }
} else if (role === "admin") {
  navigate("/admin");
} else {
  // Se non e' professionista, manda al client
  navigate("/client");
}
```

### 2. Correggere `useAuth.tsx` - Context Auth

Il context attualmente cerca sempre di creare un `client_profile` per tutti gli utenti.

Modificheremo per controllare prima il ruolo e caricare il profilo appropriato (client o professional).

### 3. Verificare `ProfessionalHome.tsx`

Assicurarsi che il redirect a `/professional/auth` avvenga solo quando necessario (non loggato), non quando il professionista esiste ma con `profile_completed: false`.

## File da Modificare

| File | Modifica |
|------|----------|
| `src/pages/professional/Auth.tsx` | Aggiungere controllo `user_roles` nel login |
| `src/hooks/useAuth.tsx` | Evitare creazione automatica `client_profile` per professionisti |
| `src/pages/professional/Home.tsx` | Correggere logica redirect se necessario |

## Risultato Atteso

| Account | Da `/login` | Da `/professional/auth` |
|---------|------------|------------------------|
| professionista@domesticdelight.app | `/professional/onboarding/personal` | `/professional/onboarding/personal` |
| cliente@domesticdelight.app | `/client` | `/client` (con messaggio) |
| admin@domesticdelight.app | `/admin` | `/admin` |

## Flusso Corretto

```text
Login Professionista
        │
        ▼
┌───────────────────┐
│ Autenticazione OK │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────┐
│ Query user_roles        │
│ per ottenere il ruolo   │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │ role = ?      │
    └───────┬───────┘
            │
  ┌─────────┼─────────┬──────────┐
  │         │         │          │
  ▼         ▼         ▼          ▼
admin   professional  client    null
  │         │         │          │
  ▼         ▼         ▼          ▼
/admin   Controlla   /client   /client
        onboarding
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
 completato?    non completato
    │               │
    ▼               ▼
/professional  /professional/
               onboarding/personal
```

