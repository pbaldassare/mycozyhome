import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useQueryClient } from "@tanstack/react-query";

const daysOfWeek = [
  { id: 1, name: "Lunedì", short: "LUN" },
  { id: 2, name: "Martedì", short: "MAR" },
  { id: 3, name: "Mercoledì", short: "MER" },
  { id: 4, name: "Giovedì", short: "GIO" },
  { id: 5, name: "Venerdì", short: "VEN" },
  { id: 6, name: "Sabato", short: "SAB" },
  { id: 0, name: "Domenica", short: "DOM" },
];

const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

interface DayAvailability {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface CoverageArea {
  city: string;
  maxDistance: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
}

export default function ProfessionalAvailability() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfessionalProfile();
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [availability, setAvailability] = useState<Record<number, DayAvailability>>({});
  const [areas, setAreas] = useState<CoverageArea[]>([{ city: "", maxDistance: "10" }]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;

      setDataLoading(true);
      try {
        const { data: existingAvail } = await supabase
          .from("professional_availability")
          .select("*")
          .eq("professional_id", profile.id);

        if (existingAvail && existingAvail.length > 0) {
          const availMap: Record<number, DayAvailability> = {};
          existingAvail.forEach((a) => {
            availMap[a.day_of_week] = {
              isAvailable: a.is_available ?? true,
              startTime: a.start_time.slice(0, 5),
              endTime: a.end_time.slice(0, 5),
            };
          });
          setAvailability(availMap);
        } else {
          const defaultAvail: Record<number, DayAvailability> = {};
          [1, 2, 3, 4, 5].forEach((day) => {
            defaultAvail[day] = { isAvailable: true, startTime: "09:00", endTime: "18:00" };
          });
          setAvailability(defaultAvail);
        }

        const { data: existingAreas } = await supabase
          .from("professional_areas")
          .select("*")
          .eq("professional_id", profile.id);

        if (existingAreas && existingAreas.length > 0) {
          setAreas(
            existingAreas.map((a) => ({
              city: a.formatted_address || a.city,
              maxDistance: String(a.max_distance_km ?? 10),
              latitude: a.latitude ?? undefined,
              longitude: a.longitude ?? undefined,
              formatted_address: a.formatted_address ?? undefined,
            }))
          );
        } else if (profile.city) {
          setAreas([{ city: profile.city, maxDistance: "10" }]);
        }
      } catch (error) {
        console.error("Error loading availability:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [profile?.id, profile?.city]);

  const toggleDay = (dayId: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: prev[dayId]
        ? { ...prev[dayId], isAvailable: !prev[dayId].isAvailable }
        : { isAvailable: true, startTime: "09:00", endTime: "18:00" },
    }));
    setHasChanges(true);
  };

