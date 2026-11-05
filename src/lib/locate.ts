import { supabase } from "@/integrations/supabase/client";

export interface Located { text: string; lat: number; lng: number }

const ERRORS: Record<number, string> = {
  1: "Permesso posizione negato. Su iPhone: Impostazioni → Privacy → Localizzazione → Siti Safari → Chiedi, poi riprova.",
  2: "Posizione non trovata. Controlla che la localizzazione sia attiva.",
  3: "La posizione ci sta mettendo troppo. Riprova all'aperto o scrivi l'indirizzo.",
};

/** Posizione GPS + via leggibile (se la ricerca della via fallisce resta "La mia posizione"). */
export async function locateMe(): Promise<Located> {
  if (!navigator.geolocation) throw new Error("Il tuo browser non supporta la posizione. Scrivi l'indirizzo.");
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, (e) => reject(new Error(ERRORS[e.code] ?? ERRORS[2])), {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    }),
  );
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const { data } = await supabase.functions.invoke("mycozyhome-geo-service/geocode", { body: { lat, lng } }).catch(() => ({ data: null }));
  return { text: data?.formatted_address ?? "La mia posizione", lat, lng };
}
