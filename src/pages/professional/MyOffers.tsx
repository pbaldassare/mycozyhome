import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Check, CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyOffers, useConfirmOffer } from "@/hooks/useServiceRequests";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "bg-warning/10 text-warning" },
  accepted: { label: "Accettata dal cliente", className: "bg-primary/10 text-primary" },
  confirmed: { label: "Confermata", className: "bg-success/10 text-success" },
  rejected: { label: "Rifiutata", className: "bg-destructive/10 text-destructive" },
};

export default function MyOffers() {
  const navigate = useNavigate();
  const { data: professional } = useProfessionalProfile();
  const { data: offers, isLoading } = useMyOffers(professional?.id);
  const confirmOffer = useConfirmOffer();

  const handleConfirm = async (offerId: string) => {
    try {
      await confirmOffer.mutateAsync({ offerId });
      toast({ title: "Offerta confermata!", description: "La prenotazione verrà creata." });
    } catch {
      toast({ title: "Errore", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Le mie offerte</h1>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Caricamento...</p>
        ) : !offers?.length ? (
          <div className="text-center py-16">
            <Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">Nessuna offerta inviata</p>
            <p className="text-sm text-muted-foreground mt-1">Vai alla bacheca per trovare inserzioni</p>
            <Button className="mt-4" onClick={() => navigate("/professional/service-board")}>
              Vai alla bacheca
            </Button>
          </div>
        ) : (
          offers.map((offer: any) => {
            const status = statusConfig[offer.status] || statusConfig.pending;
            const request = offer.service_request;
            return (
              <div key={offer.id} className="p-4 rounded-xl border bg-card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{request?.title || "Richiesta"}</h3>
                    <p className="text-xs text-muted-foreground">{request?.city}</p>
                  </div>
                  <Badge className={cn("text-xs", status.className)}>{status.label}</Badge>
                </div>

                <div className="flex gap-3 text-sm">
                  {offer.total_price && <span className="font-medium">€{offer.total_price}</span>}
                  {offer.hourly_rate && <span className="text-muted-foreground">€{offer.hourly_rate}/h</span>}
                  {offer.estimated_hours && <span className="text-muted-foreground">{offer.estimated_hours}h</span>}
                </div>

                {offer.message && <p className="text-sm text-muted-foreground">{offer.message}</p>}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: it })}
                  </span>
                  {offer.status === "accepted" && (
                    <Button size="sm" onClick={() => handleConfirm(offer.id)} disabled={confirmOffer.isPending}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Conferma
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
