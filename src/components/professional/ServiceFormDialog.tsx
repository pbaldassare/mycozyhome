import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

const allServiceTypes = [
  "cleaning",
  "office_cleaning",
  "ironing",
  "sanitization",
  "babysitter",
  "dog_sitter",
] as const;

interface ServiceData {
  id?: string;
  service_type: string;
  hourly_rate: number;
  description: string | null;
  min_hours: number | null;
  years_experience: number | null;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceData | null;
  existingServiceTypes?: string[];
  onSubmit: (data: {
    service_type: string;
    hourly_rate: number;
    description: string | null;
    min_hours: number;
    years_experience: number;
  }) => void;
  isPending: boolean;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  existingServiceTypes = [],
  onSubmit,
  isPending,
}: ServiceFormDialogProps) {
  const isEditing = !!service?.id;

  const [serviceType, setServiceType] = useState(service?.service_type || "");
  const [hourlyRate, setHourlyRate] = useState(service?.hourly_rate?.toString() || "");
  const [description, setDescription] = useState(service?.description || "");
  const [minHours, setMinHours] = useState(service?.min_hours?.toString() || "1");
  const [yearsExperience, setYearsExperience] = useState(
    service?.years_experience?.toString() || "0"
  );

  useEffect(() => {
    if (service) {
      setServiceType(service.service_type || "");
      setHourlyRate(service.hourly_rate?.toString() || "");
      setDescription(service.description || "");
      setMinHours(service.min_hours?.toString() || "1");
      setYearsExperience(service.years_experience?.toString() || "0");
    } else {
      setServiceType("");
      setHourlyRate("");
      setDescription("");
      setMinHours("1");
      setYearsExperience("0");
    }
  }, [service, open]);

  const availableServiceTypes = allServiceTypes.filter(
    (type) => !existingServiceTypes.includes(type) || type === service?.service_type
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !hourlyRate) return;

    onSubmit({
      service_type: serviceType,
      hourly_rate: parseFloat(hourlyRate),
      description: description.trim() || null,
      min_hours: parseInt(minHours) || 1,
      years_experience: parseInt(yearsExperience) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifica Servizio" : "Aggiungi Servizio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-type">Tipo di servizio</Label>
            <Select
              value={serviceType}
              onValueChange={setServiceType}
              disabled={isEditing}
            >
              <SelectTrigger id="service-type">
                <SelectValue placeholder="Seleziona servizio" />
              </SelectTrigger>
              <SelectContent>
                {availableServiceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {serviceTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly-rate">Tariffa oraria (€)</Label>
            <Input
              id="hourly-rate"
              type="number"
              min="1"
              step="0.50"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="es. 15"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-hours">Ore minime</Label>
              <Input
                id="min-hours"
                type="number"
                min="1"
                max="8"
                value={minHours}
                onChange={(e) => setMinHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years-exp">Anni esperienza</Label>
              <Input
                id="years-exp"
                type="number"
                min="0"
                max="50"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi il servizio che offri, eventuali specializzazioni..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isPending || !serviceType || !hourlyRate}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
