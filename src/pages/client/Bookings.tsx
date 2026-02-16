import { Calendar, Clock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/client/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useClientBookings, BookingWithProfessional } from "@/hooks/useBookings";
import { format, isPast, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const statusConfig = {
  pending: { label: "In attesa", className: "bg-warning/10 text-warning" },
  confirmed: { label: "Confermato", className: "bg-success/10 text-success" },
  completed: { label: "Completato", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annullato", className: "bg-destructive/10 text-destructive" },
};

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

interface BookingCardProps {
  booking: BookingWithProfessional;
  onClick?: () => void;
}

function BookingCard({ booking, onClick }: BookingCardProps) {
  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
  const professionalName = booking.professional 
    ? `${booking.professional.first_name} ${booking.professional.last_name}`
    : "Professionista";
  const initials = professionalName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const formattedDate = format(parseISO(booking.scheduled_date), "d MMM", { locale: it });
  const timeRange = `${booking.scheduled_time_start.slice(0, 5)} - ${booking.scheduled_time_end.slice(0, 5)}`;

  return (
    <button
      onClick={onClick}
      className="trust-card w-full text-left hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={booking.professional?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">
              {serviceTypeLabels[booking.service_type] || booking.service_type}
            </h3>
            <Badge className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-0.5">
            {professionalName}
          </p>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeRange}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{booking.address}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">€{Number(booking.total_amount).toFixed(0)}</span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

export default function ClientBookings() {
  const navigate = useNavigate();
  const { data: bookings, isLoading } = useClientBookings();

  const upcomingBookings = bookings?.filter(b => 
    !isPast(parseISO(b.scheduled_date)) && 
    b.status !== "completed" && 
    b.status !== "cancelled"
  ) || [];

  const pastBookings = bookings?.filter(b => 
    isPast(parseISO(b.scheduled_date)) || 
    b.status === "completed" || 
    b.status === "cancelled"
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Prenotazioni" showNotifications />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Prenotazioni" showNotifications />

      <div className="px-4 py-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="upcoming" className="flex-1 rounded-lg">
              In arrivo ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 rounded-lg">
              Passate ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => navigate(`/client/booking/${booking.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">Nessuna prenotazione</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Le tue prossime prenotazioni appariranno qui
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-3">
            {pastBookings.length > 0 ? (
              pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => navigate(`/client/booking/${booking.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">Nessuna prenotazione passata</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Lo storico delle tue prenotazioni apparirà qui
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
