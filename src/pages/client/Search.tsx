import { useState, lazy, Suspense } from "react";
import { Search, SlidersHorizontal, Home as HomeIcon, Shirt, PackageOpen, LayoutGrid, Truck, Snowflake, TreePine, Leaf, Dog, PawPrint, Trash2, Loader2, List, Map, MapPin, Building2, SprayCan } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/client/AppHeader";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { SearchFilters, SearchFiltersState } from "@/components/client/SearchFilters";
import { cn } from "@/lib/utils";
import { useSearchProfessionals, RANKING_CRITERIA } from "@/hooks/useProfessionals";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useClientAddress } from "@/hooks/useClientAddress";


import { LoadError } from "@/components/LoadError";
// La mappa (Google Maps) pesa circa 150 KB: si carica solo se si apre la vista mappa.
const ProfessionalsMap = lazy(() =>
  import("@/components/maps/ProfessionalsMap").then((m) => ({ default: m.ProfessionalsMap })),
);
const serviceFilters = [
  { id: "all", label: "Tutti", icon: null },
  { id: "cleaning", label: "Pulizie", icon: HomeIcon },
  { id: "office_cleaning", label: "Uffici", icon: Building2 },
  { id: "sanitization", label: "Sanificazione", icon: SprayCan },
  { id: "ironing", label: "Stiratura", icon: Shirt },
  { id: "wardrobe_seasonal", label: "Cambio stagione", icon: PackageOpen },
  { id: "decluttering", label: "Riordino", icon: LayoutGrid },
  { id: "post_renovation", label: "Post-trasloco", icon: Truck },
  { id: "seasonal_cleaning", label: "Stagionali", icon: Snowflake },
  { id: "garden_care", label: "Giardino", icon: TreePine },
  { id: "home_organizing", label: "Organizzazione", icon: Leaf },
  { id: "dog_sitter", label: "Dog sitter", icon: Dog },
  { id: "dog_walking", label: "Passeggiate", icon: Dog },
  { id: "pet_care_travel", label: "Cura animali", icon: PawPrint },
  { id: "pet_space_cleaning", label: "Pulizia spazi", icon: Trash2 },
];

const defaultFilters: SearchFiltersState = {
  maxDistance: null,
  minPrice: 0,
  maxPrice: 100,
  minRating: 0,
};

export default function ClientSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(
    searchParams.get("service") || "all"
  );
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersState>(defaultFilters);
  
  const geo = useGeolocation();
  const { address: savedAddress } = useClientAddress();
  // Prima l'indirizzo salvato, poi la posizione reale del telefono.
  const userLat = savedAddress?.lat ?? geo.latitude;
  const userLon = savedAddress?.lng ?? geo.longitude;
  const geoLoading = !savedAddress && geo.loading;

  const { data: professionals, isLoading, isError, refetch } = useSearchProfessionals(
    selectedService,
    searchQuery,
    {
      userLatitude: userLat || undefined,
      userLongitude: userLon || undefined,
      filters,
    }
  );

  const activeFiltersCount = [
    filters.maxDistance !== null,
    filters.minPrice > 0,
    filters.maxPrice < 100,
    filters.minRating > 0,
  ].filter(Boolean).length;

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
            className="h-12 w-12 rounded-xl border-border/30 relative"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.maxDistance !== null && (
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                Max {filters.maxDistance} km
              </Badge>
            )}
            {(filters.minPrice > 0 || filters.maxPrice < 100) && (
              <Badge variant="secondary" className="text-xs">
                €{filters.minPrice}-{filters.maxPrice}/h
              </Badge>
            )}
            {filters.minRating > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.minRating}+ ⭐
              </Badge>
            )}
          </div>
        )}

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
        ) : isError ? (
          <LoadError onRetry={() => refetch()} message="Impossibile caricare i risultati della ricerca." />
        ) : viewMode === "map" ? (
          <div className="h-[calc(100vh-280px)] min-h-[400px]">
            <MapErrorBoundary fallbackMessage="Errore durante il caricamento della mappa. Prova a tornare alla lista o riprova.">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
              >
                <ProfessionalsMap
                  professionals={professionals || []}
                  onProfessionalClick={(id) => navigate(`/client/professional/${id}`)}
                />
              </Suspense>
            </MapErrorBoundary>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {professionals?.length || 0} professionisti trovati
            </p>
            <p className="text-xs text-muted-foreground mb-4">{RANKING_CRITERIA}</p>
            {professionals && professionals.length > 0 ? (
              <div className="space-y-3">
                {professionals.map((pro) => (
                  <ProfessionalCard
                    key={pro.id}
                    id={pro.id}
                    name={pro.name}
                    rating={pro.rating}
                    reviewCount={pro.reviewCount}
                    yearsExperience={pro.yearsExperience}
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

      {/* Filters Sheet */}
      <SearchFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