  const updateDayTime = (dayId: number, field: "startTime" | "endTime", value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateAreaWithGeo = (
    index: number,
    data: { latitude: number; longitude: number; formatted_address: string }
  ) => {
    setAreas((prev) =>
      prev.map((area, i) =>
        i === index
          ? {
              ...area,
              city: data.formatted_address,
              latitude: data.latitude,
              longitude: data.longitude,
              formatted_address: data.formatted_address,
            }
          : area
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const validAreas = areas.filter((a) => a.city.trim());
      if (validAreas.length === 0) {
        toast.error("Inserisci almeno un'area di copertura");
        setLoading(false);
        return;
      }

      const availabilityData = Object.entries(availability)
        .filter(([_, config]) => config.isAvailable)
        .map(([dayId, config]) => ({
          professional_id: profile.id,
          day_of_week: parseInt(dayId),
          start_time: config.startTime,
          end_time: config.endTime,
          is_available: true,
        }));

      await supabase
        .from("professional_availability")
        .delete()
        .eq("professional_id", profile.id);

      if (availabilityData.length > 0) {
        const { error: availError } = await supabase
          .from("professional_availability")
          .insert(availabilityData);

        if (availError) throw availError;
      }

      const areasData = validAreas.map((area) => ({
        professional_id: profile.id,
        city: area.formatted_address || area.city.trim(),
        max_distance_km: parseInt(area.maxDistance) || 10,
        latitude: area.latitude || null,
        longitude: area.longitude || null,
        formatted_address: area.formatted_address || null,
      }));

      await supabase
        .from("professional_areas")
        .delete()
        .eq("professional_id", profile.id);

      const { error: areasError } = await supabase
        .from("professional_areas")
        .insert(areasData);

      if (areasError) throw areasError;

      toast.success("Disponibilità aggiornata!");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    } catch (err) {
      toast.error("Errore nel salvataggio");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlotStatus = (dayId: number, hour: string) => {
    const config = availability[dayId];
    if (!config?.isAvailable) return "unavailable";
    
    const hourNum = parseInt(hour.split(":")[0]);
    const startHour = parseInt(config.startTime.split(":")[0]);
    const endHour = parseInt(config.endTime.split(":")[0]);
    
    if (hourNum >= startHour && hourNum < endHour) {
      return "available";
    }
    return "unavailable";
  };

  if (profileLoading || dataLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Disponibilità</h1>
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      <h1 className="text-xl font-bold">Disponibilità</h1>
      
      {/* Visual Weekly Calendar */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 bg-primary/5 border-b">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Calendario Settimanale</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Visualizza e modifica la tua disponibilità
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header with days */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 text-xs font-medium text-muted-foreground text-center">
                  Ora
                </div>
                {daysOfWeek.map((day) => (
                  <div
                    key={day.id}
                    className={cn(
                      "p-2 text-xs font-medium text-center border-l",
                      availability[day.id]?.isAvailable
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {day.short}
                  </div>
                ))}
              </div>

              {/* Time slots grid */}
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                  <div className="p-2 text-xs text-muted-foreground text-center bg-muted/30">
                    {time}
                  </div>
                  {daysOfWeek.map((day) => {
                    const status = getTimeSlotStatus(day.id, time);
                    return (
                      <div
                        key={`${day.id}-${time}`}
                        className={cn(
                          "p-2 border-l min-h-[32px] transition-colors",
                          status === "available"
                            ? "bg-primary/20"
                            : "bg-background"
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 bg-muted/30 border-t flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/20" />
              <span>Disponibile</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-background border" />
              <span>Non disponibile</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day-by-day settings */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Orari per giorno
          </h3>
          
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const config = availability[day.id];
              const isAvailable = config?.isAvailable ?? false;

              return (
                <div
                  key={day.id}
                  className={cn(
                    "p-3 rounded-xl border transition-colors",
                    isAvailable ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <span className={cn(
                        "font-medium",
                        !isAvailable && "text-muted-foreground"
                      )}>
                        {day.name}
                      </span>
                    </div>
                    
                    {isAvailable && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={config?.startTime || "09:00"}
                          onChange={(e) => updateDayTime(day.id, "startTime", e.target.value)}
                          className="h-9 w-24 text-sm"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={config?.endTime || "18:00"}
                          onChange={(e) => updateDayTime(day.id, "endTime", e.target.value)}
                          className="h-9 w-24 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coverage Area */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Zona di copertura
          </h3>
          
          <div className="space-y-3">
            <AddressAutocomplete
              value={areas[0]?.city || ""}
              onSelect={(result) => updateAreaWithGeo(0, result)}
              placeholder="Cerca indirizzo o città..."
              className="h-12"
            />
            
            {areas[0]?.latitude && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Check className="w-3 h-3" /> Posizione salvata
              </p>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">
                Raggio operativo:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={areas[0]?.maxDistance || "10"}
                  onChange={(e) => {
                    setAreas((prev) =>
                      prev.map((a, i) => (i === 0 ? { ...a, maxDistance: e.target.value } : a))
                    );
                    setHasChanges(true);
                  }}
                  className="h-10 w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">km</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
        <Button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          className="w-full h-12 gap-2"
          size="lg"
        >
          <Save className="w-5 h-5" />
          {loading ? "Salvataggio..." : "Salva modifiche"}
        </Button>
      </div>
    </div>
  );
}
