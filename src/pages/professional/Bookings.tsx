import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  MapPin,
  CheckCircle,
  X,
  Phone,
  MessageCircle,
  Euro,
  Calendar,
  ChevronLeft,
  Star,
  Filter,
  Heart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { it } from "date-fns/locale";
import {
  useProfessionalProfile,
  useProfessionalBookings,
  useUpdateBookingStatus,
} from "@/hooks/useProfessionalData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toUserMessage } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";
import { ClientReviewForm } from "@/components/professional/ClientReviewForm";
import { useCreateClientReview, useCanReviewClient } from "@/hooks/useClientReviews";
import { useProfessionalFavorites } from "@/hooks/useProfessionalFavorites";
import { useBookingTrackingByBookingIds, type BookingTracking } from "@/hooks/useBookingTracking";
import { useProfessionalRevenue } from "@/hooks/useProfessionalRevenue";
import { RevenueLimitBanner } from "@/components/professional/RevenueLimitBanner";
import { EnRouteButton, BookingPhotos } from "@/components/professional/BookingExtras";
import { BookingAppeals } from "@/components/BookingAppeals";
import { DisputeForm } from "@/components/dispute/DisputeForm";
import { canDisputeBooking } from "@/lib/payment-flow";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Navigation, Radio, AlertTriangle } from "lucide-react";
import { SERVICE_LABELS as serviceTypeLabels } from "@/lib/services";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


function formatBookingDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Oggi";
  if (isTomorrow(date)) return "Domani";
  return format(date, "EEEE d MMMM", { locale: it });
}

type TrackingRow = BookingTracking;
type ProfessionalBooking = Tables<"bookings"> & {
  client: Pick<Tables<"client_public">, "user_id" | "first_name" | "last_name" | "avatar_url" | "average_rating" | "review_count"> | null;
};

function useAllProfessionalBookings(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-all-bookings", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("professional_id", professionalId)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time_start", { ascending: false });

      if (error) throw error;

      // Dati minimi dei clienti in una sola richiesta.
      const clientIds = [...new Set((data || []).map((b) => b.client_id))];
      const { data: clients } = clientIds.length
        ? await supabase
            .from("client_public")
            .select("user_id, first_name, last_name, avatar_url, average_rating, review_count")
            .in("user_id", clientIds)
        : { data: [] };
      const byId = new Map((clients ?? []).map((c) => [c.user_id, c]));

      return (data || []).map((booking) => ({ ...booking, client: byId.get(booking.client_id) ?? null }));
    },
    enabled: !!professionalId,
  });
}
const CHECKIN_REASONS: Record<string, string> = {
  too_early: "È troppo presto: il check-in si apre 30 minuti prima dell'orario.",
  too_late: "Sono passati più di 10 minuti dall'orario concordato.",
  too_far: "Sei troppo lontano dall'indirizzo del servizio.",
};

/** Un solo check-in (posizione e orario in quel momento) e poi "Servizio completato". Nessun tracciamento continuo. */
// TP 9.10 / PT: per 12 mesi dal primo servizio, continuare fuori piattaforma richiede la quota di riscatto.
function BuyoutButton({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const { data: relations } = useQuery({
    queryKey: ["client-pro-relations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_pro_relations").select("client_id, buyout_requested_at, buyout_paid_at");
      if (error) throw error;
      return data;
    },
  });
  const rel = relations?.find((r) => r.client_id === clientId);
  if (!rel) return null;
  if (rel.buyout_paid_at) return <p className="mt-2 text-xs text-muted-foreground">Quota di riscatto pagata: puoi lavorare con questo cliente anche fuori dall'app.</p>;
  if (rel.buyout_requested_at) return <p className="mt-2 text-xs text-muted-foreground">Quota di riscatto richiesta (€ 2.000): ti contatteremo per il pagamento.</p>;

  async function request() {
    if (!confirm("Vuoi continuare a lavorare con questo cliente fuori da MyCozyHome? Entro 12 mesi dal primo servizio è dovuta la quota di riscatto di € 2.000.")) return;
    const { error } = await supabase.rpc("request_buyout", { p_client_id: clientId });
    if (error) return toast.error(toUserMessage(error));
    toast.success("Richiesta inviata");
    queryClient.invalidateQueries({ queryKey: ["client-pro-relations"] });
  }
  return (
    <Button size="sm" variant="ghost" className="w-full mt-2 text-xs text-muted-foreground" onClick={request}>
      Voglio continuare fuori piattaforma con questo cliente
    </Button>
  );
}

