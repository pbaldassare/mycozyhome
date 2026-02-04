import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

const serviceCategories = [
  {
    id: "pulizia",
    name: "Pulizia",
    services: [
      { id: "cleaning", name: "Pulizia Profonda", description: "Pulizia approfondita della casa" },
      { id: "office_cleaning", name: "Pulizia Regolare", description: "Pulizia periodica di mantenimento" },
      { id: "sanitization", name: "Sanificazione", description: "Pulizia con sanificazione ambienti" },
    ],
  },
  {
    id: "lavanderia",
    name: "Lavanderia",
    services: [
      { id: "ironing", name: "Stiratura", description: "Stiratura e piegatura indumenti" },
    ],
  },
  {
    id: "assistenza",
    name: "Assistenza",
    services: [
      { id: "babysitter", name: "Babysitter", description: "Assistenza bambini a domicilio" },
      { id: "dog_sitter", name: "Dog Sitter", description: "Custodia e passeggiate animali" },
    ],
  },
];

interface SelectedService {
  id: string;
  hourlyRate: number;
  minHours: number;
}

export default function ServicesSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

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
        setSelectedServices(
          existingServices.map((s) => ({
            id: s.service_type,
            hourlyRate: Number(s.hourly_rate),
            minHours: s.min_hours || 1,
          }))
        );
      }
    };

    loadData();
  }, [navigate]);

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some((s) => s.id === serviceId);
  };

  const toggleService = (serviceId: string) => {
    if (isServiceSelected(serviceId)) {
      setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId));
    } else {
      setSelectedServices((prev) => [
        ...prev,
        { id: serviceId, hourlyRate: 15, minHours: 1 },
      ]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!professionalId) throw new Error("Professional ID not found");

      if (selectedServices.length === 0) {
        toast.error("Seleziona almeno un servizio");
        setLoading(false);
        return;
      }

      const servicesToInsert = selectedServices.map((s) => ({
        professional_id: professionalId,
        service_type: s.id as ServiceType,
        hourly_rate: s.hourlyRate,
        min_hours: s.minHours,
        is_active: true,
      }));

      // Delete existing and insert new
      await supabase
        .from("professional_services")
        .delete()
        .eq("professional_id", professionalId);

      const { error } = await supabase
        .from("professional_services")
        .insert(servicesToInsert);

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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/professional/onboarding/personal")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Servizi</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24">
        {serviceCategories.map((category) => (
          <div key={category.id} className="mb-2">
            {/* Category Header */}
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
              <button className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            {/* Services List */}
            <div className="bg-background mx-4 rounded-2xl overflow-hidden border border-border/30">
              {category.services.map((service, index) => {
                const isSelected = isServiceSelected(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 text-left transition-colors",
                      index < category.services.length - 1 && "border-b border-border/30",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {service.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {service.description}
                      </p>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 ml-3 flex-shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t border-border/30">
        <Button 
          onClick={handleSubmit} 
          className="w-full h-14 text-base rounded-2xl gap-2" 
          size="lg" 
          disabled={loading}
        >
          <PlusCircle className="w-5 h-5" />
          {loading ? "Salvataggio..." : "Aggiungi Nuovo Servizio"}
        </Button>
      </div>
    </div>
  );
}
