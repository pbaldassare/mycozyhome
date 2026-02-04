import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ServiceType = Database["public"]["Enums"]["service_type"];

interface ServiceOption {
  id: ServiceType;
  label: string;
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
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");

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
        .select("id, years_experience, bio")
        .eq("user_id", session.user.id)
        .single();

      if (!prof) {
        navigate("/professional/onboarding/personal");
        return;
      }

      setProfessionalId(prof.id);
      if (prof.years_experience) setYearsExperience(String(prof.years_experience));
      if (prof.bio) setBio(prof.bio);

      // Load existing services
      const { data: existingServices } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", prof.id);

      if (existingServices && existingServices.length > 0) {
        setSelectedServices(existingServices.map((s) => s.service_type));
        // Use first service hourly rate as default
        setHourlyRate(String(existingServices[0].hourly_rate));
      }
    };

    loadData();
  }, [navigate]);

  const toggleService = (serviceId: ServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error("Seleziona almeno un servizio");
      return;
    }

    if (!hourlyRate || Number(hourlyRate) <= 0) {
      toast.error("Inserisci una tariffa oraria valida");
      return;
    }

    setLoading(true);

    try {
      if (!professionalId) throw new Error("Professional ID not found");

      // Update professional profile with experience and bio
      await supabase
        .from("professionals")
        .update({
          years_experience: yearsExperience ? Number(yearsExperience) : 0,
          bio: bio.trim() || null,
        })
        .eq("id", professionalId);

      // Delete existing and insert new services
      await supabase
        .from("professional_services")
        .delete()
        .eq("professional_id", professionalId);

      const servicesToInsert = selectedServices.map((serviceType) => ({
        professional_id: professionalId,
        service_type: serviceType,
        hourly_rate: Number(hourlyRate),
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

  // Calculate progress (step 2 of 4)
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
        <div className="mt-4 h-2 bg-primary/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-8 pb-32">
        {/* Services Selection */}
        <section>
          <h2 className="text-base font-semibold mb-4">Tipologia di servizi offerti</h2>
          <div className="space-y-3">
            {serviceOptions.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-success border-success"
                        : "border-muted-foreground/30 bg-background"
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-foreground">{service.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Years of Experience */}
        <section>
          <label className="block text-base font-semibold mb-2">
            Anni di esperienza
          </label>
          <Input
            type="number"
            placeholder="Es. 5"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className="h-12 rounded-xl bg-primary/5 border-0 text-base"
          />
        </section>

        {/* Hourly Rate */}
        <section>
          <label className="block text-base font-semibold mb-2">
            Tariffa oraria (€)
          </label>
          <Input
            type="number"
            placeholder="Es. 15"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="h-12 rounded-xl bg-primary/5 border-0 text-base"
          />
        </section>

        {/* Bio */}
        <section>
          <label className="block text-base font-semibold mb-2">
            Descrizione breve
          </label>
          <Textarea
            placeholder="Presentati ai clienti"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[120px] rounded-xl bg-primary/5 border-0 text-base resize-none"
            maxLength={500}
          />
        </section>
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4 space-y-3">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-base rounded-2xl"
          size="lg"
          disabled={loading}
        >
          {loading ? "Salvataggio..." : "Continua"}
        </Button>
        <button
          onClick={() => navigate("/professional/onboarding/personal")}
          className="w-full text-center text-primary font-medium py-2"
        >
          Indietro
        </button>
      </div>
    </div>
  );
}
