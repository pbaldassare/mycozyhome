/** Una prenotazione è finita solo dopo l'orario di fine, non dalla mezzanotte del suo giorno. */
export function isBookingOver(b: { scheduled_date: string; scheduled_time_end: string }, now = new Date()): boolean {
  return new Date(`${b.scheduled_date}T${b.scheduled_time_end.slice(0, 5)}:00`) < now;
}
