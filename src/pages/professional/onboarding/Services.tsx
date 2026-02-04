import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];

interface ServiceOption {
  id: ServiceType;
  label: string;
}

interface ServiceData {
  selected: boolean;
  hourlyRate: string;
  yearsExperience: string;
  description: string;
}

const serviceOptions: ServiceOption[] = [
  { id: "cleaning", label: "Pulizia casa" },
  { id: "office_cleaning", label: "Pulizia uffici" },
  { id: "ironing", label: "Stiratura" },
  { id: "sanitization", label: "Sanificazione" },
  { id: "babysitter", label: "Babysitter" },
  { id: "dog_sitter", label: "Dog sitter" },
];

export default function ServicesSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [expandedService, setExpandedService] = useState<ServiceType | null>(null);
  const [servicesData, setServicesData] = useState<Record<ServiceType, ServiceData>>(() => {
    const initial: Record<string, ServiceData> = {};
    serviceOptions.forEach((s) => {
      initial[s.id] = {
        selected: false,
        hourlyRate: "",
        yearsExperience: "",
        description: "",
      };
    });
    return initial as Record<ServiceType, ServiceData>;
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      const { data: prof } = await supabase
        .from("professionals")
        .select("id, bio")
        .eq("user_id", session.user.id)
        .single();

      if (!prof) {
        navigate("/professional/onboarding/personal");
        return;
      }

      setProfessionalId(prof.id);
      if (prof.bio) setBio(prof.bio);

      const { data: existingServices } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", prof.id);

      if (existingServices && existingServices.length > 0) {
        const updated = { ...servicesData };
        existingServices.forEach((s) => {
          updated[s.service_type] = {
            selected: true,
            hourlyRate: String(s.hourly_rate),
            yearsExperience: s.years_experience ? String(s.years_experience) : "",
            description: s.description || "",
          };
        });
        setServicesData(updated);
      }
    };

    loadData();
  }, [navigate]);

  const toggleService = (serviceId: ServiceType) => {
    setServicesData((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        selected: !prev[serviceId].selected,
      },
    }));
    
    // Auto-expand when selecting
    if (!servicesData[serviceId].selected) {
      setExpandedService(serviceId);
    } else if (expandedService === serviceId) {
      setExpandedService(null);
    }
  };

  const updateServiceData = (
    serviceId: ServiceType,
    field: keyof Omit<ServiceData, "selected">,
    value: string
  ) => {
    setServicesData((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    const selectedServices = Object.entries(servicesData).filter(
      ([_, data]) => data.selected
    );

    if (selectedServices.length === 0) {
      toast.error("Seleziona almeno un servizio");
      return;
    }

    // Validate each selected service has a rate
    for (const [serviceId, data] of selectedServices) {
      if (!data.hourlyRate || Number(data.hourlyRate) <= 0) {
        const serviceName = serviceOptions.find((s) => s.id === serviceId)?.label;
        toast.error(`Inserisci una tariffa per ${serviceName}`);
        return;
      }
    }

    setLoading(true);

    try {
      if (!professionalId) throw new Error("Professional ID not found");

      // Update bio
      await supabase
        .from("professionals")
        .update({ bio: bio.trim() || null })
        .eq("id", professionalId);

      // Delete existing services
      await supabase
        .from("professional_services")
        .delete()
        .eq("professional_id", professionalId);

      // Insert new services with individual data
      const servicesToInsert = selectedServices.map(([serviceType, data]) => ({
        professional_id: professionalId,
        service_type: serviceType as ServiceType,
        hourly_rate: Number(data.hourlyRate),
        years_experience: data.yearsExperience ? Number(data.yearsExperience) : 0,
        description: data.description.trim() || null,
        min_hours: 1,
        is_active: true,
      }));

      const { error } = await supabase
        .from("professional_services")
        .insert(servicesToInsert);

      if (error) throw error;

      toast.success("Dati salvati!");
      navigate("/professional/onboarding/availability");
    } catch (err) {
      toast.error("Errore nel salvataggio");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const progress = 50;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/professional/onboarding/personal")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Dati professionali</h1>
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
      <div className="flex-1 px-4 py-6 space-y-8 pb-32 overflow-y-auto">
        {/* General Bio */}
        <section>
          <label className="block text-base font-semibold mb-2">
            Descrizione generale del profilo
          </label>
          <Textarea
            placeholder="Presentati ai clienti: chi sei, la tua esperienza, perché sceglierti..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[100px] rounded-xl bg-[hsl(var(--sage-light))] border-0 text-base resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
        </section>

        {/* Services Selection */}
        <section>
          <h2 className="text-base font-semibold mb-4">Servizi offerti</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Seleziona i servizi e personalizza tariffa, esperienza e descrizione per ognuno
          </p>
          
          <div className="space-y-3">
            {serviceOptions.map((service) => {
              const data = servicesData[service.id];
              const isSelected = data.selected;
              const isExpanded = expandedService === service.id;

              return (
                <div
                  key={service.id}
                  className={cn(
                    "rounded-xl border transition-all",
                    isSelected
                      ? "border-[hsl(var(--sage))] bg-[hsl(var(--sage-light))]/30"
                      : "border-border bg-card"
                  )}
                >
                  {/* Service Header */}
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => toggleService(service.id)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected
                            ? "bg-[hsl(var(--sage))] border-[hsl(var(--sage))]"
                            : "border-muted-foreground/30 bg-background"
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-medium">{service.label}</span>
                    </button>

                    {isSelected && (
                      <button
                        onClick={() => setExpandedService(isExpanded ? null : service.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isSelected && isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Tariffa (€/ora) *
                          </label>
                          <Input
                            type="number"
                            placeholder="15"
                            value={data.hourlyRate}
                            onChange={(e) =>
                              updateServiceData(service.id, "hourlyRate", e.target.value)
                            }
                            className="h-11 rounded-xl bg-background border-border"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Anni esperienza
                          </label>
                          <Input
                            type="number"
                            placeholder="5"
                            value={data.yearsExperience}
                            onChange={(e) =>
                              updateServiceData(service.id, "yearsExperience", e.target.value)
                            }
                            className="h-11 rounded-xl bg-background border-border"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Descrizione servizio
                        </label>
                        <Textarea
                          placeholder={`Descrivi come offri il servizio di ${service.label.toLowerCase()}...`}
                          value={data.description}
                          onChange={(e) =>
                            updateServiceData(service.id, "description", e.target.value)
                          }
                          className="min-h-[80px] rounded-xl bg-background border-border resize-none text-sm"
                          maxLength={300}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.description.length}/300
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Collapsed Summary */}
                  {isSelected && !isExpanded && data.hourlyRate && (
                    <div className="px-4 pb-3 text-sm text-muted-foreground">
                      €{data.hourlyRate}/ora
                      {data.yearsExperience && ` • ${data.yearsExperience} anni exp.`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 space-y-3 border-t">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-base rounded-2xl bg-[hsl(var(--sage))] hover:bg-[hsl(var(--sage-dark))]"
          size="lg"
          disabled={loading}
        >
          {loading ? "Salvataggio..." : "Continua"}
        </Button>
        <button
          onClick={() => navigate("/professional/onboarding/personal")}
          className="w-full text-center text-[hsl(var(--sage-dark))] font-medium py-2"
        >
          Indietro
        </button>
      </div>
    </div>
  );
}
