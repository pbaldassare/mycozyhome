import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

export interface SearchFiltersState {
  maxDistance: number | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
}

interface SearchFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
}

export function SearchFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFiltersState>(filters);

  const handleReset = () => {
    const resetFilters: SearchFiltersState = {
      maxDistance: null,
      minPrice: 0,
      maxPrice: 100,
      minRating: 0,
    };
    setLocalFilters(resetFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const distanceOptions = [
    { value: null, label: "Qualsiasi" },
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 20, label: "20 km" },
    { value: 50, label: "50 km" },
  ];

  const ratingOptions = [
    { value: 0, label: "Tutte" },
    { value: 3, label: "3+ ⭐" },
    { value: 4, label: "4+ ⭐" },
    { value: 4.5, label: "4.5+ ⭐" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[80vh]">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Filtri avanzati</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={handleReset}
            >
              Resetta
            </Button>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-8 overflow-y-auto">
          {/* Distance Filter */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Distanza massima</Label>
            <div className="flex flex-wrap gap-2">
              {distanceOptions.map((option) => (
                <button
                  key={option.value ?? "any"}
                  onClick={() =>
                    setLocalFilters({ ...localFilters, maxDistance: option.value })
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    localFilters.maxDistance === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Fascia di prezzo</Label>
              <span className="text-sm text-muted-foreground">
                €{localFilters.minPrice} - €{localFilters.maxPrice}/h
              </span>
            </div>
            <div className="space-y-6 px-2">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Minimo</span>
                <Slider
                  value={[localFilters.minPrice]}
                  onValueChange={([value]) =>
                    setLocalFilters({
                      ...localFilters,
                      minPrice: Math.min(value, localFilters.maxPrice - 5),
                    })
                  }
                  max={95}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Massimo</span>
                <Slider
                  value={[localFilters.maxPrice]}
                  onValueChange={([value]) =>
                    setLocalFilters({
                      ...localFilters,
                      maxPrice: Math.max(value, localFilters.minPrice + 5),
                    })
                  }
                  max={100}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Valutazione minima</Label>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalFilters({ ...localFilters, minRating: option.value })
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    localFilters.minRating === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button className="w-full h-12 text-base" onClick={handleApply}>
            Applica filtri
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
