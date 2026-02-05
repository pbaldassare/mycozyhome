
Obiettivo: smettere di “crashare” (schermata bianca) quando l’utente apre la mappa in `/client/search`, e far emergere un errore utile a schermo invece di buttare giù tutta l’app. In parallelo, rendere il rendering della mappa più “robusto” (no accessi a `google` se non è davvero pronto, no icone che possono causare eccezioni runtime).

## Cosa sappiamo già (dal codice e dai test rapidi)
- `ProfessionalsMap.tsx` è già stato refactorato per evitare il doppio `useJsApiLoader` con apiKey diversa (il vecchio errore “Loader must not be called again…”).
- Il tuo sintomo attuale è: **schermata bianca/crash** entrando in **tab “Mappa”** su `/client/search`.
- Nei log che riesco a vedere “da qui” non compare un errore Google Maps esplicito; quindi è probabile un’eccezione JS runtime non catturata oppure un crash che avviene su un device/browser specifico (es. mobile Safari) e non si riproduce uguale nel mio browser.

## Ipotesi più probabili (tecniche)
1) **Eccezione runtime non catturata dentro `ProfessionalsMapInner`** (es. accesso a `google.maps.*` quando `google` non è ancora disponibile in quell’istante, oppure oggetti `google.maps.Size/Point` creati in un render “sporco”).
2) **Dati professionisti con coordinate non valide** che passano il filtro e poi rompono qualcosa (NaN, stringhe vuote, valori fuori range). Il filtro attuale in `ProfessionalsMap` è “truthy check” + `isNaN` ma solo su `p.latitude`/`p.longitude` (che possono essere `0`, stringhe, ecc).
3) **Problema di mount/unmount rapido** (React 18 Strict Mode in dev può montare/smontare; se il loader o il componente non è idempotente, può generare stati inconsistenti).
4) **Problema UI di contenitore** (altezza calcolata/viewport mobile) che fa “sparire” la mappa; non dovrebbe causare “crash”, ma spesso l’utente lo percepisce come “si rompe tutto”. Lo trattiamo comunque.

## Strategia di fix (in 2 fasi)
### Fase A — Rendere il crash “osservabile” e non distruttivo
1) Aggiungere un **Error Boundary** dedicato attorno alla mappa (solo nel tab “Mappa” di `/client/search`), così:
   - Se qualcosa lancia un errore, non ottieni schermata bianca dell’intera app.
   - Mostri un pannello “Errore mappa” con pulsante “Riprova” e (in dev) dettagli tecnici.
2) Loggare l’errore in console in modo chiaro (stack + contesto: apiKey presente? count professionisti? center?).

**File coinvolti**
- `src/pages/client/Search.tsx` (wrappare `<ProfessionalsMap />` con `<MapErrorBoundary />`)
- Nuovo componente (es. `src/components/maps/MapErrorBoundary.tsx`) oppure un boundary generico in `src/components/` riusabile.

**Risultato atteso**
- Anche se il bug rimane, l’app non va bianca: l’utente vede un errore gestito e noi vediamo info utili per chiudere definitivamente il problema.

### Fase B — Hardening di `ProfessionalsMap` (prevenzione delle eccezioni)
3) Rendere l’uso del global `google` “a prova di timing”:
   - Non assumere che `isLoaded === true` implichi sempre `window.google` disponibile in quell’istante (raro, ma succede con mount/unmount veloci).
   - Introdurre guard: `const g = window.google; if (!g?.maps) { ... fallback ... }`
4) Spostare la creazione di `new google.maps.Size` / `new google.maps.Point` in una funzione che gira solo quando `window.google.maps` esiste (e possibilmente memoizzata).
5) Rendere il filtro coordinate più robusto:
   - Validare esplicitamente `Number.isFinite(lat)` e range `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]`.
   - Evitare falsi negativi/positivi (es. `0` è una coordinata valida, ma oggi verrebbe esclusa perché falsy).
6) (Opzionale ma consigliato) Aggiungere una “modalità safe” se non ci sono professionisti con coordinate valide:
   - Mostrare testo “Nessun professionista geolocalizzato” invece di provare a fare `fitBounds` ecc.
7) (Opzionale) Quando la mappa monta dopo uno switch UI, trigger di resize:
   - Su alcuni device, GoogleMap può renderizzare “vuoto” se il container cambia dimensione subito dopo mount. Possiamo fare un `requestAnimationFrame(() => g.maps.event.trigger(map, "resize"))` quando `map` è impostata.

**File coinvolti**
- `src/components/maps/ProfessionalsMap.tsx`

## Verifiche (manuali) che faremo subito dopo
1) `/client/search` → tab **Mappa**:
   - Non deve mai comparire schermata bianca.
   - In caso di errore, deve comparire UI “Errore caricamento mappa” con tasto “Riprova”.
2) Con 0 professionisti / professionisti senza coordinate:
   - Niente crash.
   - UI coerente (nessun marker, mappa centrata su `center`).
3) Con professionisti con coordinate:
   - Marker visibili + InfoWindow al click.
4) Mobile:
   - Test rapido su viewport piccolo (anche nel preview) per assicurarsi che l’altezza della mappa non collassi.

## Nota importante (per chiudere velocemente)
Dopo la Fase A, se il crash succede ancora, l’Error Boundary ci darà finalmente l’errore preciso (stack) e potremo fare un fix chirurgico. Adesso il problema è che “schermata bianca” senza stack è quasi impossibile da risolvere al 100% in un colpo solo.

## Ambiguità rimaste (non bloccanti, ma utili)
- “Crash” succede anche se sei loggato come cliente o anche in incognito/logout? (serve per capire se c’entra qualche chiamata protetta o un redirect).
- Succede su un browser specifico (Safari iOS) o su tutti?

Se approvi questo piano, implemento Fase A + Fase B in modo conservativo (senza cambiare UI/UX, solo stabilità e diagnostica).