function TrackingActions({ booking, trackingRecord }: { booking: ProfessionalBooking; trackingRecord: TrackingRow | undefined }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["booking-tracking-batch"] });
    queryClient.invalidateQueries({ queryKey: ["professional-all-bookings"] });
  };

  if (trackingRecord?.status === "completed") {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
        <CheckCircle className="h-4 w-4 text-success" /> <span className="font-medium">Servizio completato</span>
      </div>
    );
  }
  if (booking.status !== "confirmed" || !isToday(parseISO(booking.scheduled_date))) return null;

  const checkIn = async () => {
    setBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      const { data, error } = await supabase.rpc("check_in", { p_booking_id: booking.id, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude });
      if (error) throw error;
      const r = data as unknown as { valid: boolean; reason?: string; distance_m?: number };
      if (r.valid) toast.success("Check-in registrato ✓");
      else toast.error(`Check-in non valido. ${CHECKIN_REASONS[r.reason ?? ""] ?? ""}${r.distance_m != null ? ` (distanza ${r.distance_m} m)` : ""}`);
      refresh();
    } catch (e) {
      const code = (e as GeolocationPositionError | null)?.code;
      toast.error(code === 1 ? "Consenti l'accesso alla posizione per fare il check-in." : toUserMessage(e, "Check-in non riuscito. Riprova."));
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("complete_service", { p_booking_id: booking.id });
    setBusy(false);
    if (error) return toast.error(toUserMessage(error, "Operazione non riuscita. Riprova."));
    toast.success("Servizio completato. Abbiamo avvisato il cliente.");
    refresh();
  };

  const reportAbsent = async () => {
    if (!confirm("Confermi che il cliente è assente o non ti ha fatto entrare? Il cliente verrà avvisato e riceverà il 40%.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("report_client_absent", { p_booking_id: booking.id });
    setBusy(false);
    if (error) return toast.error(toUserMessage(error, "Segnalazione non riuscita. Riprova."));
    toast.success("Segnalazione registrata: ricevi il 60% al netto dell'indennizzo.");
    refresh();
  };

  const checkedIn = !!trackingRecord?.check_in_at;
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
      {checkedIn ? (
        <p className="flex items-center gap-1 text-sm font-medium text-success">
          <CheckCircle className="h-4 w-4" /> Check-in alle {format(new Date(trackingRecord!.check_in_at!), "HH:mm")}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Quando arrivi, fai il check-in: registriamo la tua posizione solo in quel momento.
          </p>
          <Button size="sm" className="w-full" onClick={checkIn} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <MapPin className="mr-1 h-4 w-4" />} Fai check-in
          </Button>
        </>
      )}
      <Button size="sm" variant="outline" className="w-full" onClick={complete} disabled={busy}>
        <CheckCircle className="mr-1 h-4 w-4" /> Servizio completato
      </Button>
      {checkedIn && trackingRecord?.check_in_in_range && (
        <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={reportAbsent} disabled={busy}>
          Cliente assente / accesso negato
        </Button>
      )}
    </div>
  );
}


