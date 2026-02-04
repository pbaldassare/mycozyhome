import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/client/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const mockBookings = {
  upcoming: [
    {
      id: "1",
      professional: { name: "Maria Rossi", avatar: "" },
      service: "Pulizie casa",
      date: "2026-02-06",
      time: "09:00 - 12:00",
      address: "Via Roma 123, Milano",
      status: "confirmed",
      price: 45,
    },
    {
      id: "2",
      professional: { name: "Giuseppe Bianchi", avatar: "" },
      service: "Sanificazione",
      date: "2026-02-10",
      time: "14:00 - 16:00",
      address: "Via Garibaldi 45, Milano",
      status: "pending",
      price: 36,
    },
  ],
  past: [
    {
      id: "3",
      professional: { name: "Anna Verdi", avatar: "" },
      service: "Babysitter",
      date: "2026-01-28",
      time: "18:00 - 22:00",
      address: "Via Dante 78, Milano",
      status: "completed",
      price: 48,
    },
  ],
};

const statusConfig = {
  pending: { label: "In attesa", className: "bg-warning/10 text-warning" },
  confirmed: { label: "Confermato", className: "bg-success/10 text-success" },
  completed: { label: "Completato", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annullato", className: "bg-destructive/10 text-destructive" },
};

interface BookingCardProps {
  booking: (typeof mockBookings.upcoming)[0];
  onClick?: () => void;
}

function BookingCard({ booking, onClick }: BookingCardProps) {
  const status = statusConfig[booking.status as keyof typeof statusConfig];
  const initials = booking.professional.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <button
      onClick={onClick}
      className="trust-card w-full text-left hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={booking.professional.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">{booking.service}</h3>
            <Badge className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-0.5">
            {booking.professional.name}
          </p>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(booking.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{booking.time}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{booking.address}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">€{booking.price}</span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

export default function ClientBookings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Prenotazioni" showNotifications />

      <div className="px-4 py-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="upcoming" className="flex-1 rounded-lg">
              In arrivo
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 rounded-lg">
              Passate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {mockBookings.upcoming.length > 0 ? (
              mockBookings.upcoming.map((booking) => (
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
            {mockBookings.past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => navigate(`/client/booking/${booking.id}`)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
