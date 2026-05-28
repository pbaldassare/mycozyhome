Correggerò il flusso dopo il messaggio di benvenuto/onboarding cliente.

1. Rendo l’onboarding più affidabile sui dispositivi mobili:
   - navigazione sempre visibile in basso;
   - slide con altezza controllata, senza aree che intercettano i tap;
   - supporto anche allo swipe/scroll orizzontale se utile.

2. Correggo il redirect finale:
   - quando l’utente preme “Inizia” o “Salta”, salvo `client_onboarding_seen`;
   - mando alla Home cliente (`/client`) senza restare bloccati sulla pagina onboarding.

3. Verifico il flusso in preview:
   - apro `/client/onboarding` in viewport mobile;
   - testo “Avanti” su tutte le slide;
   - testo “Salta” e “Inizia”;
   - controllo che non compaiano errori console rilevanti.

Nota: ho visto anche un errore 401 su `manifest.webmanifest`, legato alla configurazione PWA/manifest. Lo tengo separato da questo bug per non introdurre service worker o modifiche PWA non richieste in questa correzione.