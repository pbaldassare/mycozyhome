## Obiettivo
Riportare nel preview le modifiche che risultano sparite: accessi demo, wallet/crediti e tour onboarding, senza toccare il database se gli oggetti risultano già presenti.

## Piano
1. **Verificare se è un problema di preview/cache o codice non applicato**
   - Controllare lo stato del dev server e dell’HMR gate.
   - Confrontare ciò che è nel codice con ciò che appare in preview: nel codice attuale risultano già presenti `MyCozyHome`, account demo, rotte wallet e rotte tour; nello screenshot il preview mostra ancora `CasaFacile`, quindi probabilmente il preview sta servendo una versione vecchia/bufferizzata o non aggiornata.

2. **Forzare aggiornamento preview in modo sicuro**
   - Flush dell’HMR gate, senza restart del dev server.
   - Se necessario, verificare i log recenti del dev server per errori di trasformazione/build che impediscono l’aggiornamento.

3. **Validare le tre aree visibili**
   - `/login`: deve mostrare `MyCozyHome` e gli account demo Admin / Professionista / Cliente.
   - `/client/profile`: deve avere la voce `Wallet e crediti` che porta a `/client/profile/payments`.
   - `/`: i pulsanti registrazione devono portare ai tour `/client/welcome` e `/professional/welcome`.

4. **Se il codice in esecuzione è davvero tornato indietro**
   - Reintegrare solo i collegamenti mancanti nel frontend: demo login, menu wallet, rotte/pulsanti tour.
   - Non modificare le migration né ripetere schema changes se il database contiene già wallet e blocco utenti.

5. **Verifica finale**
   - Aprire la preview con Playwright e confermare visivamente che login, wallet e tour siano di nuovo raggiungibili.
   - Se emerge un rollback Lovable/History, indicarti come ripristinare dal pannello History invece di riscrivere modifiche già presenti.

## Note
- Il database sembra già aggiornato: le tabelle wallet sono elencate nel contesto backend.
- Il problema mostrato dallo screenshot è coerente con preview non aggiornata: il file `src/pages/Login.tsx` contiene già `MyCozyHome` e account demo, ma la preview mostra `CasaFacile` e nessun blocco demo.