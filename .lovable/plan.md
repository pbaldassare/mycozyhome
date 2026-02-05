
# Piano: Funzionalità Mancanti per Professionisti e Schermate Educative

## Analisi Attuale

### Cosa è già implementato:
| Funzionalità | Stato | Note |
|--------------|-------|------|
| Prenotazioni in arrivo | ✅ Presente | Tab "In attesa" in `/professional/bookings` |
| Storico prenotazioni | ✅ Presente | Tab "Completate" e "Annullate" già esistenti |
| Chat | ✅ Presente | `/professional/chat/:id` funziona con realtime |
| Caricamento immagini | ✅ Presente | `ChatInput.tsx` supporta upload immagini |
| Screen educativi | ❌ Mancanti | Non esistono schermate onboarding/tutorial |

### Il problema reale
Le funzionalità principali esistono già! Quello che manca sono:
1. **Screen educativi/tutorial** per professionisti
2. **Screen educativi/tutorial** per clienti
3. Possibilmente un miglioramento della visibilità delle prenotazioni nella Home

## Piano di Implementazione

### 1. Schermate Educative Professionisti

Creeremo un flusso di 3-4 schermate che spiegano:

| Schermata | Contenuto |
|-----------|-----------|
| **Benvenuto** | "Diventa un professionista CasaFacile" con illustrazione |
| **Come funziona** | Ricevi richieste → Accetta/Rifiuta → Lavora → Guadagna |
| **Vantaggi** | Guadagni flessibili, clienti verificati, pagamenti sicuri |
| **Sicurezza** | Chat protetta, pagamenti garantiti, supporto 24/7 |

```text
┌─────────────────────────────────────────┐
│           Screen 1: Benvenuto           │
│  ┌─────────────────────────────────┐    │
│  │       [Illustrazione Pro]       │    │
│  └─────────────────────────────────┘    │
│                                         │
│    "Benvenuto su CasaFacile Pro!"       │
│                                         │
│    Inizia a guadagnare offrendo i       │
│    tuoi servizi domestici.              │
│                                         │
│    ●○○○     [Avanti →]                  │
└─────────────────────────────────────────┘
```

### 2. Schermate Educative Clienti

Creeremo un flusso simile per i clienti:

| Schermata | Contenuto |
|-----------|-----------|
| **Benvenuto** | "Trova aiuto per la tua casa" |
| **Come funziona** | Cerca → Prenota → Ricevi servizio → Paga |
| **Sicurezza** | Professionisti verificati, pagamenti protetti |
| **Vantaggi** | Risparmia tempo, qualità garantita, supporto |

### 3. Componenti da Creare

```text
src/
├── components/
│   └── onboarding/
│       ├── OnboardingSlide.tsx      # Componente singola slide
│       └── OnboardingCarousel.tsx   # Wrapper con dots e navigazione
├── pages/
│   ├── client/
│   │   └── Onboarding.tsx           # Tutorial clienti
│   └── professional/
│       └── Tutorial.tsx             # Tutorial professionisti
```

### 4. Logica di Visualizzazione

- Prima volta che un utente si registra → mostra tutorial
- Salvare in localStorage se l'utente ha visto il tutorial
- Aggiungere accesso dal profilo per rivederlo

```text
Flusso:
                ┌──────────────┐
                │  Registra    │
                └──────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ Tutorial visto? │
              └────────┬───────┘
                       │
         ┌─────────────┼─────────────┐
         │ NO          │             │ SÌ
         ▼             │             ▼
┌────────────────┐     │    ┌────────────────┐
│ Mostra Tutorial│     │    │   Home/Dashboard│
└────────┬───────┘     │    └────────────────┘
         │             │
         └─────────────┘
                │
                ▼
         ┌─────────────┐
         │ Salva stato │
         │ localStorage│
         └─────────────┘
```

## File da Creare/Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/components/onboarding/OnboardingSlide.tsx` | Creare | Componente slide singola |
| `src/components/onboarding/OnboardingCarousel.tsx` | Creare | Carousel con navigazione |
| `src/pages/client/Onboarding.tsx` | Creare | Pagina tutorial cliente |
| `src/pages/professional/Tutorial.tsx` | Creare | Pagina tutorial professionista |
| `src/App.tsx` | Modificare | Aggiungere route per tutorial |
| `src/pages/client/Auth.tsx` | Modificare | Redirect a tutorial dopo registrazione |
| `src/pages/professional/Auth.tsx` | Modificare | Redirect a tutorial dopo registrazione |

## Contenuti delle Slide

### Professionista - 4 Slide

**Slide 1: Benvenuto**
- Titolo: "Benvenuto in CasaFacile Pro"
- Testo: "Inizia a guadagnare offrendo i tuoi servizi domestici a clienti verificati nella tua zona."

**Slide 2: Come Funziona**
- Titolo: "Come Funziona"
- Punti:
  - 📩 Ricevi richieste di prenotazione
  - ✅ Accetta o rifiuta in base alla tua disponibilità
  - 🏠 Svolgi il servizio al domicilio del cliente
  - 💰 Ricevi il pagamento in modo sicuro

**Slide 3: I Tuoi Vantaggi**
- Titolo: "I Tuoi Vantaggi"
- Punti:
  - 📅 Orari flessibili - lavora quando vuoi
  - 👥 Clienti verificati e affidabili
  - 💳 Pagamenti garantiti e puntuali
  - 📈 Costruisci la tua reputazione con le recensioni

**Slide 4: Sicurezza**
- Titolo: "Lavora in Sicurezza"
- Punti:
  - 🔒 Chat interna protetta
  - 🛡️ Intermediazione pagamenti sicura
  - 📞 Supporto clienti 24/7
  - ⚖️ Sistema di risoluzione dispute

### Cliente - 4 Slide

**Slide 1: Benvenuto**
- Titolo: "Benvenuto su CasaFacile"
- Testo: "Trova professionisti affidabili per la pulizia e i servizi domestici nella tua zona."

**Slide 2: Come Funziona**
- Titolo: "Come Funziona"
- Punti:
  - 🔍 Cerca professionisti vicino a te
  - 📅 Prenota il servizio che ti serve
  - 🏠 Ricevi il professionista a casa
  - ⭐ Lascia una recensione

**Slide 3: Sicurezza**
- Titolo: "La Tua Sicurezza Prima di Tutto"
- Punti:
  - ✅ Professionisti verificati e recensiti
  - 🔒 Pagamenti sicuri tramite l'app
  - 💬 Comunicazione protetta
  - 🛡️ Garanzia soddisfazione

**Slide 4: Vantaggi**
- Titolo: "Perché Scegliere CasaFacile"
- Punti:
  - ⏰ Risparmia tempo prezioso
  - 💯 Qualità garantita
  - 💰 Prezzi trasparenti
  - 📱 Tutto a portata di app

## Risultato Finale

Dopo l'implementazione:
1. Nuovo utente cliente → vede 4 slide tutorial → arriva alla Home
2. Nuovo professionista → vede 4 slide tutorial → arriva all'onboarding profilo
3. Utenti esistenti possono rivedere il tutorial dal profilo
4. Le funzionalità esistenti (prenotazioni, chat, immagini) rimangono invariate
