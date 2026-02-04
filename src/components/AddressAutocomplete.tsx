import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressPrediction {
  place_id: string;
  description: string;
  main_text?: string;
  secondary_text?: string;
}

interface AddressResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id: string;
}

interface AddressAutocompleteProps {
  value?: string;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onSelect,
  placeholder = "Inserisci indirizzo...",
  className,
  disabled,
}: AddressAutocompleteProps) {
  const [input, setInput] = useState(value || "");
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = async (query: string) => {
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("geo-service/autocomplete", {
        body: { input: query, country: "it" },
      });

      if (error) throw error;

      setPredictions(data.predictions || []);
      setShowDropdown(true);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelectPrediction = async (prediction: AddressPrediction) => {
    setLoading(true);
    setShowDropdown(false);

    try {
      const { data, error } = await supabase.functions.invoke("geo-service/place-details", {
        body: { place_id: prediction.place_id },
      });

      if (error) throw error;

      setInput(data.formatted_address);
      onSelect(data as AddressResult);
    } catch (err) {
      console.error("Place details error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={input}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-10"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : input ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {prediction.main_text || prediction.description}
                </p>
                {prediction.secondary_text && (
                  <p className="text-xs text-muted-foreground truncate">
                    {prediction.secondary_text}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}