/**
 * Traduce gli errori in messaggi per l'utente.
 * Il DB solleva codici `FC_*`; tutto ciò che non è previsto diventa un messaggio
 * generico, mentre il dettaglio resta solo nella console.
 */

export const GENERIC_ERROR_MESSAGE = "Si è verificato un errore imprevisto. Riprova tra poco.";

const FC_MESSAGES: Record<string, string> = {
  FC_NOT_AUTHENTICATED: "Devi effettuare l'accesso per continuare.",
  FC_FORBIDDEN: "Non hai i permessi per questa operazione.",
  FC_NOT_FOUND: "Elemento non trovato.",
  FC_ACCOUNT_BLOCKED: "Il tuo account è bloccato. Contatta l'assistenza.",
  FC_TOP_UP_DISABLED: "La ricarica dei crediti non è ancora disponibile: i pagamenti online sono in arrivo.",
  FC_TOP_UP_AMOUNT: "Puoi ricaricare da 1 € a 500 € per volta.",
  FC_TOP_UP_DAILY_LIMIT: "Hai raggiunto il limite di ricarica giornaliero (1.000 €).",
  FC_PROMO_INVALID: "Il codice promozionale non è valido o è scaduto.",
  FC_PROMO_USED: "Hai già usato questo codice promozionale.",
  FC_BOOKING_HOURS: "Scegli una durata tra 1 e 12 ore.",
  FC_BOOKING_DATE: "Scegli una data a partire da oggi.",
  FC_BOOKING_TIME: "Il servizio deve finire entro la mezzanotte.",
  FC_BOOKING_ADDRESS: "Inserisci un indirizzo completo.",
  FC_BOOKING_MIN_HOURS: "La durata è inferiore al minimo richiesto dal professionista.",
  FC_SERVICE_UNAVAILABLE: "Questo servizio non è più disponibile.",
  FC_SLOT_TAKEN: "Il professionista è già impegnato in quell'orario. Scegline un altro.",
  FC_SERIES_INVALID: "Scegli da 2 a 12 appuntamenti, ogni 1-4 settimane.",
  FC_DOCS_REQUIRED: "Per approvare servono carta d'identità e polizza assicurativa (RC) caricate e approvate.",
  FC_VAT_REQUIRED: "Inserisci la Partita IVA oppure dichiara la prestazione occasionale in Profilo → Dati fiscali.",
  FC_TIP_AMOUNT: "La mancia deve essere tra 1 € e 100 €.",
  FC_INSUFFICIENT_CREDITS: "Crediti insufficienti: ricarica il wallet.",
  FC_BOOKING_NOT_CANCELLABLE: "Questa prenotazione non si può più annullare.",
  FC_BOOKING_STATUS: "Non è possibile cambiare lo stato di questa prenotazione.",
  FC_REVIEW_NOT_ALLOWED: "Puoi lasciare una recensione solo dopo un servizio completato.",
  FC_DISPUTE_NOT_ALLOWED: "Non puoi aprire una contestazione su questa prenotazione.",
  FC_TRACKING_NOT_ALLOWED: "Operazione non consentita su questa prenotazione.",
  FC_PAYOUT_IBAN: "L'IBAN non è valido.",
  FC_SERVICE_NOT_STARTED: "Puoi segnare il servizio come completato solo dopo l'orario di inizio.",
  FC_EARLY_EXECUTION_REQUIRED: "Per prenotare questo professionista devi spuntare la richiesta di esecuzione anticipata.",
  FC_REVIEW_EXPIRED: "Puoi lasciare una recensione entro 3 giorni dal servizio.",
  FC_NO_SHOW_WINDOW: "La segnalazione si può fare solo entro 3 ore dal servizio completato.",
  FC_CHECKIN_REQUIRED: "Serve un check-in valido per segnalare il cliente assente.",
  FC_REPORT_REASON_REQUIRED: "Descrivi il motivo della segnalazione (almeno 10 caratteri).",
  FC_REPORT_WINDOW: "Il termine è scaduto: 48 ore per l'esecuzione non conforme, 7 giorni per i danni.",
  FC_BANNED: "Registrazione non consentita. Per chiarimenti scrivi all'assistenza o a ri-sco@pec.it.",
  FC_COMPLAINT_WINDOW: "Il reclamo si può presentare entro 1 mese dalla decisione.",
  FC_SAME_OPERATOR: "Il reclamo deve essere esaminato da un operatore diverso da chi ha preso la decisione.",
  FC_INVALID_INPUT: "Dati non validi: controlla i campi e riprova.",
  FC_RATE_LIMIT: "Hai inviato troppe segnalazioni oggi. Riprova domani o scrivi a ri-sco@pec.it.",
  FC_PAYOUT_AMOUNT: "Puoi prelevare almeno 10 €.",
  FC_PAYOUT_BALANCE: "Il saldo disponibile non è sufficiente.",
  FC_LEAVE_ACTIVE_BOOKINGS: "Hai prenotazioni, pagamenti o prelievi ancora in corso: chiudili prima di uscire.",
};

/** Messaggi italiani già pensati per l'utente sollevati dal DB (es. saldo insufficiente). */
const PASSTHROUGH = [
  "Saldo crediti insufficiente",
  "Termine per contestare scaduto",
  "Non è possibile contestare",
];

export function errorCode(error: unknown): string | null {
  const message = messageOf(error);
  const match = message.match(/FC_[A-Z_]+/);
  return match ? match[0] : null;
}

function messageOf(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

export function toUserMessage(error: unknown, fallback = GENERIC_ERROR_MESSAGE): string {
  const code = errorCode(error);
  if (code && FC_MESSAGES[code]) return FC_MESSAGES[code];
  const message = messageOf(error);
  const known = PASSTHROUGH.find((p) => message.includes(p));
  if (known) return message;
  if (error) console.error(error);
  return fallback;
}

/** Errori di Supabase Auth (in inglese) tradotti per l'utente. */
export function authErrorMessage(error: unknown): string {
  const message = messageOf(error).toLowerCase();
  if (message.includes("invalid login credentials")) return "Email o password non corretti.";
  if (message.includes("email not confirmed")) return "Conferma prima la tua email: ti abbiamo inviato un link.";
  // Il trigger della lista dei bannati arriva così da Supabase Auth.
  if (message.includes("database error saving new user"))
    return "Registrazione non consentita con questi dati. Per chiarimenti scrivi a ri-sco@pec.it.";
  if (message.includes("already registered")) return "Questa email è già registrata: accedi con la tua password.";
  if (message.includes("password should be")) return "La password non rispetta i requisiti minimi.";
  if (message.includes("rate limit") || message.includes("too many")) return "Troppi tentativi. Riprova tra qualche minuto.";
  if (message.includes("same password")) return "La nuova password deve essere diversa da quella attuale.";
  if (message.includes("email address") && message.includes("invalid")) return "Indirizzo email non valido o non raggiungibile. Usane uno reale.";
  if (message.includes("expired") || message.includes("invalid")) return "Il link non è più valido. Richiedine uno nuovo.";
  if (error) console.error(error);
  return GENERIC_ERROR_MESSAGE;
}
