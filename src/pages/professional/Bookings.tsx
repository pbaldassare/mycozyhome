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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientReviewForm } from "@/components/professional/ClientReviewForm";
import { useCreateClientReview, useCanReviewClient } from "@/hooks/useClientReviews";
import { useProfessionalFavorites } from "@/hooks/useProfessionalFavorites";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

function formatBookingDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Oggi";
  if (isTomorrow(date)) return "Domani";
  return format(date, "EEEE d MMMM", { locale: it });
}

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

      // Fetch client details separately
      const bookingsWithClients = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: client } = await supabase
            .from("client_profiles")
            .select("first_name, last_name, avatar_url, phone, average_rating, review_count")
            .eq("user_id", booking.client_id)
            .single();

          return { ...booking, client };
        })
      );

      return bookingsWithClients;
    },
    enabled: !!professionalId,
  });
}

export default function ProfessionalBookings() {
  const navigate = useNavigate();
  const { data: professional } = useProfessionalProfile();
  const { data: bookings, isLoading } = useAllProfessionalBookings(professional?.id);
  const updateStatus = useUpdateBookingStatus();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const createClientReview = useCreateClientReview();
  const { isFavorite, toggleFavorite } = useProfessionalFavorites();

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
    (b) => b.status === "confirmed" && !isPast(parseISO(b.scheduled_date))
  );
  const completedBookings = filteredBookings.filter((b) => b.status === "completed");
  const cancelledBookings = filteredBookings.filter((b) => b.status === "cancelled");

  const renderBookingCard = (booking: any, showActions: boolean = false) => {
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
          {booking.status === "confirmed" && booking.client?.phone && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`tel:${booking.client.phone}`)}
              >
                <Phone className="h-4 w-4 mr-1" />
                Chiama
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/professional/messages`)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Messaggia
              </Button>
            </div>
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
            </div>
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
            onClick={() => navigate("/professional")}
          >
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
    </div>
  );
}
