import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Clock, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const daysOfWeek = [
  { id: 0, name: "Domenica", short: "Dom" },
  { id: 1, name: "Lunedì", short: "Lun" },
  { id: 2, name: "Martedì", short: "Mar" },
  { id: 3, name: "Mercoledì", short: "Mer" },
  { id: 4, name: "Giovedì", short: "Gio" },
  { id: 5, name: "Venerdì", short: "Ven" },
  { id: 6, name: "Sabato", short: "Sab" },
];

interface DayAvailability {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface CoverageArea {
  city: string;
  maxDistance: string;
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

      // Get professional profile
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

      // Set default city from profile
      if (prof.city) {
        setAreas([{ city: prof.city, maxDistance: "10" }]);
      }

      // Load existing availability
      const { data: existingAvail } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", prof.id);

      if (existingAvail && existingAvail.length > 0) {
        const availMap: Record<number, DayAvailability> = {};
        existingAvail.forEach((a) => {
          availMap[a.day_of_week] = {
            isAvailable: a.is_available,
            startTime: a.start_time.slice(0, 5),
            endTime: a.end_time.slice(0, 5),
          };
        });
        setAvailability(availMap);
      } else {
        // Set default availability (Mon-Fri, 9-18)
        const defaultAvail: Record<number, DayAvailability> = {};
        [1, 2, 3, 4, 5].forEach((day) => {
          defaultAvail[day] = { isAvailable: true, startTime: "09:00", endTime: "18:00" };
        });
        setAvailability(defaultAvail);
      }

      // Load existing areas
      const { data: existingAreas } = await supabase
        .from("professional_areas")
        .select("*")
        .eq("professional_id", prof.id);

      if (existingAreas && existingAreas.length > 0) {
        setAreas(
          existingAreas.map((a) => ({
            city: a.city,
            maxDistance: a.max_distance_km.toString(),
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

  const addArea = () => {
    setAreas((prev) => [...prev, { city: "", maxDistance: "10" }]);
  };

  const removeArea = (index: number) => {
    setAreas((prev) => prev.filter((_, i) => i !== index));
  };

  const updateArea = (index: number, field: "city" | "maxDistance", value: string) => {
    setAreas((prev) =>
      prev.map((area, i) => (i === index ? { ...area, [field]: value } : area))
    );
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!professionalId) throw new Error("Professional ID not found");

      // Validate at least one area
      const validAreas = areas.filter((a) => a.city.trim());
      if (validAreas.length === 0) {
        toast.error("Inserisci almeno un'area di copertura");
        setLoading(false);
        return;
      }

      // Save availability
      const availabilityData = Object.entries(availability)
        .filter(([_, config]) => config.isAvailable)
        .map(([dayId, config]) => ({
          professional_id: professionalId,
          day_of_week: parseInt(dayId),
          start_time: config.startTime,
          end_time: config.endTime,
          is_available: true,
        }));

      // Delete existing and insert new availability
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

      // Save areas
      const areasData = validAreas.map((area) => ({
        professional_id: professionalId,
        city: area.city.trim(),
        max_distance_km: parseInt(area.maxDistance) || 10,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/professional/onboarding/services")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">Disponibilità</h1>
            <p className="text-sm text-white/70">Step 3 di 4</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary w-3/4" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-auto pb-24">
        {/* Availability Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Orari di Lavoro</span>
          </div>

          <div className="space-y-2">
            {daysOfWeek.map((day) => {
              const config = availability[day.id];
              const isAvailable = config?.isAvailable ?? false;

              return (
                <div
                  key={day.id}
                  className={cn(
                    "bg-card rounded-xl border p-3 transition-all",
                    isAvailable ? "border-primary/30" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <span className={cn("font-medium", !isAvailable && "text-muted-foreground")}>
                        {day.name}
                      </span>
                    </div>

                    {isAvailable && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={config?.startTime || "09:00"}
                          onChange={(e) => updateDayTime(day.id, "startTime", e.target.value)}
                          className="w-24 h-8 text-sm"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={config?.endTime || "18:00"}
                          onChange={(e) => updateDayTime(day.id, "endTime", e.target.value)}
                          className="w-24 h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coverage Areas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Zone di Copertura</span>
            </div>
            <Button variant="outline" size="sm" onClick={addArea}>
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          </div>

          <div className="space-y-3">
            {areas.map((area, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Città</Label>
                    <Input
                      value={area.city}
                      onChange={(e) => updateArea(index, "city", e.target.value)}
                      placeholder="Milano"
                      className="h-9"
                    />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label className="text-xs">Raggio (km)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={area.maxDistance}
                      onChange={(e) => updateArea(index, "maxDistance", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  {areas.length > 1 && (
                    <button
                      onClick={() => removeArea(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg mt-5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t border-border">
        <Button onClick={handleSubmit} className="w-full" size="lg" disabled={loading}>
          {loading ? "Salvataggio..." : "Continua"}
        </Button>
      </div>
    </div>
  );
}