export default function ProfessionalBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: professional } = useProfessionalProfile();
  const { data: bookings, isLoading } = useAllProfessionalBookings(professional?.id);
  const updateStatus = useUpdateBookingStatus();
  const { data: revenue } = useProfessionalRevenue(professional?.id);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<ProfessionalBooking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<ProfessionalBooking | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const createClientReview = useCreateClientReview();
  const { isFavorite, toggleFavorite } = useProfessionalFavorites();

  // Get all booking IDs for tracking
  const bookingIds = useMemo(() => (bookings || []).map((b) => b.id), [bookings]);
  const { data: allTracking } = useBookingTrackingByBookingIds(bookingIds);
  const trackingMap = useMemo(() => {
    const map: Record<string, TrackingRow> = {};
    (allTracking || []).forEach((t) => { map[t.booking_id] = t; });
    return map;
  }, [allTracking]);

  // Get unique service types from bookings
  const availableServiceTypes = useMemo(() => {
    if (!bookings) return [];
    const types = [...new Set(bookings.map((b) => b.service_type))];
    return types.sort();
  }, [bookings]);

  // Filter bookings by service type
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (serviceFilter === "all") return bookings;
    return bookings.filter((b) => b.service_type === serviceFilter);
  }, [bookings, serviceFilter]);

  const handleAccept = (bookingId: string) => {
    if (revenue?.blocked || revenue?.exceededWithoutVat) {
      toast.error(
        "Account bloccato: hai superato i 5.000€ annui senza P.IVA. Registra la Partita IVA per accettare nuove prenotazioni."
      );
      navigate("/professional/profile/fiscal");
      return;
    }
    updateStatus.mutate({ bookingId, status: "confirmed" });
  };

  const handleRejectClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedBookingId) {
      updateStatus.mutate(
        { bookingId: selectedBookingId, status: "cancelled" },
        {
          onSuccess: () => {
            setRejectDialogOpen(false);
            setSelectedBookingId(null);
          },
        }
      );
    }
  };

  // Filter bookings by status
  const pendingBookings = filteredBookings.filter((b) => b.status === "pending");
  const confirmedBookings = filteredBookings.filter(
    (b) => b.status === "confirmed" && (!isPast(parseISO(b.scheduled_date)) || isToday(parseISO(b.scheduled_date)))
  );
  const completedBookings = filteredBookings.filter((b) => b.status === "completed");
  const cancelledBookings = filteredBookings.filter((b) => b.status === "cancelled");



  const renderBookingCard = (booking: ProfessionalBooking, showActions: boolean = false) => {
    const clientName = booking.client
      ? `${booking.client.first_name || ""} ${booking.client.last_name || ""}`.trim() ||
        "Cliente"
      : "Cliente";
    const initials = clientName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardContent className="p-4">
          {/* Header with client and status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={booking.client?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{clientName}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {serviceTypeLabels[booking.service_type] || booking.service_type}
                  </p>
                  {booking.client?.average_rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {Number(booking.client.average_rating).toFixed(1)}
                      <span className="text-muted-foreground/60">
                        ({booking.client.review_count})
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(booking.client_id);
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isFavorite(booking.client_id)
                      ? "fill-destructive text-destructive"
                      : "text-muted-foreground"
                  )}
                />
              </button>
              <Badge
                variant="secondary"
                className={cn(
                  booking.status === "confirmed" && "bg-success/10 text-success",
                  booking.status === "pending" && "bg-warning/10 text-warning",
                  booking.status === "completed" && "bg-primary/10 text-primary",
                  booking.status === "cancelled" && "bg-destructive/10 text-destructive"
                )}
              >
                {booking.status === "confirmed" && "Confermato"}
                {booking.status === "pending" && "In attesa"}
                {booking.status === "completed" && "Completato"}
                {booking.status === "cancelled" && "Annullato"}
              </Badge>
            </div>
          </div>

          {/* Booking details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {formatBookingDate(booking.scheduled_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {booking.scheduled_time_start.slice(0, 5)} -{" "}
                {booking.scheduled_time_end.slice(0, 5)} ({booking.total_hours}h)
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{booking.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Euro className="h-4 w-4" />
              <span className="font-semibold text-foreground">
                €{Number(booking.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          )}

          {/* Actions */}
          {showActions && booking.status === "pending" && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleRejectClick(booking.id)}
                disabled={updateStatus.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Rifiuta
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleAccept(booking.id)}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accetta
              </Button>
            </div>
          )}

          {/* Contact actions for confirmed bookings */}

          {/* Tracking actions for confirmed bookings today */}
          <TrackingActions booking={booking} trackingRecord={trackingMap[booking.id]} />

          {booking.status === "confirmed" && isToday(parseISO(booking.scheduled_date)) && (
            <EnRouteButton
              bookingId={booking.id}
              enRouteAt={booking.en_route_at}
              checkedIn={!!trackingMap[booking.id]?.check_in_at}
            />
          )}
          {(booking.status === "confirmed" || booking.status === "completed") && (
            <BookingPhotos bookingId={booking.id} />
          )}

          {/* Review button for completed bookings */}
          {booking.status === "completed" && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setReviewBooking(booking)}
              >
                <Star className="h-4 w-4 mr-1" />
                Valuta il cliente
              </Button>
              <BuyoutButton clientId={booking.client_id} />
            </div>
          )}

          {(booking.status === "completed" || booking.client_absent_at) && (
            <div className="mt-2">
              <BookingAppeals bookingId={booking.id} automaticOutcome={!!booking.no_show_outcome || !!booking.client_absent_at} />
            </div>
          )}

          {user && canDisputeBooking(booking) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 border-warning text-warning hover:bg-warning/10"
              onClick={() => setDisputeBooking(booking)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Contesta servizio
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/professional")} aria-label="Indietro">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Le mie prenotazioni</h1>
        </div>
      </header>

      {/* Service type filter */}
      {availableServiceTypes.length > 1 && (
        <div className="px-4 pt-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtra per servizio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i servizi</SelectItem>
              {availableServiceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {serviceTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="px-4 pt-4">
        <RevenueLimitBanner professionalId={professional?.id} />
      </div>

      <Tabs defaultValue="pending" className="p-4">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="pending" className="relative">
            In attesa
            {pendingBookings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {pendingBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confermate</TabsTrigger>
          <TabsTrigger value="completed">Completate</TabsTrigger>
          <TabsTrigger value="cancelled">Annullate</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <TabsContent value="pending" className="space-y-3 mt-0">
              {pendingBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                    <p className="font-medium">Nessuna richiesta in sospeso</p>
                    <p className="text-sm text-muted-foreground">
                      Sei in pari con le richieste!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingBookings.map((booking) => renderBookingCard(booking, true))
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-3 mt-0">
              {confirmedBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Nessuna prenotazione confermata</p>
                    <p className="text-sm text-muted-foreground">
                      Le prenotazioni confermate appariranno qui
                    </p>
                  </CardContent>
                </Card>
              ) : (
                confirmedBookings.map((booking) => renderBookingCard(booking))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 mt-0">
              {completedBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Nessun lavoro completato</p>
                    <p className="text-sm text-muted-foreground">
                      I lavori completati appariranno qui
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedBookings.map((booking) => renderBookingCard(booking))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-3 mt-0">
              {cancelledBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <X className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Nessuna prenotazione annullata</p>
                    <p className="text-sm text-muted-foreground">
                      Le prenotazioni annullate appariranno qui
                    </p>
                  </CardContent>
                </Card>
              ) : (
                cancelledBookings.map((booking) => renderBookingCard(booking))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rifiutare questa prenotazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Il cliente riceverà una notifica che la sua richiesta è stata
              rifiutata. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rifiuta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client Review Dialog */}
      {reviewBooking && (
        <ClientReviewForm
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          clientName={
            reviewBooking.client
              ? `${reviewBooking.client.first_name || ""} ${reviewBooking.client.last_name || ""}`.trim() || "Cliente"
              : "Cliente"
          }
          serviceName={serviceTypeLabels[reviewBooking.service_type] || reviewBooking.service_type}
          onSubmit={async (rating, comment) => {
            await createClientReview.mutateAsync({
              bookingId: reviewBooking.id,
              professionalId: professional!.id,
              clientId: reviewBooking.client_id,
              rating,
              comment,
            });
            setReviewBooking(null);
          }}
        />
      )}

      <Dialog open={!!disputeBooking} onOpenChange={(open) => !open && setDisputeBooking(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contestazione servizio</DialogTitle>
            <DialogDescription>
              Hai 5 giorni per contestare. Il pagamento resterà sospeso fino alla risoluzione.
            </DialogDescription>
          </DialogHeader>
          {user && disputeBooking && (
            <DisputeForm
              reporterId={user.id}
              reporterType="professional"
              reportedId={disputeBooking.client_id}
              reportedType="client"
              reportedName={
                disputeBooking.client
                  ? `${disputeBooking.client.first_name || ""} ${disputeBooking.client.last_name || ""}`.trim() || "Cliente"
                  : "Cliente"
              }
              bookingId={disputeBooking.id}
              onSuccess={() => {
                setDisputeBooking(null);
                toast.success("Contestazione inviata. Il pagamento è stato sospeso.");
              }}
              onCancel={() => setDisputeBooking(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
