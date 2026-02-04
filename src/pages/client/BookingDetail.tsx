import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isPast } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Star, 
  X, 
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/client/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCancelBooking } from "@/hooks/useBookings";
import { useCreateReview, useCanReview } from "@/hooks/useReviews";
import { ReviewForm } from "@/components/client/ReviewForm";
import { toast } from "sonner";
import { useState } from "react";

const statusConfig = {
  pending: { label: "In attesa di conferma", className: "bg-warning/10 text-warning", icon: Clock },
  confirmed: { label: "Confermato", className: "bg-success/10 text-success", icon: CheckCircle },
  completed: { label: "Completato", className: "bg-muted text-muted-foreground", icon: CheckCircle },
  cancelled: { label: "Annullato", className: "bg-destructive/10 text-destructive", icon: X },
};

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const cancelBooking = useCancelBooking();
  const createReview = useCreateReview();
  const { data: canReviewBooking } = useCanReview(id);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          professional:professionals(
            id, first_name, last_name, avatar_url, phone, email
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleCancel = async () => {
    if (!id) return;
    
    try {
      await cancelBooking.mutateAsync({ bookingId: id, reason: cancelReason });
      toast.success("Prenotazione annullata");
      setShowCancelDialog(false);
      navigate("/client/bookings");
    } catch {
      toast.error("Errore durante l'annullamento");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Dettaglio prenotazione" showBack />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Dettaglio prenotazione" showBack />
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-semibold">Prenotazione non trovata</h2>
        </div>
      </div>
    );
  }

  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  const professionalName = booking.professional 
    ? `${booking.professional.first_name} ${booking.professional.last_name}`
    : "Professionista";
  const initials = professionalName.split(" ").map(n => n[0]).join("");
  const formattedDate = format(parseISO(booking.scheduled_date), "EEEE d MMMM yyyy", { locale: it });
  const timeRange = `${booking.scheduled_time_start.slice(0, 5)} - ${booking.scheduled_time_end.slice(0, 5)}`;
  const isUpcoming = !isPast(parseISO(booking.scheduled_date)) && 
    booking.status !== "completed" && 
    booking.status !== "cancelled";
  const showReviewButton = booking.status === "completed" && canReviewBooking;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!booking) return;
    await createReview.mutateAsync({
      bookingId: booking.id,
      professionalId: booking.professional_id,
      rating,
      comment,
    });
    setShowReviewDialog(false);
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <AppHeader title="Dettaglio prenotazione" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-center">
          <Badge className={cn("text-sm px-4 py-2", status.className)}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {status.label}
          </Badge>
        </div>

        {/* Service Info */}
        <div className="trust-card">
          <h2 className="text-xl font-bold mb-2">
            {serviceTypeLabels[booking.service_type] || booking.service_type}
          </h2>
          
          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <span>{timeRange}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              <span>{booking.address}</span>
            </div>
          </div>

          {booking.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium mb-1">Note</h4>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Professional Info */}
        <div className="trust-card">
          <h3 className="font-semibold mb-4">Professionista</h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={booking.professional?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{professionalName}</p>
              {booking.professional?.phone && (
                <p className="text-sm text-muted-foreground">{booking.professional.phone}</p>
              )}
            </div>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => navigate(`/client/chat/new?professional=${booking.professional_id}`)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Price Summary */}
        <div className="trust-card">
          <h3 className="font-semibold mb-4">Riepilogo costi</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tariffa oraria</span>
              <span>€{Number(booking.hourly_rate).toFixed(2)}/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durata</span>
              <span>{booking.total_hours} ore</span>
            </div>
            {booking.discount_amount && Number(booking.discount_amount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Sconto</span>
                <span>-€{Number(booking.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Totale</span>
              <span className="text-primary">€{Number(booking.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isUpcoming && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate(`/client/chat/new?professional=${booking.professional_id}`)}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contatta professionista
            </Button>
          )}

          {showReviewButton && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setShowReviewDialog(true)}
            >
              <Star className="h-5 w-5 mr-2" />
              Lascia una recensione
            </Button>
          )}

          {booking.status === "completed" && !canReviewBooking && (
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
              Hai già lasciato una recensione
            </div>
          )}

          {canCancel && (
            <Button 
              variant="outline" 
              className="w-full text-destructive border-destructive hover:bg-destructive/10" 
              size="lg"
              onClick={() => setShowCancelDialog(true)}
            >
              <X className="h-5 w-5 mr-2" />
              Annulla prenotazione
            </Button>
          )}

          {booking.status === "completed" && (
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={() => navigate(`/client/booking/new?professional=${booking.professional_id}&service=${booking.service_type}`)}
            >
              Prenota di nuovo
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annulla prenotazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler annullare questa prenotazione? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo dell'annullamento (opzionale)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Indietro
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Conferma annullamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <ReviewForm
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        onSubmit={handleReviewSubmit}
        professionalName={professionalName}
        serviceName={serviceTypeLabels[booking.service_type] || booking.service_type}
      />
    </div>
  );
}
