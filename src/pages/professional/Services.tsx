import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import serviceCleaningImg from "@/assets/service-cleaning.png";
import serviceIroningImg from "@/assets/service-ironing.png";
import servicePetsitterImg from "@/assets/service-petsitter.png";

interface Service {
  id: string;
  name: string;
  price: number;
  priceType: "hour" | "load" | "session";
  isActive: boolean;
  image: string;
}

const initialServices: Service[] = [
  { id: "1", name: "Pulizia Casa", price: 18, priceType: "hour", isActive: true, image: serviceCleaningImg },
  { id: "2", name: "Stiratura", price: 15, priceType: "hour", isActive: true, image: serviceIroningImg },
  { id: "3", name: "Dog Sitter", price: 20, priceType: "hour", isActive: false, image: servicePetsitterImg },
];

export default function ProfessionalServices() {
  const [services, setServices] = useState<Service[]>(initialServices);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
    toast.success("Servizio aggiornato");
  };

  const getPriceLabel = (type: string) => {
    switch (type) {
      case "hour":
        return "/ora";
      case "load":
        return "/carico";
      case "session":
        return "/sessione";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold">I Miei Servizi</h1>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Top Services */}
        <section>
          <h2 className="text-base font-semibold mb-3">Servizi Principali</h2>
          <div className="grid grid-cols-3 gap-3">
            {services
              .filter((s) => s.isActive)
              .slice(0, 3)
              .map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl overflow-hidden bg-card border"
                >
                  <div className="aspect-square relative">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs font-medium truncate">{service.name}</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* All Services */}
        <section>
          <h2 className="text-base font-semibold mb-3">Tutti i Servizi</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-primary font-semibold">
                        €{service.price}
                        {getPriceLabel(service.priceType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.isActive}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Pricing Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">💡 Consiglio</h3>
            <p className="text-sm text-muted-foreground">
              I professionisti con prezzi competitivi ricevono il 40% in più di prenotazioni. 
              Controlla i prezzi medi della tua zona per restare competitivo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
