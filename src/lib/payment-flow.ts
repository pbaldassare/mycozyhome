export const DISPUTE_WINDOW_DAYS = 5;

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
  if (!booking.payment_status || !["held", "pending_release"].includes(booking.payment_status)) {
    return false;
  }
  if (!["confirmed", "completed"].includes(booking.status)) {
    return false;
  }

  const deadline = booking.completed_at
    ? new Date(booking.completed_at)
    : new Date(booking.scheduled_date);

  deadline.setDate(deadline.getDate() + DISPUTE_WINDOW_DAYS);
  return new Date() <= deadline;
}

export function getDisputeDeadlineLabel(booking: {
  completed_at?: string | null;
  scheduled_date: string;
}): string {
  const base = booking.completed_at
    ? new Date(booking.completed_at)
    : new Date(booking.scheduled_date);
  base.setDate(base.getDate() + DISPUTE_WINDOW_DAYS);
  return base.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
