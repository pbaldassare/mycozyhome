import { useState } from "react";
import {
  Sparkles,
  Home,
  Building2,
  Shirt,
  ShieldCheck,
  Baby,
  Dog,
  Edit,
  Euro,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  priceType: "hourly" | "fixed";
  isActive: boolean;
  professionalsCount: number;
  bookingsThisMonth: number;
  requirements?: string[];
}

const services: Service[] = [
  {
    id: "cleaning",
    name: "Pulizia Casa",
    icon: Home,
    description: "Pulizia domestica completa, inclusi vetri",
    priceType: "hourly",
    isActive: true,
    professionalsCount: 45,
    bookingsThisMonth: 156,
  },
  {
    id: "office_cleaning",
    name: "Pulizia Uffici",
    icon: Building2,
    description: "Pulizia professionale di spazi lavorativi",
    priceType: "hourly",
    isActive: true,
    professionalsCount: 23,
    bookingsThisMonth: 67,
  },
  {
    id: "ironing",
    name: "Stiratura",
    icon: Shirt,
    description: "Servizio di stiratura a domicilio",
    priceType: "hourly",
    isActive: true,
    professionalsCount: 34,
    bookingsThisMonth: 89,
  },
  {
    id: "sanitization",
    name: "Sanificazione",
    icon: ShieldCheck,
    description: "Sanificazione professionale ambienti",
    priceType: "fixed",
    isActive: true,
    professionalsCount: 12,
    bookingsThisMonth: 23,
  },
  {
    id: "babysitter",
    name: "Babysitter",
    icon: Baby,
    description: "Assistenza bambini a domicilio",
    priceType: "hourly",
    isActive: true,
    professionalsCount: 28,
    bookingsThisMonth: 134,
    requirements: ["Certificato primo soccorso", "Esperienza minima 2 anni"],
  },
  {
    id: "dog_sitter",
    name: "Dog Sitter",
    icon: Dog,
    description: "Custodia e passeggiate per cani",
    priceType: "hourly",
    isActive: true,
    professionalsCount: 19,
    bookingsThisMonth: 78,
    requirements: ["Esperienza con animali"],
  },
];

export default function Services() {
  const [serviceList, setServiceList] = useState(services);

  const toggleService = (id: string) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servizi</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i servizi disponibili sulla piattaforma
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90">
          <Sparkles className="w-4 h-4" />
          Nuovo Servizio
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {serviceList.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              className={cn(
                "bg-card rounded-2xl border border-border/30 p-5 transition-all duration-200 hover:shadow-lg hover:border-border/50",
                !service.isActive && "opacity-60"
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={cn(
                    "p-3 rounded-xl flex-shrink-0",
                    service.isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{service.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Price Type Info */}
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Euro className="w-4 h-4" />
                <span className="font-medium text-foreground">
                  {service.priceType === "hourly" ? "Prezzo orario" : "Prezzo fisso"}
                </span>
                <span className="text-xs">• Impostato dal professionista</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-xl font-bold text-foreground">{service.professionalsCount}</p>
                  <p className="text-xs text-muted-foreground">Professionisti</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-xl font-bold text-foreground">{service.bookingsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Prenotazioni/mese</p>
                </div>
              </div>

              {/* Requirements */}
              {service.requirements && (
                <div className="mb-4 p-3 bg-warning/10 rounded-xl border border-warning/20">
                  <p className="text-xs font-medium text-warning mb-1.5">
                    Requisiti speciali richiesti:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {service.requirements.map((req, i) => (
                      <li key={i}>• {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {service.isActive ? "Attivo" : "Disattivo"}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <Edit className="w-4 h-4" />
                  Modifica
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
