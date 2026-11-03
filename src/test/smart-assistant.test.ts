import { describe, it, expect } from "vitest";
import { suggestFromText } from "@/lib/smart-assistant";

describe("assistente prenotazione", () => {
  it("riconosce servizio e durata dal testo", () => {
    expect(suggestFromText("trilocale con cane, pulizia dopo trasloco")).toMatchObject({ service_type: "post_renovation", hours: 6 });
    expect(suggestFromText("stirare 2 ceste")).toMatchObject({ service_type: "ironing", hours: 3 });
    expect(suggestFromText("portare fuori il cane")).toMatchObject({ service_type: "dog_walking", hours: 1 });
    expect(suggestFromText("pulizia bilocale")).toMatchObject({ service_type: "cleaning", hours: 3 });
    expect(suggestFromText("pulire casa 90 mq per 4 ore")).toMatchObject({ service_type: "cleaning", hours: 4 });
    expect(suggestFromText("bada al gatto mentre sono in vacanza")?.service_type).toBe("pet_care_travel");
    expect(suggestFromText("ciao")).toBeNull();
  });
});
