import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  status: string;
  avatar_url: string | null;
  average_rating: number | null;
  review_count: number | null;
}

// Mock data for dashboard
const mockStats = {
  todayBookings: 3,
  weekEarnings: 485,
  monthEarnings: 1850,
  pendingRequests: 2,
};

const mockUpcomingBookings = [
  {
    id: "1",
    clientName: "Maria Rossi",
    service: "Pulizia Casa",
    date: "Oggi",
    time: "14:00 - 17:00",
    address: "Via Roma 123, Milano",
    status: "confirmed",
  },
  {
    id: "2",
    clientName: "Luigi Bianchi",
    service: "Stiratura",
    date: "Domani",
    time: "09:00 - 12:00",
    address: "Corso Vittorio 45, Milano",
    status: "pending",
  },
];

export default function ProfessionalHome() {
  const navigate = useNavigate();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      const { data: prof } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (prof) {
        setProfessional(prof as Professional);
      } else {
        navigate("/professional/onboarding/personal");
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!professional) return null;

  const isApproved = professional.status === "approved";

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
          >
            <Bell className="h-5 w-5" />
            {mockStats.pendingRequests > 0 && (
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
              <ChevronRight className="h-5 w-5" />
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
                  <p className="text-2xl font-bold">{mockStats.todayBookings}</p>
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
                  <p className="text-2xl font-bold">€{mockStats.weekEarnings}</p>
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
                  <p className="text-2xl font-bold">€{mockStats.monthEarnings}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                  +12% vs mese scorso
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Prossimi Appuntamenti</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Vedi tutti
            </Button>
          </div>
          <div className="space-y-3">
            {mockUpcomingBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{booking.clientName}</h3>
                      <p className="text-sm text-muted-foreground">{booking.service}</p>
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
                      <span>{booking.date} • {booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.address}</span>
                    </div>
                  </div>
                  {booking.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        Rifiuta
                      </Button>
                      <Button size="sm" className="flex-1">
                        Accetta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pending Requests Alert */}
        {mockStats.pendingRequests > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {mockStats.pendingRequests} richieste in attesa
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
