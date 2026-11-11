/** Testi legali con valore di dichiarazione: copiati alla lettera dalle specifiche del 5/11/2026. */
export const OCCASIONAL_DECLARATION =
  "Dichiaro sotto la mia responsabilità di non svolgere l'attività di servizi domestici in modo abituale, continuativo e professionale e di non essere titolare di partita IVA per tale attività.";

/** Versione dei Termini accettata alla registrazione: va cambiata a ogni nuova versione. */
export const TERMS_VERSION = "2026-11-05";

/**
 * Archivio delle versioni (specifiche §12): ogni nuova versione si aggiunge in cima, con il suo file
 * in public/legal/, e si aggiorna TERMS_VERSION. Le versioni vecchie restano consultabili.
 */
export const TERMS_ARCHIVE = [
  { version: "2026-11-05", label: "Versione 2.1, in vigore dal 05/11/2026", url: "/legal/condizioni-e-policy-2026-11-05.pdf" },
];
export const TERMS_URL = TERMS_ARCHIVE[0].url;

/** Avviso per tutte le prenotazioni, senza casella (specifiche §6). */
export const CANCELLATION_NOTICE =
  "Annullamento gratuito fino a 3 ore prima. Nelle ultime 3 ore paghi il 50%. Se all'orario concordato non sei presente o non consenti l'accesso, paghi il 60%.";

/** Casella obbligatoria, non pre-spuntata, solo con professionisti con P.IVA (specifiche §6). */
export const EARLY_EXECUTION_TEXT =
  "Chiedo che il Servizio, compresa la fase di preparazione che inizia 3 ore prima dell'orario concordato, sia eseguito durante il periodo di recesso. Prendo atto che, se annullo o recedo dopo l'inizio della fase di preparazione, pagherò il 50% del prezzo come corrispettivo della preparazione già svolta, e che perderò il diritto di recesso una volta eseguito completamente il Servizio.";
/** Versione del testo qui sopra: cambiarla a ogni modifica del testo. */
export const EARLY_EXECUTION_VERSION = "2026-11-05";

/** Contatti indicati nei Termini: PEC, anche punto di contatto unico DSA (specifiche §11). */
export const LEGAL_PEC = "ri-sco@pec.it";
