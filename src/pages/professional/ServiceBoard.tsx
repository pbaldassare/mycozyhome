import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock,
  Euro,
  Send,
  Loader2,
  Star,
  Filter,
  Briefcase,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useOpenServiceRequests, useSendOffer, ServiceRequest } from "@/hooks/useServiceRequests";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const serviceLabels: Record<string, string> = {
  cleaning: "Pulizie",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
  dog_walking: "Passeggiate cani",
  pet_care_travel: "Pet care viaggio",
  pet_space_cleaning: "Pulizia spazi animali",
  wardrobe_seasonal: "Cambio stagione",
  decluttering: "Riordino",
  post_renovation: "Post ristrutturazione",
  seasonal_cleaning: "Pulizie stagionali",
  garden_care: "Cura giardino",
  home_organizing: "Organizzazione casa",
};

const serviceOptions = Object.entries(serviceLabels).map(([value, label]) => ({ value, label }));

export default function ServiceBoard() {
  const navigate = useNavigate();
  const { data: professional } = useProfessionalProfile();
  const [cityFilter, setCityFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const { data: requests, isLoading } = useOpenServiceRequests({
    city: cityFilter || undefined,
    service_type: serviceFilter || undefined,
  });

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [offerForm, setOfferForm] = useState({
    useStandardRate: true,
    hourly_rate: "",
    total_price: "",
    estimated_hours: "",
    message: "",
  });

  const sendOffer = useSendOffer();

  const handleSendOffer = async () => {
    if (!selectedRequest || !professional?.id) return;

    try {
      await sendOffer.mutateAsync({
        request_id: selectedRequest.id,
        professional_id: professional.id,
        price_type: offerForm.useStandardRate ? "standard" : "custom",
        hourly_rate: offerForm.hourly_rate ? Number(offerForm.hourly_rate) : undefined,
        total_price: offerForm.total_price ? Number(offerForm.total_price) : undefined,
        estimated_hours: offerForm.estimated_hours ? Number(offerForm.estimated_hours) : undefined,
        message: offerForm.message || undefined,
      });
      toast({ title: "Offerta inviata!", description: "Il cliente la valuterà." });
      setSelectedRequest(null);
      setOfferForm({ useStandardRate: true, hourly_rate: "", total_price: "", estimated_hours: "", message: "" });
    } catch (err: any) {
      if (err?.code === "23505") {
        toast({ title: "Hai già inviato un'offerta per questa inserzione", variant: "destructive" });
      } else {
        toast({ title: "Errore nell'invio", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Bacheca richieste</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filtra per città..."
              className="pl-9"
            />
          </div>
          <Select value={serviceFilter || "all"} onValueChange={(v) => setServiceFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Servizio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              {serviceOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Caricamento...</p>
        ) : !requests?.length ? (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">Nessuna richiesta disponibile</p>
            <p className="text-sm text-muted-foreground mt-1">
              {cityFilter || serviceFilter ? "Prova a modificare i filtri" : "Torna più tardi per nuove inserzioni"}
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge variant="outline">{serviceLabels[req.service_type] || req.service_type}</Badge>
                {req.flexible_dates && <Badge variant="secondary" className="text-xs">Date flessibili</Badge>}
              </div>
              <h3 className="font-semibold">{req.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>

              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {req.city}
                </span>
                {req.preferred_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(req.preferred_date), "d MMM", { locale: it })}
                  </span>
                )}
                {req.budget_max && (
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    fino a €{req.budget_max}
                  </span>
                )}
                {req.estimated_hours && <span>{req.estimated_hours}h</span>}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: it })}
                  {" · "}{req.offers_count} offert{req.offers_count === 1 ? "a" : "e"}
                </span>
                <Button size="sm" onClick={() => setSelectedRequest(req)}>
                  <Send className="h-4 w-4 mr-1" />
                  Invia offerta
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send offer dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invia offerta</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-muted-foreground text-xs mt-1">{selectedRequest.city}</p>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Usa tariffa standard</label>
                <Switch
                  checked={offerForm.useStandardRate}
                  onCheckedChange={(v) => setOfferForm((p) => ({ ...p, useStandardRate: v }))}
                />
              </div>

              {!offerForm.useStandardRate && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tariffa oraria (€)</label>
                    <Input
                      type="number"
                      value={offerForm.hourly_rate}
                      onChange={(e) => setOfferForm((p) => ({ ...p, hourly_rate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Prezzo totale (€)</label>
                    <Input
                      type="number"
                      value={offerForm.total_price}
                      onChange={(e) => setOfferForm((p) => ({ ...p, total_price: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Ore stimate</label>
                <Input
                  type="number"
                  value={offerForm.estimated_hours}
                  onChange={(e) => setOfferForm((p) => ({ ...p, estimated_hours: e.target.value }))}
                  placeholder="Es: 3"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Messaggio</label>
                <Textarea
                  value={offerForm.message}
                  onChange={(e) => setOfferForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Presentati e descrivi la tua proposta..."
                  className="min-h-[80px]"
                />
              </div>

              <Button onClick={handleSendOffer} disabled={sendOffer.isPending} className="w-full">
                {sendOffer.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Invia offerta
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
