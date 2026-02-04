
# Piano: Configurazione PWA per App Cliente e Professionista

## Obiettivo
Creare una Progressive Web App (PWA) installabile solo per le sezioni **Cliente** e **Professionista**, mantenendo l'area **Admin** come dashboard web tradizionale.

---

## Struttura del Progetto

L'applicazione ha tre aree distinte:
- `/client/*` - App mobile per clienti (PWA)
- `/professional/*` - App mobile per professionisti (PWA)
- `/admin/*` - Dashboard amministrativa (solo web)

---

## Modifiche Pianificate

### 1. Installazione Plugin PWA
Aggiunta di `vite-plugin-pwa` per generare automaticamente il service worker e il manifest.

### 2. Configurazione Vite (`vite.config.ts`)
- Configurazione del plugin PWA con manifest personalizzato
- Icone dell'app (192x192 e 512x512)
- Tema con palette pastello (blu primario)
- Strategia di caching per funzionamento offline
- Registrazione automatica del service worker

### 3. Aggiornamento `index.html`
- Meta tag per app mobile (Apple, Android)
- Theme color con blu pastello
- Link al manifest
- Meta tag per standalone mode
- Supporto per splash screen iOS

### 4. Creazione Icone PWA
- `public/pwa-192x192.png` - Icona per Android
- `public/pwa-512x512.png` - Icona per splash screen
- `public/apple-touch-icon.png` - Icona per iOS

### 5. Pagina di Installazione (`/install`)
- Pagina dedicata per guidare l'installazione
- Istruzioni per iOS (Safari → Condividi → Aggiungi a Home)
- Istruzioni per Android (Menu → Installa app)
- Pulsante per trigger install prompt (se supportato)

### 6. Hook `useInstallPWA`
- Gestione dell'evento `beforeinstallprompt`
- Stato per verificare se l'app è già installata
- Funzione per attivare l'installazione

### 7. Banner di Installazione (opzionale)
- Componente che appare nella home cliente/professionista
- Suggerisce l'installazione se non già installata
- Si nasconde dopo l'installazione o il dismiss

---

## Dettagli Tecnici

### Manifest PWA
```text
+----------------------------------+
|  CasaFacile PWA Manifest         |
+----------------------------------+
| name: CasaFacile                 |
| short_name: CasaFacile           |
| start_url: /                     |
| display: standalone              |
| theme_color: #8BB8D0 (blu)       |
| background_color: #FAFAFA        |
+----------------------------------+
```

### Service Worker
- Strategia: Cache-first per assets statici
- Network-first per chiamate API
- Funzionamento offline di base

### Comportamento per Area

| Area | PWA Installabile | Offline | Layout |
|------|------------------|---------|--------|
| Cliente | Si | Si | Mobile |
| Professionista | Si | Si | Mobile |
| Admin | No | No | Desktop |

---

## File da Creare/Modificare

| File | Azione |
|------|--------|
| `package.json` | Aggiunta dipendenza `vite-plugin-pwa` |
| `vite.config.ts` | Configurazione plugin PWA |
| `index.html` | Meta tag mobile e manifest |
| `public/pwa-192x192.png` | Icona PWA (da creare placeholder) |
| `public/pwa-512x512.png` | Icona PWA grande |
| `public/apple-touch-icon.png` | Icona iOS |
| `src/hooks/useInstallPWA.ts` | Hook per gestione installazione |
| `src/pages/Install.tsx` | Pagina istruzioni installazione |
| `src/components/pwa/InstallBanner.tsx` | Banner suggerimento installazione |
| `src/App.tsx` | Aggiunta route `/install` |

---

## Esperienza Utente Finale

1. **Utente visita l'app** → Vede banner "Installa CasaFacile"
2. **Clicca su Installa** → Si apre prompt nativo (Android) o istruzioni (iOS)
3. **Dopo installazione** → L'app si apre come app nativa
4. **Esperienza** → Fullscreen, senza barra browser, funziona offline

L'area admin rimane accessibile solo via browser desktop senza opzione PWA.
