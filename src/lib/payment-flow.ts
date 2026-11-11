/** TU 7.5 / 13.4: esecuzione non conforme entro 48 ore, danni entro 7 giorni. Non bloccano il pagamento. */
export const REPORT_WINDOW_HOURS = 48;
export const DAMAGE_WINDOW_DAYS = 7;

function serviceEnd(booking: { completed_at?: string | null; scheduled_date: string }): number {
  return new Date(booking.completed_at ?? booking.scheduled_date).getTime();
}

/** Entro 48 ore si segnala tutto; fino a 7 giorni solo i danni. */
export function onlyDamageReportable(booking: { completed_at?: string | null; scheduled_date: string }): boolean {
  return Date.now() > serviceEnd(booking) + REPORT_WINDOW_HOURS * 3_600_000;
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  none: "Non pagato",
  held: "Crediti bloccati",
  pending_release: "In attesa di erogazione",
  released: "Pagato al professionista",
  refunded: "Rimborsato",
  disputed: "Pagamento sospeso",
};

export function canDisputeBooking(booking: {
  status: string;
  payment_status?: string | null;
  completed_at?: string | null;
  scheduled_date: string;
}): boolean {
  if (booking.status !== "completed") return false;
  return Date.now() <= serviceEnd(booking) + DAMAGE_WINDOW_DAYS * 86_400_000;
}

/** Orario di erogazione: 3 ore dopo "Servizio completato". */
export function getDisputeDeadlineLabel(booking: { completed_at?: string | null; scheduled_date: string }): string {
  return new Date(serviceEnd(booking) + 3 * 3_600_000).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
