import { useCallback, useState, useMemo } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Loader2 } from "lucide-react";
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

const defaultOptions: google.maps.MapOptions = {
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
};

export function ProfessionalsMap({ professionals, onProfessionalClick }: ProfessionalsMapProps) {
  const navigate = useNavigate();
  const { center, loading: geoLoading } = useGeolocation();
  const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useGoogleMapsApiKey();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  });

  // Filter professionals with valid coordinates
  const professionalsWithCoords = useMemo(() => {
    return professionals.filter(
      (p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)
    );
  }, [professionals]);

  // Calculate distances
  const professionalsWithDistance = useMemo(() => {
    if (!center.lat || !center.lng) return professionalsWithCoords;
    
    return professionalsWithCoords.map((p) => ({
      ...p,
      distance: p.latitude && p.longitude
        ? calculateDistance(center.lat, center.lng, p.latitude, p.longitude)
        : null,
    }));
  }, [professionalsWithCoords, center]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Fit bounds to show all markers
    if (professionalsWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      professionalsWithCoords.forEach((p) => {
        if (p.latitude && p.longitude) {
          bounds.extend({ lat: p.latitude, lng: p.longitude });
        }
      });
      // Also include user location
      bounds.extend(center);
      map.fitBounds(bounds, 50);
    }
  }, [professionalsWithCoords, center]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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

  if (loadError || apiKeyError) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Errore nel caricamento della mappa</p>
      </div>
    );
  }

  if (!isLoaded || geoLoading || apiKeyLoading || !apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <MarkerF
        position={center}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        }}
        title="La tua posizione"
      />

      {/* Professional markers */}
      {professionalsWithDistance.map((professional) => (
        <MarkerF
          key={professional.id}
          position={{ lat: professional.latitude!, lng: professional.longitude! }}
          onClick={() => handleMarkerClick(professional)}
          icon={{
            url: professional.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}&size=40&background=8B5CF6&color=fff`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          }}
        />
      ))}

      {/* Info Window */}
      {selectedProfessional && selectedProfessional.latitude && selectedProfessional.longitude && (
        <InfoWindowF
          position={{
            lat: selectedProfessional.latitude,
            lng: selectedProfessional.longitude,
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
