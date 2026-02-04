import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const daysOfWeek = [
  { id: 1, name: "Lunedì" },
  { id: 2, name: "Martedì" },
  { id: 3, name: "Mercoledì" },
  { id: 4, name: "Giovedì" },
  { id: 5, name: "Venerdì" },
  { id: 6, name: "Sabato" },
  { id: 0, name: "Domenica" },
];

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

export default function AvailabilitySetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<number, DayAvailability>>({});
  const [areas, setAreas] = useState<CoverageArea[]>([{ city: "", maxDistance: "10" }]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      const { data: prof } = await supabase
        .from("professionals")
        .select("id, city")
        .eq("user_id", session.user.id)
        .single();

      if (!prof) {
        navigate("/professional/onboarding/personal");
        return;
      }

      setProfessionalId(prof.id);

      if (prof.city) {
        setAreas([{ city: prof.city, maxDistance: "10" }]);
      }

      const { data: existingAvail } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", prof.id);

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
        .eq("professional_id", prof.id);

      if (existingAreas && existingAreas.length > 0) {
        setAreas(
          existingAreas.map((a) => ({
            city: a.city,
            maxDistance: String(a.max_distance_km ?? 10),
          }))
        );
      }
    };

    loadData();
  }, [navigate]);

  const toggleDay = (dayId: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: prev[dayId]
        ? { ...prev[dayId], isAvailable: !prev[dayId].isAvailable }
        : { isAvailable: true, startTime: "09:00", endTime: "18:00" },
    }));
  };

  const updateDayTime = (dayId: number, field: "startTime" | "endTime", value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }));
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
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!professionalId) throw new Error("Professional ID not found");

      const validAreas = areas.filter((a) => a.city.trim());
      if (validAreas.length === 0) {
        toast.error("Inserisci almeno un'area di copertura");
        setLoading(false);
        return;
      }

      const availabilityData = Object.entries(availability)
        .filter(([_, config]) => config.isAvailable)
        .map(([dayId, config]) => ({
          professional_id: professionalId,
          day_of_week: parseInt(dayId),
          start_time: config.startTime,
          end_time: config.endTime,
          is_available: true,
        }));

      await supabase
        .from("professional_availability")
        .delete()
        .eq("professional_id", professionalId);

      if (availabilityData.length > 0) {
        const { error: availError } = await supabase
          .from("professional_availability")
          .insert(availabilityData);

        if (availError) throw availError;
      }

      const areasData = validAreas.map((area) => ({
        professional_id: professionalId,
        city: area.formatted_address || area.city.trim(),
        max_distance_km: parseInt(area.maxDistance) || 10,
        latitude: area.latitude || null,
        longitude: area.longitude || null,
        formatted_address: area.formatted_address || null,
      }));

      await supabase
        .from("professional_areas")
        .delete()
        .eq("professional_id", professionalId);

      const { error: areasError } = await supabase
        .from("professional_areas")
        .insert(areasData);

      if (areasError) throw areasError;

      toast.success("Disponibilità salvata!");
      navigate("/professional/onboarding/documents");
    } catch (err) {
      toast.error("Errore nel salvataggio");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const progress = 75;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/professional/onboarding/services")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Disponibilità</h1>
          <div className="w-9" />
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-[hsl(var(--sage-light))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--sage))] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-8 pb-32">
        {/* Days Selection */}
        <section>
          <h2 className="text-base font-semibold mb-4">Giorni lavorativi</h2>
          <div className="space-y-3">
            {daysOfWeek.map((day) => {
              const config = availability[day.id];
              const isAvailable = config?.isAvailable ?? false;

              return (
                <div key={day.id} className="space-y-2">
                  <button
                    onClick={() => toggleDay(day.id)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isAvailable
                          ? "bg-[hsl(var(--sage))] border-[hsl(var(--sage))]"
                          : "border-muted-foreground/30 bg-background"
                      )}
                    >
                      {isAvailable && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-foreground">{day.name}</span>
                  </button>

                  {isAvailable && (
                    <div className="flex items-center gap-2 ml-9">
                      <Input
                        type="time"
                        value={config?.startTime || "09:00"}
                        onChange={(e) => updateDayTime(day.id, "startTime", e.target.value)}
                        className="h-10 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-sm w-28"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={config?.endTime || "18:00"}
                        onChange={(e) => updateDayTime(day.id, "endTime", e.target.value)}
                        className="h-10 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-sm w-28"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Coverage Area */}
        <section>
          <h2 className="text-base font-semibold mb-4">Zona di copertura</h2>
          <div className="space-y-3">
            <AddressAutocomplete
              value={areas[0]?.city || ""}
              onSelect={(result) => updateAreaWithGeo(0, result)}
              placeholder="Cerca indirizzo..."
              className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0"
            />
            {areas[0]?.latitude && (
              <p className="text-xs text-[hsl(var(--sage-dark))] flex items-center gap-1">
                <Check className="w-3 h-3" /> Posizione salvata
              </p>
            )}
          </div>
        </section>

        {/* Radius */}
        <section>
          <label className="block text-base font-semibold mb-2">
            Raggio operativo (km)
          </label>
          <Input
            type="number"
            min="1"
            max="50"
            value={areas[0]?.maxDistance || "10"}
            onChange={(e) =>
              setAreas((prev) =>
                prev.map((a, i) => (i === 0 ? { ...a, maxDistance: e.target.value } : a))
              )
            }
            className="h-12 rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base w-32"
          />
        </section>
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 space-y-3">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-base rounded-2xl bg-[hsl(var(--sage))] hover:bg-[hsl(var(--sage-dark))]"
          size="lg"
          disabled={loading}
        >
          {loading ? "Salvataggio..." : "Continua"}
        </Button>
        <button
          onClick={() => navigate("/professional/onboarding/services")}
          className="w-full text-center text-[hsl(var(--sage-dark))] font-medium py-2"
        >
          Indietro
        </button>
      </div>
    </div>
  );
}
