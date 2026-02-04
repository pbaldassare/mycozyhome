import { useState } from "react";
import { Search, SlidersHorizontal, Home as HomeIcon, Shirt, Building2, SprayCan, Baby, Dog } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/client/AppHeader";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { cn } from "@/lib/utils";

const serviceFilters = [
  { id: "all", label: "Tutti", icon: null },
  { id: "cleaning", label: "Pulizie", icon: HomeIcon },
  { id: "office_cleaning", label: "Ufficio", icon: Building2 },
  { id: "ironing", label: "Stiro", icon: Shirt },
  { id: "sanitization", label: "Sanificazione", icon: SprayCan },
  { id: "babysitter", label: "Babysitter", icon: Baby },
  { id: "dog_sitter", label: "Dog sitter", icon: Dog },
];

const mockProfessionals = [
  {
    id: "1",
    name: "Maria Rossi",
    rating: 4.9,
    reviewCount: 127,
    distance: "1.2 km",
    services: ["Pulizie casa", "Stiro"],
    hourlyRate: 15,
    isVerified: true,
  },
  {
    id: "2",
    name: "Giuseppe Bianchi",
    rating: 4.8,
    reviewCount: 89,
    distance: "2.5 km",
    services: ["Pulizie ufficio", "Sanificazione"],
    hourlyRate: 18,
    isVerified: true,
  },
  {
    id: "3",
    name: "Anna Verdi",
    rating: 4.7,
    reviewCount: 56,
    distance: "3.1 km",
    services: ["Babysitter"],
    hourlyRate: 12,
    isVerified: true,
  },
  {
    id: "4",
    name: "Luca Neri",
    rating: 4.6,
    reviewCount: 34,
    distance: "4.0 km",
    services: ["Dog sitter", "Pulizie casa"],
    hourlyRate: 14,
    isVerified: false,
  },
];

export default function ClientSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(
    searchParams.get("service") || "all"
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Cerca" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Nome, servizio, zona..."
              className="pl-12 h-12 rounded-xl bg-card border-border/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-border/30"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Service Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {serviceFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedService(filter.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                selectedService === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/30 text-foreground hover:bg-muted"
              )}
            >
              {filter.icon && <filter.icon className="h-4 w-4" />}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {mockProfessionals.length} professionisti trovati
          </p>
          <div className="space-y-3">
            {mockProfessionals.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                {...pro}
                onClick={() => navigate(`/client/professional/${pro.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
