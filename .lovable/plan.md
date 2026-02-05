
# Piano: Aggiungere Pagine Profilo Professionista Mancanti

## Problemi Identificati

| Problema | Causa |
|----------|-------|
| Rotella Settings → 404 | La route `/professional/settings` non esiste in App.tsx |
| Manca modifica anagrafica | Non esiste una pagina dedicata per modificare i dati personali del professionista |
| Manca modifica preferenze | Non esiste una sezione preferenze per il professionista |

## Soluzione

Creeremo una struttura simile a quella del cliente (`src/pages/client/profile/`):

```text
src/pages/professional/
├── profile/
│   ├── PersonalData.tsx    ← Modifica anagrafica
│   ├── Settings.tsx        ← Impostazioni (tema, lingua)
│   └── Preferences.tsx     ← Preferenze (notifiche, visibilità)
├── Profile.tsx             ← Aggiungere menu con link alle nuove pagine
└── ...
```

## File da Creare

### 1. `src/pages/professional/profile/PersonalData.tsx`
Pagina per modificare i dati anagrafici del professionista:
- Nome, Cognome, Telefono
- Data di nascita, Codice Fiscale
- Indirizzo, Città, Provincia, CAP
- Bio/Descrizione

Riutilizzerà la logica di `onboarding/PersonalInfo.tsx` ma senza il flusso di onboarding.

### 2. `src/pages/professional/profile/Settings.tsx`
Pagina impostazioni con:
- Selezione tema (Chiaro/Scuro/Sistema)
- Selezione lingua
- Informazioni app

### 3. `src/pages/professional/profile/Preferences.tsx`
Pagina preferenze con:
- Notifiche push (on/off)
- Notifiche email (on/off)
- Visibilità profilo (on/off)
- Raggio massimo di lavoro

## File da Modificare

### 1. `src/pages/professional/Profile.tsx`
Aggiungere un menu con le voci:
- Dati personali → `/professional/profile/personal`
- Preferenze → `/professional/profile/preferences`
- Impostazioni → `/professional/profile/settings`
- I miei servizi → `/professional/services`
- Le mie recensioni → `/professional/reviews`
- Documenti → `/professional/onboarding/documents`

Struttura del menu (simile al profilo cliente):

```text
┌─────────────────────────────────────────┐
│  [Avatar]  Mario Rossi                  │
│            Milano • ★ 4.8               │
├─────────────────────────────────────────┤
│  Account                                │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Dati personali              → │  │
│  ├───────────────────────────────────┤  │
│  │ ⚙️ Preferenze                  → │  │
│  ├───────────────────────────────────┤  │
│  │ 🔔 Notifiche                   → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Attività                               │
│  ┌───────────────────────────────────┐  │
│  │ 🛠️ I miei servizi              → │  │
│  ├───────────────────────────────────┤  │
│  │ ⭐ Le mie recensioni           → │  │
│  ├───────────────────────────────────┤  │
│  │ 📄 Documenti                   → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Supporto                               │
│  ┌───────────────────────────────────┐  │
│  │ ❓ Centro assistenza           → │  │
│  ├───────────────────────────────────┤  │
│  │ 🔒 Privacy                     → │  │
│  ├───────────────────────────────────┤  │
│  │ ⚙️ Impostazioni                → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🚪 Esci                           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2. `src/App.tsx`
Aggiungere le nuove routes:
```typescript
<Route path="/professional/profile/personal" element={<ProfessionalPersonalData />} />
<Route path="/professional/profile/settings" element={<ProfessionalSettings />} />
<Route path="/professional/profile/preferences" element={<ProfessionalPreferences />} />
```

## Riepilogo Modifiche

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/pages/professional/profile/PersonalData.tsx` | Creare | Form modifica dati anagrafici |
| `src/pages/professional/profile/Settings.tsx` | Creare | Pagina impostazioni tema/lingua |
| `src/pages/professional/profile/Preferences.tsx` | Creare | Pagina preferenze notifiche/visibilità |
| `src/pages/professional/Profile.tsx` | Modificare | Aggiungere menu navigazione |
| `src/App.tsx` | Modificare | Aggiungere 3 nuove routes |

## Risultato Atteso

Dopo l'implementazione:
- La rotella in alto a destra porterà a `/professional/profile/settings` (funzionante)
- Il profilo avrà un menu organizzato con tutte le opzioni
- Il professionista potrà modificare i propri dati anagrafici
- Il professionista potrà gestire le proprie preferenze
