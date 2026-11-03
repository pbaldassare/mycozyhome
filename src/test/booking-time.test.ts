import { describe, expect, it } from "vitest";
import { isBookingOver } from "@/lib/booking-time";

describe("isBookingOver", () => {
  const now = new Date("2026-11-03T15:30:00");
  it("oggi più tardi non è passata", () => {
    expect(isBookingOver({ scheduled_date: "2026-11-03", scheduled_time_end: "18:00:00" }, now)).toBe(false);
  });
  it("oggi già finita è passata", () => {
    expect(isBookingOver({ scheduled_date: "2026-11-03", scheduled_time_end: "12:00:00" }, now)).toBe(true);
  });
  it("ieri è passata", () => {
    expect(isBookingOver({ scheduled_date: "2026-11-02", scheduled_time_end: "23:00:00" }, now)).toBe(true);
  });
});
