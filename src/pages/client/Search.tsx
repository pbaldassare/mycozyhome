import { useState } from "react";
import { Search, SlidersHorizontal, Home as HomeIcon, Shirt, Building2, SprayCan, Baby, Dog, Loader2, List, Map } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/client/AppHeader";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { ProfessionalsMap } from "@/components/maps/ProfessionalsMap";
import { cn } from "@/lib/utils";
import { useSearchProfessionals } from "@/hooks/useProfessionals";

const serviceFilters = [
  { id: "all", label: "Tutti", icon: null },
  { id: "cleaning", label: "Pulizie", icon: HomeIcon },
  { id: "office_cleaning", label: "Ufficio", icon: Building2 },
  { id: "ironing", label: "Stiro", icon: Shirt },
  { id: "sanitization", label: "Sanificazione", icon: SprayCan },
  { id: "babysitter", label: "Babysitter", icon: Baby },
  { id: "dog_sitter", label: "Dog sitter", icon: Dog },
];

export default function ClientSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(
    searchParams.get("service") || "all"
  );
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: professionals, isLoading } = useSearchProfessionals(
    selectedService,
    searchQuery
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg flex-1 justify-center transition-colors",
              viewMode === "list"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg flex-1 justify-center transition-colors",
              viewMode === "map"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Map className="h-4 w-4" />
            Mappa
          </button>
        </div>
      </div>

      {/* Results */}
      <div className={cn("flex-1", viewMode === "list" ? "px-4 pb-4" : "")}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "map" ? (
          <div className="h-[calc(100vh-280px)] min-h-[400px]">
            <ProfessionalsMap
              professionals={professionals || []}
              onProfessionalClick={(id) => navigate(`/client/professional/${id}`)}
            />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {professionals?.length || 0} professionisti trovati
            </p>
            {professionals && professionals.length > 0 ? (
              <div className="space-y-3">
                {professionals.map((pro) => (
                  <ProfessionalCard
                    key={pro.id}
                    id={pro.id}
                    name={pro.name}
                    rating={pro.rating}
                    reviewCount={pro.reviewCount}
                    distance={pro.distance}
                    services={pro.services}
                    hourlyRate={pro.hourlyRate}
                    isVerified={pro.isVerified}
                    avatarUrl={pro.avatarUrl || undefined}
                    showFavorite
                    onClick={() => navigate(`/client/professional/${pro.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">Nessun risultato</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Prova a modificare i filtri di ricerca
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
