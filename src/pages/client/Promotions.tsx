import { useState } from "react";
import { ArrowLeft, Gift, Share2, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import promoCleaningImg from "@/assets/promo-cleaning.png";
import promoReferralImg from "@/assets/promo-referral.png";

interface Promotion {
  id: string;
  title: string;
  description: string;
  code?: string;
  expiresIn: string;
  type: "discount" | "referral";
  image: string;
}

const promotions: Promotion[] = [
  {
    id: "1",
    title: "15% di sconto sulla prossima pulizia",
    description: "Usa il codice",
    code: "PULITO15",
    expiresIn: "Scade tra 3 giorni",
    type: "discount",
    image: promoCleaningImg,
  },
  {
    id: "2",
    title: "Invita un amico, ricevi 20€",
    description: "Condividi il tuo link referral e guadagna crediti",
    expiresIn: "Scade tra 1 settimana",
    type: "referral",
    image: promoReferralImg,
  },
];

export default function Promotions() {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");

  const handleApply = (code: string) => {
    toast.success(`Codice ${code} applicato!`, {
      description: "Lo sconto verrà applicato alla tua prossima prenotazione.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "CasaFacile - Invita un amico",
        text: "Registrati su CasaFacile con il mio link e ricevi 10€ di sconto!",
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copiato negli appunti!");
    }
  };

  const handleApplyCode = () => {
    if (!promoCode.trim()) {
      toast.error("Inserisci un codice promozionale");
      return;
    }
    toast.success(`Codice ${promoCode} applicato!`, {
      description: "Lo sconto verrà applicato alla tua prossima prenotazione.",
    });
    setPromoCode("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Promozioni</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Available Promotions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Promozioni Disponibili</h2>
          <div className="space-y-4">
            {promotions.map((promo) => (
              <Card key={promo.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <span className="text-sm font-medium text-primary">
                        {promo.expiresIn}
                      </span>
                      <h3 className="font-semibold text-foreground">
                        {promo.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {promo.description}
                        {promo.code && (
                          <>
                            {" "}
                            <span className="font-bold text-foreground">
                              {promo.code}
                            </span>{" "}
                            al checkout
                          </>
                        )}
                      </p>
                      {promo.type === "discount" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-primary border-primary hover:bg-primary/10"
                          onClick={() => handleApply(promo.code!)}
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          Applica
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-primary border-primary hover:bg-primary/10"
                          onClick={handleShare}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Condividi
                        </Button>
                      )}
                    </div>
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={promo.image}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Enter Promo Code */}
        <section>
          <h2 className="text-xl font-bold mb-4">Inserisci Codice Promozionale</h2>
          <Input
            placeholder="Inserisci il tuo codice"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="bg-muted/50"
          />
          <p className="text-sm text-muted-foreground mt-3">
            Termini e condizioni applicabili. Consulta i dettagli completi di ogni promozione.
          </p>
        </section>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl"
          onClick={handleApplyCode}
        >
          <Gift className="h-5 w-5 mr-2" />
          Applica Codice
        </Button>
      </div>
    </div>
  );
}
