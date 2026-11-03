import { calculateDistance } from "@/hooks/useGeolocation";

/** Velocità media in città per stimare l'arrivo. */
const URBAN_KMH = 25;

export const LIVE_STEPS = ["Prenotato", "Confermato", "In viaggio", "Al lavoro", "Completato"] as const;

/** Minuti stimati per arrivare, minimo 1. */
export function etaMinutes(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  return Math.max(1, Math.round((calculateDistance(fromLat, fromLng, toLat, toLng) / URBAN_KMH) * 60));
}

/** Indice in LIVE_STEPS; -1 se annullata. */
export function liveStep(
  booking: { status: string; en_route_at?: string | null },
  checkInAt?: string | null,
): number {
  if (booking.status === "cancelled") return -1;
  if (booking.status === "completed") return 4;
  if (checkInAt) return 3;
  if (booking.status === "confirmed" && booking.en_route_at) return 2;
  if (booking.status === "confirmed") return 1;
  return 0;
}
