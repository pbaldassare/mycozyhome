import type { ServiceType } from "@/lib/services";

export interface AssistantSuggestion {
  service_type: ServiceType;
  hours: number;
  notes: string;
}

// Dal più specifico al più generico: vince la prima regola che trova una parola chiave.
// ponytail: parole chiave a mano, niente AI (zero costi); se sbaglia troppo, aggiungere sinonimi qui.
const RULES: [ServiceType, RegExp][] = [
  ["post_renovation", /trasloc|ristruttur|cantiere|lavori in casa|imbianc/],
  ["pet_space_cleaning", /lettier|cucci|gabbi|acquari|spazi? (de)?gli? animali/],
  ["pet_care_travel", /vacanz|viaggio|sono via|in ferie|mentre sono fuori/],
  ["dog_walking", /passeggi|portare fuori|portarl. fuori|uscit/],
  ["dog_sitter", /dog ?sitter|cane|cani|cucciol|gatt|animal/],
  ["ironing", /stir|ferro da stiro|camici/],
  ["wardrobe_seasonal", /cambio (di )?stagione|cambio armadi|armadi/],
  ["decluttering", /decluttering|riordin|disordin|buttare|liberare/],
  ["home_organizing", /organizz|dispensa|cantina|box auto|garage/],
  ["sanitization", /sanific|disinfett|igienizz|covid/],
  ["seasonal_cleaning", /primavera|natale|pasqua|stagional|a fondo|vetri|tende/],
  ["garden_care", /giardin|piante|prato|siepe|terrazz|balcon|potare/],
  ["office_cleaning", /ufficio|uffici|studio|negozio/],
  ["cleaning", /pulizi|pulire|polvere|pavimenti|bagno|cucina|casa/],
];

const ROOMS: Record<string, number> = { monolocale: 1, bilocale: 2, trilocale: 3, quadrilocale: 4, villa: 6 };

function estimateHours(text: string, service: ServiceType): number {
  const mq = text.match(/(\d{2,3})\s*(mq|m2|metri)/);
  const rooms = Object.entries(ROOMS).find(([k]) => text.includes(k))?.[1];
  const ceste = text.match(/(\d+)\s*cest/);
  const n = (re: RegExp) => Number(text.match(re)?.[1] ?? 0);

  let hours = 2;
  if (service === "ironing") hours = ceste ? Number(ceste[1]) * 1.5 : 2;
  else if (service === "dog_walking") hours = 1;
  else if (mq) hours = Number(mq[1]) / 30;
  else if (rooms) hours = rooms + 1;
  else if (n(/(\d+)\s*(stanze|camere|locali)/)) hours = n(/(\d+)\s*(stanze|camere|locali)/) + 1;

  if (service === "post_renovation" || service === "seasonal_cleaning") hours *= 1.5;
  const explicit = n(/(\d+)\s*or[ae]\b/);
  if (explicit) hours = explicit;
  // Mezz'ore come il DB, tra 1 e 8 ore.
  return Math.min(8, Math.max(1, Math.round(hours * 2) / 2));
}

/** Interpreta una richiesta scritta a parole. null se non riconosce nessun servizio. */
export function suggestFromText(input: string): AssistantSuggestion | null {
  const text = input.toLowerCase();
  const rule = RULES.find(([, re]) => re.test(text));
  if (!rule) return null;
  const service_type = rule[0];
  return { service_type, hours: estimateHours(text, service_type), notes: input.trim().slice(0, 500) };
}
