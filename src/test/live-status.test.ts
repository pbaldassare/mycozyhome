import { etaMinutes, liveStep } from "@/lib/live-status";

describe("live-status", () => {
  it("stima l'arrivo a 25 km/h, minimo 1 minuto", () => {
    // Duomo → Stazione Centrale (Milano): circa 2,2 km
    expect(etaMinutes(45.4642, 9.19, 45.4842, 9.2048)).toBe(6);
    expect(etaMinutes(45.4642, 9.19, 45.4642, 9.19)).toBe(1);
  });

  it("ricava lo step dallo stato", () => {
    expect(liveStep({ status: "pending" })).toBe(0);
    expect(liveStep({ status: "confirmed" })).toBe(1);
    expect(liveStep({ status: "confirmed", en_route_at: "x" })).toBe(2);
    expect(liveStep({ status: "confirmed", en_route_at: "x" }, "y")).toBe(3);
    expect(liveStep({ status: "completed" })).toBe(4);
    expect(liveStep({ status: "cancelled" })).toBe(-1);
  });
});
