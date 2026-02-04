

# Piano: Avatar Professionisti, Mappa Google e Pagine Professionista Distinte

## Panoramica

Ci sono tre problemi da risolvere:

1. **I professionisti non hanno immagini avatar** - tutti hanno `avatar_url: null`
2. **Manca la mappa Google Maps** per geolocalizzare i professionisti  
3. **Le pagine del professionista sono identiche a quelle del cliente** - il login reindirizza alla home sbagliata

## Cosa Faremo

### 1. Aggiungere immagini avatar ai professionisti

Aggiorneremo il database con URL di immagini realistiche da servizi come Unsplash/UI Avatars per ogni professionista fake:

- Maria Rossi, Giuseppe Bianchi, Francesca Verdi...
- Coordinate geografiche (latitudine/longitudine) per ogni professionista
- Coordinate per le aree di copertura

### 2. Integrare Google Maps per visualizzare i professionisti

Creeremo un nuovo componente **ProfessionalsMap** che:

- Mostra una mappa centrata sulla posizione dell'utente (o Italia se non disponibile)
- Visualizza i marker dei professionisti con le loro foto
- Cliccando su un marker si apre il dettaglio del professionista
- Calcolerà le distanze reali tra cliente e professionisti

La mappa verrà integrata nella pagina **Search** del cliente con un toggle Lista/Mappa.

```text
┌─────────────────────────────────────────┐
│  [Cerca...]                    [Filtri] │
├─────────────────────────────────────────┤
│  Pulizie | Stiro | Baby... | Dog...     │
├─────────────────────────────────────────┤
│     [Lista]      |      [Mappa]         │ ← Toggle nuovo
├─────────────────────────────────────────┤
│                                         │
│      🗺️ Mappa con marker               │
│      dei professionisti                 │
│                                         │
│         📍 Maria    📍 Giuseppe         │
│                                         │
│              📍 Anna                    │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Differenziare le pagine del professionista

Attualmente quando un professionista fa login:
- Viene reindirizzato a `/professional/dashboard` 
- Ma la home vera è `/professional` 

Correggeremo:
- Il redirect nel login per mandare a `/professional`
- Verificheremo che la bottom nav del professionista sia completamente diversa da quella del cliente
- La home del professionista mostrerà dashboard con statistiche, guadagni e prenotazioni

---

## Dettaglio Tecnico

### File da Creare

| File | Descrizione |
|------|-------------|
| `src/components/maps/ProfessionalsMap.tsx` | Componente mappa con marker professionisti |
| `src/hooks/useGeolocation.ts` | Hook per ottenere posizione utente |

### File da Modificare

| File | Modifica |
|------|----------|
| `src/pages/client/Search.tsx` | Aggiungere toggle Lista/Mappa e integrare ProfessionalsMap |
| `src/pages/Login.tsx` | Correggere redirect professionista da `/professional/dashboard` a `/professional` |
| `src/hooks/useProfessionals.ts` | Passare avatarUrl correttamente ai componenti |
| `src/components/client/ProfessionalCard.tsx` | Assicurarsi che l'avatar venga mostrato |

### Migrazione Database

Aggiorneremo i dati fake con:
- **Avatar URL** per ogni professionista (usando UI Avatars con nome/cognome)
- **Coordinate geografiche** reali per Milano, Roma, Torino, Napoli, Bologna
- **Coordinate per professional_areas** per abilitare il matching geografico

Esempio coordinate:
- Milano: 45.4642, 9.1900
- Roma: 41.9028, 12.4964
- Torino: 45.0703, 7.6869

### Google Maps Integration

L'API key `GOOGLE_MAPS_API_KEY` è già configurata. Useremo:
- **Maps JavaScript API** per la mappa interattiva
- **Geocoding API** già integrata in `geo-service` per le coordinate
- **Distance Matrix** per calcolare distanze reali

### Flusso Utente Finale

**Come Cliente:**
1. Vai su Cerca
2. Clicca su "Mappa" 
3. Vedi tutti i professionisti sulla mappa con le loro foto
4. Clicca su un marker → vai al dettaglio

**Come Professionista:**
1. Fai login con `professionista@domesticdelight.app`
2. Vieni reindirizzato a `/professional` (dashboard con statistiche)
3. La bottom nav mostra: Home, Prenotazioni, Messaggi, Disponibilità, Profilo

