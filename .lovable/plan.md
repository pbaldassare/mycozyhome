
# Piano: Correzione Bug - Documenti Admin, Mappa e PWA Safari

## Problemi Identificati

| Problema | Causa Identificata |
|----------|-------------------|
| Download documenti Admin non funziona | Il bucket `professional-documents` è **privato** ma mancano le policy RLS per l'admin |
| Mappa/Geolocalizzazione non funziona | La chiave API Google Maps potrebbe non essere configurata correttamente o il browser blocca la geolocalizzazione |
| PWA non si installa da Safari | Safari non supporta `beforeinstallprompt` - l'utente deve usare "Aggiungi a Home" manualmente |

---

## 1. Download Documenti Admin

### Problema Tecnico

Il bucket `professional-documents` ha queste caratteristiche:
- **Pubblico**: `false` (privato)
- **Policy RLS attuali**: Solo i professionisti possono vedere/scaricare i propri documenti

L'admin non ha accesso perché manca una policy RLS specifica.

### Soluzione

Aggiungere una policy RLS per permettere all'admin di leggere tutti i documenti:

```sql
CREATE POLICY "Admin can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### File da Modificare

| File | Modifica |
|------|----------|
| `src/components/admin/ProfessionalReviewPanel.tsx` | Usare `createSignedUrl` invece di `getPublicUrl` per ottenere URL firmati temporanei |

Il componente attualmente usa direttamente l'URL salvato nel database (`doc.url`). Per i bucket privati, questo URL non funziona. Bisogna generare un URL firmato:

```typescript
// Invece di usare doc.url direttamente
const { data } = await supabase.storage
  .from('professional-documents')
  .createSignedUrl(filePath, 3600); // Valido 1 ora
```

---

## 2. Mappa/Geolocalizzazione

### Analisi

La configurazione attuale:
- Secret `GOOGLE_MAPS_API_KEY` è presente
- Edge function `get-maps-key` è configurata correttamente
- Hook `useGeolocation` richiede permesso browser

### Possibili Cause

1. **Chiave API non valida o non configurata**: La chiave potrebbe essere vuota o non avere i permessi corretti
2. **Permessi browser bloccati**: L'utente deve autorizzare la geolocalizzazione
3. **HTTPS richiesto**: La geolocalizzazione funziona solo su HTTPS o localhost

### Soluzione

1. **Verificare la chiave API Google Maps**: Assicurarsi che sia valida e abbia le API corrette abilitate (Maps JavaScript API)
2. **Aggiungere gestione errori migliorata**: Mostrare messaggi chiari all'utente quando la geolocalizzazione fallisce
3. **Fallback graceful**: Se la geolocalizzazione non è disponibile, mostrare comunque la mappa centrata sull'Italia

### File da Modificare

| File | Modifica |
|------|----------|
| `src/components/maps/ProfessionalsMap.tsx` | Aggiungere messaggi di errore più chiari e un bottone per richiedere permessi |
| `src/hooks/useGeolocation.ts` | Aggiungere gestione errori più dettagliata |

---

## 3. PWA Safari/iOS

### Problema Tecnico

Safari **non supporta** l'evento `beforeinstallprompt` usato per mostrare il banner di installazione automatico. Su iOS:
- Non esiste un prompt automatico
- L'utente deve manualmente usare "Condividi → Aggiungi a Home"
- Il banner attuale mostra le istruzioni, ma potrebbe non apparire correttamente

### Analisi del Codice Attuale

```typescript
// useInstallPWA.ts
const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
setIsIOS(isIOSDevice);
```

Il codice rileva iOS correttamente. Tuttavia:
- L'`InstallBanner` mostra "Scopri come" su iOS invece di "Installa"
- La pagina `/install` mostra le istruzioni manuali corrette

### Problema Potenziale

Il banner potrebbe non apparire perché:
1. L'utente l'ha dismissato (salvato in localStorage per 24 ore)
2. La condizione `!isInstallable && !isIOS` potrebbe essere falsa

### Soluzione

1. **Migliorare la logica del banner iOS**: Forzare la visualizzazione su iOS anche se dismissato in precedenza
2. **Aggiungere link diretto alla pagina install**: Mostrare sempre un link nel profilo/settings per installare l'app

### File da Modificare

| File | Modifica |
|------|----------|
| `src/components/pwa/InstallBanner.tsx` | Migliorare logica per iOS |
| `src/pages/professional/profile/Settings.tsx` | Aggiungere voce "Installa App" |
| `src/pages/client/profile/Settings.tsx` | Aggiungere voce "Installa App" |

---

## Riepilogo Modifiche

| Tipo | Azione | Descrizione |
|------|--------|-------------|
| **Database** | Migrazione SQL | Aggiungere policy RLS per admin su storage |
| **Backend** | Verifica | Controllare validità chiave Google Maps |
| **Frontend** | Modifica | ProfessionalReviewPanel: usare signed URLs |
| **Frontend** | Modifica | ProfessionalsMap: migliorare messaggi errore |
| **Frontend** | Modifica | InstallBanner: migliorare logica iOS |
| **Frontend** | Modifica | Settings pages: aggiungere link "Installa App" |

---

## Priorità di Implementazione

1. **Alta** - Policy RLS admin per documenti (blocca completamente la funzionalità)
2. **Alta** - Signed URLs per download documenti
3. **Media** - Verifica chiave Google Maps
4. **Media** - Miglioramento gestione errori mappa
5. **Bassa** - Miglioramento banner PWA iOS (le istruzioni manuali funzionano già)
