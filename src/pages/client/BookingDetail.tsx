import { isBookingOver } from "@/lib/booking-time";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
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


// Mancia facoltativa: in percentuale del servizio o importo fisso. Pagata col wallet (Stripe dopo).
const TIP_PERCENTS = [5, 10, 15];
const TIP_FIXED = [2, 5, 10];

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [lateAck, setLateAck] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawChannel, setWithdrawChannel] = useState<"email" | "app">("email");
  const [withdrawing, setWithdrawing] = useState(false);
  // Quanto torna al cliente se annulla adesso: lo calcola il DB con la stessa regola del rimborso.
  const { data: quote } = useQuery({
    queryKey: ["cancellation-quote", id, showCancelDialog || withdrawOpen],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cancellation_quote", { p_booking_id: id! });
      if (error) throw error;
      return data as unknown as { late: boolean; paid: number; refund: number; retained: number };
    },
    enabled: !!id && (showCancelDialog || withdrawOpen),
  });
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
  const [tipMode, setTipMode] = useState<"percent" | "fixed">("percent");
  const [tipChoice, setTipChoice] = useState<number | null>(null);
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
            id, user_id, first_name, last_name, avatar_url, has_vat_number
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleWithdraw = async () => {
    if (!id) return;
    setWithdrawing(true);
    const { error } = await supabase.rpc("withdraw_booking", { p_booking_id: id, p_name: withdrawName, p_channel: withdrawChannel });
    setWithdrawing(false);
    if (error) return toast.error(toUserMessage(error, "Recesso non riuscito. Riprova."));
    toast.success(`Recesso registrato il ${new Date().toLocaleString("it-IT")}.`);
    setWithdrawOpen(false);
    queryClient.invalidateQueries({ queryKey: ["client-wallet"] });
    navigate("/client/bookings");
  };

  const [reportingNoShow, setReportingNoShow] = useState(false);
  const reportNoShow = async () => {
    if (!id || !confirm("Confermi che il professionista non si è presentato?")) return;
    setReportingNoShow(true);
    const { data, error } = await supabase.rpc("report_professional_no_show", { p_booking_id: id });
    setReportingNoShow(false);
    if (error) return toast.error(toUserMessage(error, "Segnalazione non riuscita. Riprova."));
    toast.success(data === "refunded_no_checkin" ? "Ti abbiamo rimborsato l'intero importo." : "Segnalazione registrata.");
    queryClient.invalidateQueries({ queryKey: ["booking-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["client-wallet"] });
  };

  const handleCancel = async () => {
    if (!id) return;
    
    try {
      await cancelBooking.mutateAsync({ bookingId: id, reason: cancelReason });
      toast.success("Prenotazione annullata");
      setShowCancelDialog(false);
      navigate("/client/bookings");
    } catch (e) {
      toast.error(toUserMessage(e, "Errore durante l'annullamento"));
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
  const isUpcoming = !isBookingOver(booking) && 
    booking.status !== "completed" && 
    booking.status !== "cancelled";
  // TP 12.2: si recensisce entro 3 giorni dal servizio (il DB lo verifica comunque).
  const reviewExpired = !!booking.completed_at && Date.now() > new Date(booking.completed_at).getTime() + 3 * 86_400_000;
  const showReviewButton = booking.status === "completed" && canReviewBooking && !reviewExpired;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  // Con P.IVA: recesso entro 14 giorni dalla prenotazione (vale anche come annullamento).
  const canWithdraw = canCancel && !!booking.professional?.has_vat_number
    && Date.now() < new Date(booking.created_at).getTime() + 14 * 86_400_000;
  const canDispute = user && canDisputeBooking(booking);
  // TU 7.4: entro 3 ore da "Servizio completato" il cliente può segnalare la mancata presentazione.
  const canReportNoShow = booking.status === "completed" && booking.payment_status === "pending_release"
    && !booking.no_show_reported_at && !!booking.completed_at
    && Date.now() < new Date(booking.completed_at).getTime() + 3 * 3_600_000;
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
            {Number(booking.discount_amount ?? 0) > 0 && (
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

        {booking.status === "completed" && (
          tipAmount > 0 ? (
            <div className="trust-card text-center text-sm">
              Hai lasciato una mancia di <strong>€{tipAmount.toFixed(2)}</strong> ❤️
            </div>
          ) : (() => {
            const base = Number(booking.total_amount ?? 0);
            const toEuro = (v: number) => (tipMode === "percent" ? Math.round(base * v) / 100 : v);
            const selected = customTip ? Number(customTip) : tipChoice != null ? toEuro(tipChoice) : 0;
            return (
              <div className="trust-card space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" /> Mancia a {proFirstName}
                  </h3>
                  <span className="text-xs text-muted-foreground">Facoltativa</span>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm font-semibold">
                  {(["percent", "fixed"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setTipMode(m); setTipChoice(null); }}
                      className={`rounded-full py-1.5 ${tipMode === m ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}
                    >
                      {m === "percent" ? "Percentuale" : "Importo fisso"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(tipMode === "percent" ? TIP_PERCENTS : TIP_FIXED).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setTipChoice(v); setCustomTip(""); }}
                      className={`rounded-2xl border py-2 text-center ${tipChoice === v && !customTip ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                    >
                      <span className="block font-bold">{tipMode === "percent" ? `${v}%` : `€${v}`}</span>
                      {tipMode === "percent" && <span className="block text-xs text-muted-foreground">€{toEuro(v).toFixed(2)}</span>}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={100}
                  placeholder="Altro importo in €"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                />
                <Button className="w-full" disabled={tipping || !(selected > 0)} onClick={() => sendTip(selected)}>
                  {selected > 0 ? `Invia mancia di €${selected.toFixed(2)}` : "Scegli un importo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Viene pagata con il credito del tuo wallet e va tutta al professionista.
                </p>
              </div>
            );
          })()
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

          {booking.status === "completed" && canReviewBooking && reviewExpired && (
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              Il tempo per recensire (3 giorni dal servizio) è scaduto.
            </div>
          )}

          {booking.status === "completed" && !canReviewBooking && (
            <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
              Hai già lasciato una recensione
            </div>
          )}

          {canReportNoShow && (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              size="lg"
              onClick={reportNoShow}
              disabled={reportingNoShow}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Il professionista non si è presentato
            </Button>
          )}

          {booking.no_show_outcome && (
            <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
              {booking.no_show_outcome === "refunded_no_checkin"
                ? "Segnalazione accolta: nessun check-in registrato, ti abbiamo rimborsato l'intero importo."
                : "Segnalazione registrata: il professionista aveva fatto un check-in valido, quindi il pagamento gli è stato versato. Se non sei d'accordo puoi chiedere la verifica di una persona all'assistenza."}
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

          {canWithdraw && (
            <div className="space-y-1">
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                size="lg"
                onClick={() => setWithdrawOpen(true)}
              >
                <X className="h-5 w-5 mr-2" />
                Recedi dal contratto qui
              </Button>
              <p className="text-center text-xs text-muted-foreground">Funzione messa a disposizione per conto del professionista</p>
            </div>
          )}

          {canCancel && !canWithdraw && (
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
              {quote?.late
                ? "Mancano meno di 3 ore all'inizio: ti rimborsiamo solo il 50%."
                : "Sei sicuro di voler annullare questa prenotazione? Ti rimborsiamo l'intero importo sul wallet."}
            </DialogDescription>
          </DialogHeader>
          {quote?.late && (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p>
                Rimborso: <strong>€{Number(quote.refund).toFixed(2)}</strong> · Trattenuti:{" "}
                <strong className="text-destructive">€{Number(quote.retained).toFixed(2)}</strong>
              </p>
              <label className="flex items-start gap-2">
                <Checkbox checked={lateAck} onCheckedChange={(c) => setLateAck(c === true)} className="mt-0.5" />
                <span>Ho capito che annullando ora mi verranno trattenuti €{Number(quote.retained).toFixed(2)}.</span>
              </label>
            </div>
          )}
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
              disabled={cancelBooking.isPending || !quote || (quote.late && !lateAck)}
            >
              {cancelBooking.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Conferma annullamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recesso dal contratto</DialogTitle>
            <DialogDescription>
              Dichiaro di recedere dal contratto relativo alla prenotazione del{" "}
              {format(new Date(booking.scheduled_date), "d MMMM yyyy", { locale: it })} alle {booking.scheduled_time_start.slice(0, 5)} con{" "}
              {booking.professional?.first_name} {booking.professional?.last_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="block">
              <span className="font-medium">Nome e cognome</span>
              <Input value={withdrawName} onChange={(e) => setWithdrawName(e.target.value)} className="mt-1" />
            </label>
            <div>
              <span className="font-medium">Dove vuoi la conferma</span>
              <div className="mt-1 flex gap-2">
                {(["email", "app"] as const).map((c) => (
                  <Button key={c} type="button" size="sm" variant={withdrawChannel === c ? "default" : "outline"} onClick={() => setWithdrawChannel(c)}>
                    {c === "email" ? "Email" : "Notifica in app"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {quote?.late && (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p>
                Rimborso: <strong>€{Number(quote.refund).toFixed(2)}</strong> · Trattenuti:{" "}
                <strong className="text-destructive">€{Number(quote.retained).toFixed(2)}</strong>
              </p>
              <label className="flex items-start gap-2">
                <Checkbox checked={lateAck} onCheckedChange={(c) => setLateAck(c === true)} className="mt-0.5" />
                <span>Ho capito che annullando ora mi verranno trattenuti €{Number(quote.retained).toFixed(2)}.</span>
              </label>
            </div>
          )}
          {quote && !quote.late && (
            <p className="text-sm text-muted-foreground">Ti rimborsiamo l'intero importo (€{Number(quote.refund).toFixed(2)}).</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Indietro</Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={withdrawing || withdrawName.trim().length < 3 || !quote || (quote.late && !lateAck)}
            >
              {withdrawing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Conferma recesso
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
