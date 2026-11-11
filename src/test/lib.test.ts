import { describe, it, expect, vi, afterEach } from "vitest";

// storage.ts importa il client Supabase: nei test non serve una connessione vera.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { toUserMessage, authErrorMessage, errorCode, GENERIC_ERROR_MESSAGE } from "@/lib/errors";
import { storagePath } from "@/lib/storage";
import { SERVICE_CATALOG, SERVICE_LABELS, serviceLabel } from "@/lib/services";
import { canDisputeBooking, onlyDamageReportable, DAMAGE_WINDOW_DAYS } from "@/lib/payment-flow";
import { filterMessageContent } from "@/lib/content-filter";

describe("errori per l'utente", () => {
  afterEach(() => vi.restoreAllMocks());

  it("traduce i codici FC_* sollevati dal DB", () => {
    expect(toUserMessage({ message: "FC_PROMO_USED" })).toBe("Hai già usato questo codice promozionale.");
    expect(errorCode({ message: "ERROR: FC_BOOKING_HOURS (P0001)" })).toBe("FC_BOOKING_HOURS");
  });

  it("non mostra dettagli tecnici per gli errori imprevisti", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(toUserMessage({ message: 'relation "x" does not exist' })).toBe(GENERIC_ERROR_MESSAGE);
    expect(toUserMessage(new Error("boom"), "Riprova")).toBe("Riprova");
  });

  it("lascia passare i messaggi italiani già pensati per l'utente", () => {
    const msg = "Saldo crediti insufficiente. Ricarica il wallet per prenotare.";
    expect(toUserMessage({ message: msg })).toBe(msg);
  });

  it("traduce gli errori di Supabase Auth", () => {
    expect(authErrorMessage({ message: "Invalid login credentials" })).toBe("Email o password non corretti.");
    expect(authErrorMessage({ message: "User already registered" })).toMatch(/già registrata/);
  });
});

describe("percorsi dei file privati", () => {
  it("ricava il percorso dagli URL vecchi", () => {
    const url =
      "https://x.supabase.co/storage/v1/object/public/mycozyhome-chat-attachments/abc/1-foto%20casa.jpg";
    expect(storagePath("mycozyhome-chat-attachments", url)).toBe("abc/1-foto casa.jpg");
  });

  it("lascia invariati i percorsi già salvati come tali", () => {
    expect(storagePath("mycozyhome-dispute-evidence", "d1/123.png")).toBe("d1/123.png");
  });
});

describe("catalogo servizi", () => {
  it("ha 14 servizi senza duplicati e con etichette italiane", () => {
    expect(SERVICE_CATALOG).toHaveLength(14);
    expect(new Set(SERVICE_CATALOG.map((s) => s.id)).size).toBe(14);
    expect(SERVICE_LABELS.ironing).toBe("Stiratura");
    expect(serviceLabel("sconosciuto")).toBe("Servizio");
  });
});

describe("finestra di contestazione", () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  it("è di 7 giorni per i danni, 48 ore per il resto", () => {
    expect(DAMAGE_WINDOW_DAYS).toBe(7);
    const base = { status: "completed", payment_status: "pending_release", scheduled_date: daysAgo(10) };
    expect(canDisputeBooking({ ...base, completed_at: daysAgo(6) })).toBe(true);
    expect(canDisputeBooking({ ...base, completed_at: daysAgo(8) })).toBe(false);
    // Oltre 48 ore restano segnalabili solo i danni.
    expect(onlyDamageReportable({ ...base, completed_at: daysAgo(1) })).toBe(false);
    expect(onlyDamageReportable({ ...base, completed_at: daysAgo(3) })).toBe(true);
  });

  it("vale anche a pagamento già versato (la segnalazione non lo blocca)", () => {
    expect(
      canDisputeBooking({ status: "completed", payment_status: "released", completed_at: daysAgo(1), scheduled_date: daysAgo(1) }),
    ).toBe(true);
  });
});

describe("filtro dei contatti in chat", () => {
  it("nasconde telefono, email e link", () => {
    const result = filterMessageContent("Chiamami al 333 123 4567 o scrivi a mario@example.com, vedi www.sito.it");
    expect(result.isBlocked).toBe(true);
    expect(result.sanitizedContent).not.toMatch(/333|mario@|www\./);
  });

  it("lascia passare un messaggio normale", () => {
    const result = filterMessageContent("Arrivo alle 10:30, porto io i prodotti");
    expect(result.isBlocked).toBe(false);
  });
});

import { rankingScore } from "@/hooks/useProfessionals";
describe("rankingScore", () => {
  const base = { rating: 4, completed: 5, profileFields: ["a", "b", 1, "c"] };
  it("più vicino sale", () => {
    expect(rankingScore({ ...base, distanceKm: 2 })).toBeGreaterThan(rankingScore({ ...base, distanceKm: 20 }));
  });
  it("più servizi completati sale", () => {
    expect(rankingScore({ ...base, completed: 40 })).toBeGreaterThan(rankingScore(base));
  });
  it("profilo incompleto scende", () => {
    expect(rankingScore({ ...base, profileFields: [null, null, 1, "c"] })).toBeLessThan(rankingScore(base));
  });
});
