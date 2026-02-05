
# Piano: Correggere Visualizzazione Prenotazioni e Chat - Lato Professionista

## Problema Identificato

Le pagine dei **Messaggi/Chat** e altre funzionalità non vengono visualizzate per i professionisti perché c'è un bug nella query delle conversazioni.

## Analisi Tecnica

### Causa del Bug

Nel file `src/hooks/useConversations.ts` (riga 61), la query usa `user.id` (l'ID dell'utente autenticato) per cercare le conversazioni:

```typescript
// CODICE ATTUALE (SBAGLIATO)
const column = userType === "client" ? "client_id" : "professional_id";
.eq(column, user.id)  // ❌ SBAGLIATO per i professionisti!
```

**Problema:** Il campo `professional_id` nella tabella `conversations` contiene l'ID della tabella `professionals`, **NON** l'`user_id` dell'autenticazione.

### Prova dal Database

| Tabella | Campo | Valore Esempio |
|---------|-------|----------------|
| `professionals` | `id` (professional_id) | `a3333333-3333-3333-3333-333333333333` |
| `professionals` | `user_id` (auth user) | `b3333333-3333-3333-3333-333333333333` |
| `conversations` | `professional_id` | `a1111111-1111-1111-1111-111111111111` (usa professionals.id!) |

### Impatto

| Pagina | Funziona? | Motivo |
|--------|-----------|--------|
| `/professional/bookings` | ✅ Sì | Usa `useProfessionalProfile()` correttamente |
| `/professional/messages` | ❌ No | Usa `user.id` invece di `professional.id` |
| `/professional/chat/:id` | ⚠️ Parziale | Funziona se si accede con ID diretto |
| Home dashboard | ✅ Sì | Usa `useProfessionalProfile()` |

## Soluzione

### 1. Modificare `useConversations` hook

Il hook deve prima recuperare il `professional.id` dal `user.id`, poi usare quello per cercare le conversazioni:

```typescript
// LOGICA CORRETTA
if (userType === "professional") {
  // 1. Prima: recupera professional.id dall'user.id
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  
  if (!professional) return;
  
  // 2. Poi: usa professional.id per cercare conversazioni
  const { data } = await supabase
    .from("conversations")
    .select(...)
    .eq("professional_id", professional.id);
}
```

### 2. File da Modificare

| File | Modifica |
|------|----------|
| `src/hooks/useConversations.ts` | Correggere query per professionisti: prima recuperare `professionals.id` dall'`user_id`, poi usare quello per filtrare |

## Flusso Corretto

```text
Professionista apre Messaggi
         │
         ▼
┌─────────────────────────┐
│ useConversations()      │
│ userType = "professional"│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Query professionals     │
│ WHERE user_id = auth.id │
│ → Ottieni professional.id│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Query conversations     │
│ WHERE professional_id = │
│   professional.id       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Mostra lista conversazioni│
│ con tutti i clienti     │
└─────────────────────────┘
```

## Nota sulla Pagina Prenotazioni

La pagina `/professional/bookings` **funziona già correttamente** perché usa `useProfessionalProfile()` per ottenere il `professional.id` prima di fare le query:

```typescript
// In ProfessionalBookings.tsx - GIÀ CORRETTO
const { data: professional } = useProfessionalProfile();
const { data: bookings } = useAllProfessionalBookings(professional?.id);
```

Se non vedi le prenotazioni, potrebbe essere perché non ci sono prenotazioni associate a quel professionista nel database.

## Risultato Atteso

Dopo la correzione:
- La pagina **Messaggi** mostrerà tutte le conversazioni del professionista
- La navigazione alla **Chat** funzionerà correttamente
- Le **Prenotazioni** continueranno a funzionare come prima
