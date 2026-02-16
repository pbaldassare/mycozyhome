import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Check, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useMyServiceRequests,
  useOffersForRequest,
  useAcceptOffer,
} from "@/hooks/useServiceRequests";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  accepted: "Accettata",
  confirmed: "Confermata",
  rejected: "Rifiutata",
};

export default function ServiceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: requests } = useMyServiceRequests();
  const { data: offers, isLoading } = useOffersForRequest(id);
  const acceptOffer = useAcceptOffer();

  const request = requests?.find((r) => r.id === id);

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Inserzione non trovata</p>
      </div>
    );
  }

  const handleAccept = async (offerId: string) => {
    try {
      await acceptOffer.mutateAsync({ offerId, requestId: request.id });
      toast({ title: "Offerta accettata!", description: "In attesa della conferma del professionista." });
    } catch {
      toast({ title: "Errore", variant: "destructive" });
    }
  };

  const hasAccepted = offers?.some((o) => o.status === "accepted" || o.status === "confirmed");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1 truncate">{request.title}</h1>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Request info */}
        <div className="p-4 rounded-xl border bg-card space-y-3">
          <p className="text-sm text-muted-foreground">{request.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{request.city}</Badge>
            {request.preferred_date && (
              <Badge variant="outline">
                {format(new Date(request.preferred_date), "d MMM yyyy", { locale: it })}
              </Badge>
            )}
            {request.budget_max && (
              <Badge variant="outline">Budget: fino a €{request.budget_max}</Badge>
            )}
            {request.estimated_hours && (
              <Badge variant="outline">{request.estimated_hours}h stimate</Badge>
            )}
          </div>
        </div>

        {/* Offers */}
        <div>
          <h2 className="font-semibold text-lg mb-3">
            Offerte ricevute ({offers?.length || 0})
          </h2>

          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
          ) : !offers?.length ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">Nessuna offerta ancora. I professionisti possono vederla e inviarti proposte.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-xl border bg-card">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={offer.professional?.avatar_url || undefined} />
                      <AvatarFallback>
                        {offer.professional?.first_name?.[0]}{offer.professional?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {offer.professional?.first_name} {offer.professional?.last_name}
                        </span>
                        {offer.professional?.average_rating ? (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            {offer.professional.average_rating}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{offer.professional?.city}</p>
                    </div>
                    <Badge className={cn(
                      "text-xs",
                      offer.status === "accepted" && "bg-warning/10 text-warning",
                      offer.status === "confirmed" && "bg-success/10 text-success",
                      offer.status === "pending" && "bg-muted text-muted-foreground",
                    )}>
                      {statusLabels[offer.status] || offer.status}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    {offer.message && <p className="text-sm">{offer.message}</p>}
                    <div className="flex items-center gap-4 text-sm">
                      {offer.total_price && (
                        <span className="font-semibold text-primary">€{offer.total_price}</span>
                      )}
                      {offer.hourly_rate && (
                        <span className="text-muted-foreground">€{offer.hourly_rate}/h</span>
                      )}
                      {offer.estimated_hours && (
                        <span className="text-muted-foreground">{offer.estimated_hours}h</span>
                      )}
                    </div>
                  </div>

                  {offer.status === "pending" && !hasAccepted && request.status === "open" && (
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      onClick={() => handleAccept(offer.id)}
                      disabled={acceptOffer.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accetta offerta
                    </Button>
                  )}

                  {offer.status === "confirmed" && (
                    <div className="mt-3 p-2 rounded-lg bg-success/10 text-success text-sm text-center font-medium">
                      ✅ Confermata dal professionista
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
