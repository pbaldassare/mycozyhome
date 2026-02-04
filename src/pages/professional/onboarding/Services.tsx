import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Home,
  Building2,
  Shirt,
  ShieldCheck,
  Baby,
  Dog,
  Euro,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];

const servicesList = [
  { id: "cleaning", name: "Pulizia Casa", icon: Home, description: "Pulizia domestica completa" },
  { id: "office_cleaning", name: "Pulizia Uffici", icon: Building2, description: "Pulizia spazi lavorativi" },
  { id: "ironing", name: "Stiratura", icon: Shirt, description: "Servizio stiratura a domicilio" },
  { id: "sanitization", name: "Sanificazione", icon: ShieldCheck, description: "Sanificazione ambienti" },
  { id: "babysitter", name: "Babysitter", icon: Baby, description: "Assistenza bambini" },
  { id: "dog_sitter", name: "Dog Sitter", icon: Dog, description: "Custodia animali" },
];

interface ServiceConfig {
  enabled: boolean;
  hourlyRate: string;
  minHours: string;
}

export default function ServicesSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [services, setServices] = useState<Record<string, ServiceConfig>>({});

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
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!prof) {
        navigate("/professional/onboarding/personal");
        return;
      }

      setProfessionalId(prof.id);

      // Load existing services
      const { data: existingServices } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", prof.id);

      if (existingServices) {
        const servicesMap: Record<string, ServiceConfig> = {};
        existingServices.forEach((s) => {
          servicesMap[s.service_type] = {
            enabled: s.is_active,
            hourlyRate: s.hourly_rate.toString(),
            minHours: s.min_hours.toString(),
          };
        });
        setServices(servicesMap);
      }
    };

    loadData();
  }, [navigate]);

  const toggleService = (serviceId: string) => {
    setServices((prev) => ({
      ...prev,
      [serviceId]: prev[serviceId]
        ? { ...prev[serviceId], enabled: !prev[serviceId].enabled }
        : { enabled: true, hourlyRate: "15", minHours: "1" },
    }));
  };

  const updateServiceRate = (serviceId: string, field: "hourlyRate" | "minHours", value: string) => {
    setServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!professionalId) throw new Error("Professional ID not found");

      // Get enabled services
      const enabledServices = Object.entries(services)
        .filter(([_, config]) => config.enabled)
        .map(([serviceType, config]) => ({
          professional_id: professionalId,
          service_type: serviceType as ServiceType,
          hourly_rate: parseFloat(config.hourlyRate) || 15,
          min_hours: parseInt(config.minHours) || 1,
          is_active: true,
        }));

      if (enabledServices.length === 0) {
        toast.error("Seleziona almeno un servizio");
        setLoading(false);
        return;
      }

      // Delete existing and insert new
      await supabase
        .from("professional_services")
        .delete()
        .eq("professional_id", professionalId);

      const { error } = await supabase
        .from("professional_services")
        .insert(enabledServices);

      if (error) throw error;

      toast.success("Servizi salvati!");
      navigate("/professional/onboarding/availability");
    } catch (err) {
      toast.error("Errore nel salvataggio dei servizi");
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
            onClick={() => navigate("/professional/onboarding/personal")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">Servizi e Prezzi</h1>
            <p className="text-sm text-white/70">Step 2 di 4</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary w-2/4" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-auto pb-24">
        <p className="text-muted-foreground">
          Seleziona i servizi che offri e imposta le tue tariffe orarie
        </p>

        {servicesList.map((service) => {
          const Icon = service.icon;
          const config = services[service.id];
          const isEnabled = config?.enabled ?? false;

          return (
            <div
              key={service.id}
              className={cn(
                "bg-card rounded-xl border p-4 transition-all",
                isEnabled ? "border-primary shadow-sm" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <Switch checked={isEnabled} onCheckedChange={() => toggleService(service.id)} />
              </div>

              {isEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tariffa Oraria</Label>
                    <div className="relative">
                      <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        value={config?.hourlyRate || "15"}
                        onChange={(e) => updateServiceRate(service.id, "hourlyRate", e.target.value)}
                        className="pl-8 h-9"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Min. Ore</Label>
                    <Input
                      type="number"
                      min="1"
                      max="8"
                      value={config?.minHours || "1"}
                      onChange={(e) => updateServiceRate(service.id, "minHours", e.target.value)}
                      className="h-9"
                      placeholder="1"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
