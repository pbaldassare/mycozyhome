import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyServiceRequests, useUpdateServiceRequest } from "@/hooks/useServiceRequests";
import { formatDistanceToNow } from "date-fns";
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

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  open: { label: "Aperta", icon: Clock, className: "bg-success/10 text-success" },
  closed: { label: "Chiusa", icon: XCircle, className: "bg-muted text-muted-foreground" },
  assigned: { label: "Assegnata", icon: CheckCircle, className: "bg-primary/10 text-primary" },
};

export default function ClientServiceRequests() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useMyServiceRequests();
  const updateRequest = useUpdateServiceRequest();

  const handleClose = async (id: string) => {
    try {
      await updateRequest.mutateAsync({ id, status: "closed" });
      toast({ title: "Inserzione chiusa" });
    } catch {
      toast({ title: "Errore", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Le mie inserzioni</h1>
        <Button size="sm" onClick={() => navigate("/client/service-requests/new")} className="gap-1">
          <Plus className="h-4 w-4" />
          Nuova
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Caricamento...</p>
        ) : !requests?.length ? (
          <div className="text-center py-16 space-y-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-medium">Nessuna inserzione</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pubblica una richiesta e ricevi offerte dai professionisti
              </p>
            </div>
            <Button onClick={() => navigate("/client/service-requests/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Pubblica inserzione
            </Button>
          </div>
        ) : (
          requests.map((req) => {
            const status = statusConfig[req.status] || statusConfig.open;
            const StatusIcon = status.icon;
            return (
              <div
                key={req.id}
                className="p-4 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/client/service-requests/${req.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{serviceLabels[req.service_type] || req.service_type}</Badge>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status.className)}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-semibold truncate">{req.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{req.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{req.city}</span>
                      {req.budget_max && <span>Budget: fino a €{req.budget_max}</span>}
                      <span>{req.offers_count} offert{req.offers_count === 1 ? "a" : "e"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: it })}
                  </span>
                  {req.status === "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleClose(req.id); }}
                    >
                      Chiudi inserzione
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
