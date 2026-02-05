import { useCallback, useState, useMemo, useEffect } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface Professional {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  services: string[];
  hourlyRate: number;
  latitude?: number;
  longitude?: number;
  city?: string;
}

interface ProfessionalsMapProps {
  professionals: Professional[];
  onProfessionalClick?: (id: string) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Safe coordinate validation - checks finite numbers and valid geo range
function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

// Safe access to google.maps - returns null if not available
function getGoogleMaps(): typeof google.maps | null {
  if (typeof window === "undefined") return null;
  const g = window.google;
  if (!g?.maps) return null;
  return g.maps;
}

// Inner component that only mounts when apiKey is ready
function ProfessionalsMapInner({ 
  professionals, 
  onProfessionalClick,
  apiKey,
  center,
}: ProfessionalsMapProps & { apiKey: string; center: { lat: number; lng: number } }) {
  const navigate = useNavigate();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  // Map options - defined inside component where google.maps is guaranteed to be available
  const defaultOptions: google.maps.MapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  }), []);

  // Filter professionals with valid coordinates (robust validation)
  const professionalsWithCoords = useMemo(() => {
    return professionals.filter((p) => isValidCoordinate(p.latitude, p.longitude));
  }, [professionals]);

  // Calculate distances
  const professionalsWithDistance = useMemo(() => {
    if (!isValidCoordinate(center.lat, center.lng)) return professionalsWithCoords;
    
    return professionalsWithCoords.map((p) => ({
      ...p,
      distance: p.latitude !== undefined && p.longitude !== undefined
        ? calculateDistance(center.lat, center.lng, p.latitude, p.longitude)
        : null,
    }));
  }, [professionalsWithCoords, center]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    const gMaps = getGoogleMaps();
    if (!gMaps) return;
    
    // Fit bounds to show all markers
    if (professionalsWithCoords.length > 0) {
      const bounds = new gMaps.LatLngBounds();
      professionalsWithCoords.forEach((p) => {
        if (isValidCoordinate(p.latitude, p.longitude)) {
          bounds.extend({ lat: p.latitude!, lng: p.longitude! });
        }
      });
      // Also include user location if valid
      if (isValidCoordinate(center.lat, center.lng)) {
        bounds.extend(center);
      }
      mapInstance.fitBounds(bounds, 50);
    }
  }, [professionalsWithCoords, center]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Trigger resize when map mounts or container may have changed
  useEffect(() => {
    if (map) {
      const gMaps = getGoogleMaps();
      if (gMaps?.event) {
        // Use requestAnimationFrame to ensure DOM is ready
        const rafId = requestAnimationFrame(() => {
          gMaps.event.trigger(map, "resize");
        });
        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [map]);

  const handleMarkerClick = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  const handleInfoWindowClose = () => {
    setSelectedProfessional(null);
  };

  const handleViewProfile = (id: string) => {
    if (onProfessionalClick) {
      onProfessionalClick(id);
    } else {
      navigate(`/client/professional/${id}`);
    }
  };

  const handleRequestLocation = () => {
    window.location.reload();
  };

  // Maps load error
  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted p-6 text-center">
        <AlertCircle className="h-12 w-12 text-warning mb-4" />
        <h3 className="font-semibold text-lg mb-2">Errore caricamento mappa</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Impossibile caricare Google Maps. 
          Verifica la connessione internet e riprova.
        </p>
        <Button variant="outline" onClick={handleRequestLocation}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    );
  }

  // Loading state while Google Maps loads
  if (!isLoaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Caricamento mappa...</p>
      </div>
    );
  }

  // Safe mode: if no professionals have valid coordinates, show message
  if (professionalsWithCoords.length === 0 && professionals.length > 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted p-6 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Nessun professionista geolocalizzato</h3>
        <p className="text-muted-foreground text-sm">
          I professionisti trovati non hanno coordinate disponibili per la visualizzazione su mappa.
        </p>
      </div>
    );
  }

  // Ensure google.maps is available before rendering markers
  const gMaps = getGoogleMaps();
  if (!gMaps) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Inizializzazione mappa...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={defaultOptions}
    >
      {/* User location marker */}
      {isValidCoordinate(center.lat, center.lng) && (
        <MarkerF
          position={center}
          icon={{
            path: gMaps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 3,
          }}
          title="La tua posizione"
        />
      )}

      {/* Professional markers */}
      {professionalsWithDistance.map((professional) => {
        if (!isValidCoordinate(professional.latitude, professional.longitude)) return null;
        
        // Create icon options safely
        const iconOptions = {
          url: professional.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}&size=40&background=8B5CF6&color=fff`,
          scaledSize: new gMaps.Size(40, 40),
          anchor: new gMaps.Point(20, 20),
        };
        
        return (
          <MarkerF
            key={professional.id}
            position={{ lat: professional.latitude!, lng: professional.longitude! }}
            onClick={() => handleMarkerClick(professional)}
            icon={iconOptions}
          />
        );
      })}

      {/* Info Window */}
      {selectedProfessional && isValidCoordinate(selectedProfessional.latitude, selectedProfessional.longitude) && (
        <InfoWindowF
          position={{
            lat: selectedProfessional.latitude!,
            lng: selectedProfessional.longitude!,
          }}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedProfessional.avatarUrl} alt={selectedProfessional.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedProfessional.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{selectedProfessional.name}</h3>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span>{selectedProfessional.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({selectedProfessional.reviewCount})</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              <span>
                {(selectedProfessional as any).distance 
                  ? `${(selectedProfessional as any).distance.toFixed(1)} km da te`
                  : selectedProfessional.city || ""}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {selectedProfessional.services.slice(0, 2).map((service) => (
                <span key={service} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                  {service}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">€{selectedProfessional.hourlyRate}/ora</span>
              <Button size="sm" onClick={() => handleViewProfile(selectedProfessional.id)}>
                Vedi profilo
              </Button>
            </div>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

// Wrapper component that handles API key loading
export function ProfessionalsMap({ professionals, onProfessionalClick }: ProfessionalsMapProps) {
  const { center, loading: geoLoading } = useGeolocation();
  const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useGoogleMapsApiKey();

  const handleRequestLocation = () => {
    window.location.reload();
  };

  // API Key Error
  if (apiKeyError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted p-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-semibold text-lg mb-2">Mappa non disponibile</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Si è verificato un errore nel caricamento della mappa. 
          Riprova più tardi o contatta l'assistenza.
        </p>
        <Button variant="outline" onClick={handleRequestLocation}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    );
  }

  // Loading state - wait for API key and geolocation
  if (apiKeyLoading || geoLoading || !apiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Caricamento mappa...</p>
      </div>
    );
  }

  // Only render inner component when apiKey is ready
  return (
    <ProfessionalsMapInner
      professionals={professionals}
      onProfessionalClick={onProfessionalClick}
      apiKey={apiKey}
      center={center}
    />
  );
}
