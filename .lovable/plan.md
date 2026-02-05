
# Piano di Fix: Crash della Mappa Google Maps

## Problema Identificato

L'app crasha quando si apre la mappa perché il componente `ProfessionalsMap` chiama `useJsApiLoader` con l'API key vuota (`""`) durante il caricamento iniziale, e poi quando l'API key viene ricevuta dall'edge function, prova a ricaricare con la chiave effettiva. Google Maps non permette questo comportamento.

**Errore esatto:**
```
Loader must not be called again with different options.
apiKey: "AIzaSyA..." !== apiKey: ""
```

## Soluzione

Ritardare il rendering del componente che usa `useJsApiLoader` fino a quando l'API key è disponibile, evitando così il doppio caricamento.

## Modifiche Tecniche

### File: `src/components/maps/ProfessionalsMap.tsx`

1. **Separare il componente in due parti:**
   - Un wrapper che gestisce il caricamento dell'API key
   - Un componente interno che usa `useJsApiLoader` solo quando l'API key è già disponibile

2. **Aggiungere un controllo prima di chiamare `useJsApiLoader`:**
   - Non renderizzare il componente della mappa finché `apiKey` non è pronto
   - Mostrare lo stato di caricamento nel wrapper

### Struttura del fix:

```text
+----------------------------------+
|  ProfessionalsMap (Wrapper)      |
|  - Carica API key                |
|  - Mostra loading/error          |
+----------------+-----------------+
                 |
                 v (solo quando apiKey è pronto)
+----------------------------------+
|  ProfessionalsMapInner           |
|  - Usa useJsApiLoader            |
|  - Renderizza GoogleMap          |
+----------------------------------+
```

### Codice chiave da modificare:

Linea 55-57 attuale:
```tsx
const { isLoaded, loadError } = useJsApiLoader({
  googleMapsApiKey: apiKey || "",
});
```

Verrà spostato in un componente interno che riceve `apiKey` come prop **già definita** (non null/vuota).

## Impatto

- **Nessun cambiamento alle props esterne** - il componente continuerà a ricevere gli stessi parametri
- **Nessun impatto sul design** - l'utente vedrà sempre lo stesso loading state
- **Fix permanente** - previene crash futuri legati a cambi di API key

## Test Consigliati

Dopo l'implementazione, verificare:
1. La mappa si carica correttamente senza crash
2. I marker dei professionisti appaiono sulla mappa
3. Il click sui marker apre l'info window
4. La geolocalizzazione funziona correttamente
