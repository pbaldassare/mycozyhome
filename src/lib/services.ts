import type { Database } from "@/integrations/supabase/types";

export type ServiceType = Database["mycozyhome"]["Enums"]["service_type"];

export interface ServiceInfo {
  id: ServiceType;
  label: string;
  description: string;
  group: "casa" | "animali";
}

/** Catalogo unico dei servizi: stessi nomi per clienti, professionisti e admin. */
export const SERVICE_CATALOG: ServiceInfo[] = [
  { id: "cleaning", label: "Pulizia casa", description: "Pulizie ordinarie e profonde", group: "casa" },
  { id: "office_cleaning", label: "Pulizia uffici", description: "Pulizia di uffici e studi", group: "casa" },
  { id: "sanitization", label: "Sanificazione", description: "Sanificazione degli ambienti", group: "casa" },
  { id: "ironing", label: "Stiratura", description: "Stiratura e lavanderia a domicilio", group: "casa" },
  { id: "wardrobe_seasonal", label: "Cambio stagione", description: "Cambio stagione degli armadi", group: "casa" },
  { id: "decluttering", label: "Riordino", description: "Riordino e decluttering", group: "casa" },
  { id: "home_organizing", label: "Organizzazione degli spazi", description: "Organizzazione professionale della casa", group: "casa" },
  { id: "post_renovation", label: "Pulizia post-trasloco", description: "Dopo un trasloco o una ristrutturazione", group: "casa" },
  { id: "seasonal_cleaning", label: "Pulizie stagionali", description: "Pulizie di primavera, feste e altro", group: "casa" },
  { id: "garden_care", label: "Piante e giardino", description: "Cura di piante e giardino", group: "casa" },
  { id: "dog_sitter", label: "Dog sitter", description: "Compagnia e cura del cane", group: "animali" },
  { id: "dog_walking", label: "Passeggiate con il cane", description: "Uscite quotidiane con il cane", group: "animali" },
  { id: "pet_care_travel", label: "Cura animali in vacanza", description: "Cura degli animali in casa mentre sei via", group: "animali" },
  { id: "pet_space_cleaning", label: "Pulizia spazi animali", description: "Lettiere, cucce e spazi degli animali", group: "animali" },
];

export const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_CATALOG.map((s) => [s.id, s.label]),
);

export function serviceLabel(id: string | null | undefined): string {
  return (id && SERVICE_LABELS[id]) || "Servizio";
}
