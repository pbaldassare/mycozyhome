import { describe, it, expect, vi, afterEach } from "vitest";

// storage.ts importa il client Supabase: nei test non serve una connessione vera.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { toUserMessage, authErrorMessage, errorCode, GENERIC_ERROR_MESSAGE } from "@/lib/errors";
import { storagePath } from "@/lib/storage";
import { SERVICE_CATALOG, SERVICE_LABELS, serviceLabel } from "@/lib/services";
import { canDisputeBooking, DISPUTE_WINDOW_DAYS } from "@/lib/payment-flow";
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

  it("è di 5 giorni dal completamento", () => {
    expect(DISPUTE_WINDOW_DAYS).toBe(5);
    const base = { status: "completed", payment_status: "pending_release", scheduled_date: daysAgo(10) };
    expect(canDisputeBooking({ ...base, completed_at: daysAgo(4) })).toBe(true);
    expect(canDisputeBooking({ ...base, completed_at: daysAgo(6) })).toBe(false);
  });

  it("non vale per pagamenti già rilasciati o rimborsati", () => {
    expect(
      canDisputeBooking({ status: "completed", payment_status: "released", completed_at: daysAgo(1), scheduled_date: daysAgo(1) }),
    ).toBe(false);
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
