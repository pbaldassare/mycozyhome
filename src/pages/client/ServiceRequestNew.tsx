import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCreateServiceRequest } from "@/hooks/useServiceRequests";
import { toast } from "@/hooks/use-toast";

const serviceOptions = [
  { value: "cleaning", label: "Pulizie" },
  { value: "office_cleaning", label: "Pulizie ufficio" },
  { value: "ironing", label: "Stiro e lavanderia" },
  { value: "sanitization", label: "Sanificazione" },
  { value: "dog_sitter", label: "Dog sitter" },
  { value: "dog_walking", label: "Passeggiate cani" },
  { value: "pet_care_travel", label: "Pet care viaggio" },
  { value: "pet_space_cleaning", label: "Pulizia spazi animali" },
  { value: "wardrobe_seasonal", label: "Cambio stagione armadio" },
  { value: "decluttering", label: "Riordino / Decluttering" },
  { value: "post_renovation", label: "Pulizia post ristrutturazione" },
  { value: "seasonal_cleaning", label: "Pulizie stagionali" },
  { value: "garden_care", label: "Cura del giardino" },
  { value: "home_organizing", label: "Organizzazione casa" },
];

export default function ServiceRequestNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createRequest = useCreateServiceRequest();

  const [form, setForm] = useState({
    service_type: "",
    title: "",
    description: "",
    preferred_date: "",
    preferred_time_start: "",
    preferred_time_end: "",
    flexible_dates: false,
    address: "",
    city: "",
    province: "",
    budget_min: "",
    budget_max: "",
    estimated_hours: "",
  });

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!form.service_type || !form.title || !form.description || !form.address || !form.city) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }

    try {
      await createRequest.mutateAsync({
        client_id: user.id,
        service_type: form.service_type,
        title: form.title,
        description: form.description,
        preferred_date: form.preferred_date || null,
        preferred_time_start: form.preferred_time_start || null,
        preferred_time_end: form.preferred_time_end || null,
        flexible_dates: form.flexible_dates,
        address: form.address,
        city: form.city,
        province: form.province || null,
        latitude: null,
        longitude: null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      });
      toast({ title: "Inserzione pubblicata!", description: "I professionisti potranno inviarti offerte." });
      navigate("/client/service-requests");
    } catch {
      toast({ title: "Errore nella pubblicazione", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Nuova inserzione</h1>
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Tipo di servizio *</label>
          <Select value={form.service_type} onValueChange={(v) => update("service_type", v)}>
            <SelectTrigger><SelectValue placeholder="Seleziona servizio" /></SelectTrigger>
            <SelectContent>
              {serviceOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Titolo *</label>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Es: Cercasi aiuto per pulizie settimanali"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Descrizione *</label>
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Descrivi nel dettaglio cosa cerchi..."
            className="min-h-[120px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Indirizzo *</label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Via, numero" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Città *</label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Es: Milano" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Provincia</label>
          <Input value={form.province} onChange={(e) => update("province", e.target.value)} placeholder="Es: MI" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Data preferita</label>
          <Input type="date" value={form.preferred_date} onChange={(e) => update("preferred_date", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ora inizio</label>
            <Input type="time" value={form.preferred_time_start} onChange={(e) => update("preferred_time_start", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ora fine</label>
            <Input type="time" value={form.preferred_time_end} onChange={(e) => update("preferred_time_end", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Date flessibili</label>
          <Switch checked={form.flexible_dates} onCheckedChange={(v) => update("flexible_dates", v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Budget min (€)</label>
            <Input type="number" value={form.budget_min} onChange={(e) => update("budget_min", e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Budget max (€)</label>
            <Input type="number" value={form.budget_max} onChange={(e) => update("budget_max", e.target.value)} placeholder="100" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Ore stimate</label>
          <Input type="number" value={form.estimated_hours} onChange={(e) => update("estimated_hours", e.target.value)} placeholder="Es: 3" />
        </div>

        <Button onClick={handleSubmit} disabled={createRequest.isPending} className="w-full" size="lg">
          {createRequest.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Pubblica inserzione
        </Button>
      </div>
    </div>
  );
}
