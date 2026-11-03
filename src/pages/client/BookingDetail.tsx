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
import { DisputeForm } from "@/components/dispute/DisputeForm";
import { canDisputeBooking, getDisputeDeadlineLabel, PAYMENT_STATUS_LABELS } from "@/lib/payment-flow";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useBookingTracking } from "@/hooks/useBookingTracking";
import { useQueryClient } from "@tanstack/react-query";
import { Navigation, Heart, Camera, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LIVE_STEPS, etaMinutes, liveStep } from "@/lib/live-status";
import { useBookingPhotos } from "@/hooks/useBookingPhotos";
import { toUserMessage } from "@/lib/errors";
import type { ReviewInput } from "@/components/client/ReviewForm";

import { SERVICE_LABELS as serviceTypeLabels } from "@/lib/services";
const statusConfig = {
  pending: { label: "In attesa di conferma", className: "bg-warning/10 text-warning", icon: Clock },
  confirmed: { label: "Confermato", className: "bg-success/10 text-success", icon: CheckCircle },
  completed: { label: "Completato", className: "bg-muted text-muted-foreground", icon: CheckCircle },
  cancelled: { label: "Annullato", className: "bg-destructive/10 text-destructive", icon: X },
};


// ponytail: mancia spenta finché add_tip e il tipo "tip" del wallet non sono nel DB.
const TIPS_ENABLED = false;

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { user } = useAuth();
  const cancelBooking = useCancelBooking();
  const createReview = useCreateReview();
  const { data: canReviewBooking } = useCanReview(id);
  const { tracking } = useBookingTracking(id);
  const queryClient = useQueryClient();
  const { data: photos } = useBookingPhotos(id);
  const [customTip, setCustomTip] = useState("");
  const [tipping, setTipping] = useState(false);

  // Realtime: notifica il cliente quando il professionista fa check-in/check-out
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`booking-tracking-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'mycozyhome',
          table: 'booking_tracking',
          filter: `booking_id=eq.${id}`,
        },
        (payload: { eventType: string; new: { check_in_at?: string | null; check_out_at?: string | null; actual_hours?: number | null } }) => {
          const newRecord = payload.new;
          queryClient.invalidateQueries({ queryKey: ["booking-tracking", id] });

          if (payload.eventType === 'INSERT' && newRecord?.check_in_at) {
            toast.info("🟢 Il professionista è arrivato!", {
              description: `Check-in registrato alle ${new Date(newRecord.check_in_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
              duration: 8000,
            });
          } else if (payload.eventType === 'UPDATE' && newRecord?.check_out_at) {
            const hours = newRecord.actual_hours ? `${Number(newRecord.actual_hours).toFixed(1)}h` : "";
            toast.info("🔴 Il professionista ha terminato!", {
              description: `Check-out alle ${new Date(newRecord.check_out_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}${hours ? ` — Ore lavorate: ${hours}` : ""}`,
              duration: 8000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'mycozyhome', table: 'bookings', filter: `id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["booking-detail", id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          professional:professionals(
            id, user_id, first_name, last_name, avatar_url
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
  const canDispute = user && canDisputeBooking(booking);
  const paymentLabel = PAYMENT_STATUS_LABELS[booking.payment_status ?? "none"] ?? booking.payment_status;

  const handleReviewSubmit = async (review: ReviewInput) => {
    await createReview.mutateAsync({
      bookingId: booking.id,
      professionalId: booking.professional_id,
      ...review,
    });
    setShowReviewDialog(false);
  };

  const step = liveStep(booking, tracking?.check_in_at);
  const proFirstName = booking.professional?.first_name || "Il professionista";
  const hasProPosition = booking.pro_latitude != null && booking.pro_longitude != null;
  const eta = step === 2 && hasProPosition && booking.latitude != null && booking.longitude != null
    ? etaMinutes(Number(booking.pro_latitude), Number(booking.pro_longitude), Number(booking.latitude), Number(booking.longitude))
    : null;
  const mapsUrl = hasProPosition
    ? `https://www.google.com/maps/dir/?api=1&origin=${booking.pro_latitude},${booking.pro_longitude}&destination=${
        booking.latitude != null ? `${booking.latitude},${booking.longitude}` : encodeURIComponent(booking.address)}`
    : null;
  const tipAmount = Number(booking.tip_amount ?? 0);
  const rebookUrl = `/client/booking/new?professional=${booking.professional_id}&service=${booking.service_type}&duration=${booking.total_hours}${
    booking.package_id ? `&package=${booking.package_id}` : ""}`;

  const sendTip = async (amount: number) => {
    if (!(amount >= 1 && amount <= 100)) {
      toast.error("La mancia deve essere tra 1 € e 100 €.");
      return;
    }
    setTipping(true);
    const { error } = await supabase.rpc("add_tip", { p_booking_id: booking.id, p_amount: Math.round(amount * 100) / 100 });
    setTipping(false);
    if (error) {
      toast.error(toUserMessage(error, "Impossibile inviare la mancia. Riprova."));
      return;
    }
    toast.success("Grazie! La mancia è arrivata al professionista ❤️");
    queryClient.invalidateQueries({ queryKey: ["booking-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["client-wallet"] });
    queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
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

        {/* Stato live, come nelle app di delivery */}
        {step >= 0 && (
          <div className="trust-card space-y-4">
            <div className="flex items-center justify-between">
              {LIVE_STEPS.map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex items-center w-full">
                    <div className={cn("h-1 flex-1 rounded-full", i === 0 ? "opacity-0" : i <= step ? "bg-primary" : "bg-muted")} />
                    <div
                      className={cn(
                        "h-3.5 w-3.5 rounded-full shrink-0",
                        i < step ? "bg-primary" : i === step ? "bg-primary ring-4 ring-primary/25 animate-pulse" : "bg-muted",
                      )}
                    />
                    <div className={cn("h-1 flex-1 rounded-full", i === LIVE_STEPS.length - 1 ? "opacity-0" : i < step ? "bg-primary" : "bg-muted")} />
                  </div>
                  <span className={cn("text-[10px] text-center leading-tight", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {step === 2 && (
              <div className="rounded-2xl bg-brand-gradient text-primary-foreground p-4 space-y-1">
                <p className="font-bold text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  {proFirstName} sta arrivando{eta != null && ` · ~${eta} min`}
                </p>
                {booking.pro_location_at ? (
                  <p className="text-sm opacity-90">
                    Posizione aggiornata alle {format(new Date(booking.pro_location_at), "HH:mm")}
                  </p>
                ) : (
                  <p className="text-sm opacity-90">In attesa della prima posizione…</p>
                )}
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold underline underline-offset-4 pt-1">
                    Vedi su mappa
                  </a>
                )}
              </div>
            )}
            {step === 3 && (
              <p className="text-sm text-center text-muted-foreground">
                {proFirstName} è al lavoro dalle {format(new Date(tracking!.check_in_at!), "HH:mm")} 🧹
              </p>
            )}
          </div>
        )}

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

        {/* Tracking Status */}
        {tracking && (
          <div className="trust-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Stato presenza
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-in</span>
                {tracking.check_in_at ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {format(new Date(tracking.check_in_at), "HH:mm")}
                    </span>
                    <Badge variant="secondary" className={tracking.check_in_in_range ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {tracking.check_in_in_range ? "In zona" : "Fuori zona"}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Non ancora</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-out</span>
                {tracking.check_out_at ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {format(new Date(tracking.check_out_at), "HH:mm")}
                    </span>
                    <Badge variant="secondary" className={tracking.check_out_in_range ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {tracking.check_out_in_range ? "In zona" : "Fuori zona"}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Non ancora</span>
                )}
              </div>
              {tracking.actual_hours != null && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Ore effettive</span>
                  <span className="text-sm font-bold text-primary">
                    {Number(tracking.actual_hours).toFixed(1)}h
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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
            {booking.payment_status && booking.payment_status !== "none" && (
              <p className="text-xs text-muted-foreground pt-2">
                Pagamento: <span className="font-medium">{paymentLabel}</span>
                {booking.payment_status === "pending_release" && (
                  <> — erogazione dopo il {getDisputeDeadlineLabel(booking)} se non contestato</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Foto prima/dopo e della recensione */}
        {photos && photos.length > 0 && (
          <div className="trust-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5" /> Foto del servizio
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <a key={photo.path} href={photo.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={photo.url} alt={photo.kind === "before" ? "Prima" : photo.kind === "after" ? "Dopo" : "Foto recensione"} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5">
                    {photo.kind === "before" ? "Prima" : photo.kind === "after" ? "Dopo" : "Recensione"}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Mancia: spenta finché add_tip non è nel DB (arriva con Stripe). */}
        {TIPS_ENABLED && booking.status === "completed" && (
          tipAmount > 0 ? (
            <div className="trust-card text-center text-sm">
              Hai lasciato una mancia di <strong>€{tipAmount.toFixed(2)}</strong> ❤️
            </div>
          ) : (
            <div className="trust-card space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Lascia una mancia a {proFirstName}
              </h3>
              <div className="flex gap-2">
                {[2, 5, 10].map((amount) => (
                  <Button key={amount} variant="outline" className="flex-1" disabled={tipping} onClick={() => sendTip(amount)}>
                    €{amount}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={100}
                  placeholder="Altro importo"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                />
                <Button disabled={tipping || !customTip} onClick={() => sendTip(Number(customTip))}>
                  Invia
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                La mancia viene pagata con i crediti del tuo wallet e va interamente al professionista.
              </p>
            </div>
          )
        )}

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

          {canDispute && (
            <Button
              variant="outline"
              className="w-full border-warning text-warning hover:bg-warning/10"
              size="lg"
              onClick={() => setShowDisputeDialog(true)}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Apri contestazione
            </Button>
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
              variant={showReviewButton ? "outline" : "default"}
              className="w-full"
              size="lg"
              onClick={() => navigate(rebookUrl)}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
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
              Sei sicuro di voler annullare questa prenotazione? I crediti verranno rimborsati sul tuo wallet.
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

      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contestazione servizio</DialogTitle>
            <DialogDescription>
              Hai 5 giorni dalla data del servizio per contestare. Il pagamento al professionista verrà sospeso fino alla risoluzione.
            </DialogDescription>
          </DialogHeader>
          {user && booking && (
            <DisputeForm
              reporterId={user.id}
              reporterType="client"
              reportedId={booking.professional?.user_id ?? booking.professional_id}
              reportedType="professional"
              reportedName={professionalName}
              bookingId={booking.id}
              onSuccess={() => {
                setShowDisputeDialog(false);
                toast.success("Contestazione inviata. Il pagamento è stato sospeso.");
              }}
              onCancel={() => setShowDisputeDialog(false)}
            />
          )}
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
