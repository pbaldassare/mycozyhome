import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Euro,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Bell,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { it } from "date-fns/locale";
import {
  useProfessionalProfile,
  useProfessionalStats,
  useProfessionalBookings,
  useUpdateBookingStatus,
} from "@/hooks/useProfessionalData";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

function formatBookingDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Oggi";
  if (isTomorrow(date)) return "Domani";
  return format(date, "EEEE d MMM", { locale: it });
}

export default function ProfessionalHome() {
  const navigate = useNavigate();
  const { data: professional, isLoading: loadingProfile } = useProfessionalProfile();
  const { data: stats, isLoading: loadingStats } = useProfessionalStats(professional?.id);
  const { data: bookings, isLoading: loadingBookings } = useProfessionalBookings(professional?.id);
  const updateStatus = useUpdateBookingStatus();

  useEffect(() => {
    if (!loadingProfile && !professional) {
      navigate("/professional/auth");
    }
  }, [loadingProfile, professional, navigate]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professional) return null;

  const isApproved = professional.status === "approved";

  const handleAccept = (bookingId: string) => {
    updateStatus.mutate({ bookingId, status: "confirmed" });
  };

  const handleReject = (bookingId: string) => {
    updateStatus.mutate({ bookingId, status: "cancelled" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">Bentornato,</p>
            <h1 className="text-xl font-bold">{professional.first_name}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 relative"
            onClick={() => navigate("/professional/messages")}
          >
            <Bell className="h-5 w-5" />
            {(stats?.pendingRequests || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </Button>
        </div>

        {/* Status Banner */}
        {!isApproved && (
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {professional.status === "pending" && "Completa il tuo profilo"}
                {professional.status === "in_review" && "Profilo in verifica"}
              </p>
              <p className="text-xs text-primary-foreground/70">
                {professional.status === "pending" && "Per ricevere prenotazioni"}
                {professional.status === "in_review" && "Ti contatteremo presto"}
              </p>
            </div>
            {professional.status === "pending" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/professional/onboarding/personal")}
              >
                Completa
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {loadingStats ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.todayBookings || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Oggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Euro className="h-5 w-5 text-success" />
                </div>
                <div>
                  {loadingStats ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">€{stats?.weekEarnings || 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Questa settimana</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Earnings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guadagni del mese</p>
                  {loadingStats ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">€{stats?.monthEarnings || 0}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  {stats?.totalCompletedBookings || 0} servizi completati
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Prossimi Appuntamenti</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate("/professional/bookings")}
            >
              Vedi tutti
            </Button>
          </div>
          <div className="space-y-3">
            {loadingBookings ? (
              [1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : !bookings || bookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nessun appuntamento in programma</p>
                </CardContent>
              </Card>
            ) : (
              bookings.slice(0, 5).map((booking: any) => {
                const clientName = booking.client
                  ? `${booking.client.first_name || ""} ${booking.client.last_name || ""}`.trim() || "Cliente"
                  : "Cliente";
                const initials = clientName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={booking.client?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{clientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {serviceTypeLabels[booking.service_type] || booking.service_type}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            booking.status === "confirmed"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          )}
                        >
                          {booking.status === "confirmed" ? "Confermato" : "In attesa"}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatBookingDate(booking.scheduled_date)} •{" "}
                            {booking.scheduled_time_start.slice(0, 5)} -{" "}
                            {booking.scheduled_time_end.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{booking.address}</span>
                        </div>
                      </div>
                      {booking.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleReject(booking.id)}
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
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Pending Requests Alert */}
        {(stats?.pendingRequests || 0) > 0 && (
          <Card
            className="border-primary/20 bg-primary/5 cursor-pointer"
            onClick={() => navigate("/professional/bookings")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {stats?.pendingRequests} richieste in attesa
                </p>
                <p className="text-sm text-muted-foreground">
                  Rispondi per non perderle
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
