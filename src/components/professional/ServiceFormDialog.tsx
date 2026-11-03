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


import { SERVICE_CATALOG, SERVICE_LABELS as serviceTypeLabels } from "@/lib/services";
const allServiceTypes = SERVICE_CATALOG.map((s) => s.id);

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

export interface PackageDraft {
  id?: string;
  service_type: string;
  name: string;
  description: string | null;
  hours: number;
  price: number;
}

/** Pacchetto a prezzo fisso: "Pulizia bilocale · 3h · €45". */
export function PackageFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PackageDraft | null;
  onSubmit: (data: PackageDraft) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("2");
  const [price, setPrice] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setHours(initial?.hours?.toString() ?? "2");
    setPrice(initial?.price ? initial.price.toString() : "");
  }, [initial, open]);

  if (!initial) return null;
  const hoursNum = Number(hours);
  const priceNum = Number(price);
  const valid =
    name.trim().length >= 3 && hoursNum >= 1 && hoursNum <= 12 && (hoursNum * 2) % 1 === 0 &&
    priceNum >= 5 && priceNum <= 2000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial.id ? "Modifica pacchetto" : "Nuovo pacchetto"} · {serviceTypeLabels[initial.service_type]}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) {
              onSubmit({
                ...initial,
                name: name.trim(),
                description: description.trim() || null,
                hours: hoursNum,
                price: priceNum,
              });
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="pkg-name">Nome</Label>
            <Input id="pkg-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)}
              placeholder="es. Pulizia bilocale" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pkg-hours">Durata (ore)</Label>
              <Input id="pkg-hours" type="number" min="1" max="12" step="0.5" value={hours}
                onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price">Prezzo totale (€)</Label>
              <Input id="pkg-price" type="number" min="5" max="2000" step="1" value={price}
                onChange={(e) => setPrice(e.target.value)} placeholder="es. 45" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-desc">Cosa include (opzionale)</Label>
            <Textarea id="pkg-desc" value={description} maxLength={300} rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="es. Cucina, bagno, camera e soggiorno, vetri esclusi" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annulla
            </Button>
            <Button type="submit" disabled={isPending || !valid}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
