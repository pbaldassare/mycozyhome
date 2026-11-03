import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Euro,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Bell,
  BellRing,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Flame,
  Gift,
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
import { useAuth } from "@/hooks/useAuth";
import { getProfessionalLevel } from "@/lib/professional-level";
import { RevenueLimitBanner } from "@/components/professional/RevenueLimitBanner";
import { useHotZones, useWeekTips } from "@/hooks/useProHomeData";
import { SERVICE_LABELS as serviceTypeLabels } from "@/lib/services";
import { LoadError } from "@/components/LoadError";

function formatBookingDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Oggi";
  if (isTomorrow(date)) return "Domani";
  return format(date, "EEEE d MMM", { locale: it });
}

// Prima di accettare basta la zona: l'ultima parte dell'indirizzo (CAP e città).
function areaOf(address: string): string {
  return address.split(",").slice(-2).join(",").trim() || address;
}

export default function ProfessionalHome() {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();
  const { data: professional, isLoading: loadingProfile } = useProfessionalProfile();
  const { data: stats, isLoading: loadingStats } = useProfessionalStats(professional?.id);
  const { data: bookings, isLoading: loadingBookings, isError: bookingsError, refetch: refetchBookings } = useProfessionalBookings(professional?.id);
  const updateStatus = useUpdateBookingStatus();
  const { data: weekTips = 0 } = useWeekTips(user?.id);
  const { data: hotZones } = useHotZones(professional?.status === "approved");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/professional/auth", { replace: true });
      return;
    }
    if (role && role !== "professional") {
      navigate(role === "admin" ? "/admin" : "/client", { replace: true });
      return;
    }
    if (!loadingProfile && !professional && role === "professional") {
      navigate("/professional/onboarding/personal", { replace: true });
    }
  }, [authLoading, user, role, loadingProfile, professional, navigate]);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professional) return null;

  const isApproved = professional.status === "approved";
  const levelInfo = getProfessionalLevel(
    professional.average_rating || 0,
    professional.years_experience || 0,
    professional.review_count || 0
  );
  const LevelIcon = levelInfo.icon;

  const todayBookings = (bookings ?? []).filter((b) => isToday(parseISO(b.scheduled_date)));
  const laterBookings = (bookings ?? []).filter((b) => !isToday(parseISO(b.scheduled_date)));

  const clientNameOf = (b: NonNullable<typeof bookings>[number]) =>
    b.client ? `${b.client.first_name || ""} ${b.client.last_name || ""}`.trim() || "Cliente" : "Cliente";

  const renderActions = (bookingId: string) => (
    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={() => updateStatus.mutate({ bookingId, status: "cancelled" })}
        disabled={updateStatus.isPending}
      >
        <X className="h-4 w-4" />
        Rifiuta
      </Button>
      <Button
        size="sm"
        className="flex-1"
        onClick={() => updateStatus.mutate({ bookingId, status: "confirmed" })}
        disabled={updateStatus.isPending}
      >
        <CheckCircle className="h-4 w-4" />
        Accetta
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-brand-gradient text-primary-foreground px-4 pt-5 pb-6 rounded-b-[2rem] shadow-lg shadow-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">Bentornato,</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{professional.first_name}</h1>
              <span className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold", levelInfo.bgClass, levelInfo.colorClass)}>
                <LevelIcon className="h-3.5 w-3.5" />
                {levelInfo.label}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground relative"
            onClick={() => navigate("/professional/bookings")}
            aria-label="Richieste in attesa"
          >
            <Bell className="h-5 w-5" />
            {(stats?.pendingRequests || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </Button>
        </div>

        {!isApproved && (
          <div className="bg-white/15 rounded-2xl p-3 flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {professional.status === "pending" && "Completa il tuo profilo"}
                {professional.status === "in_review" && "Profilo in verifica"}
              </p>
              <p className="text-xs text-primary-foreground/80">
                {professional.status === "pending" && "Per ricevere prenotazioni"}
                {professional.status === "in_review" && "Ti contatteremo presto"}
              </p>
            </div>
            {professional.status === "pending" && (
              <Button size="sm" variant="secondary" onClick={() => navigate("/professional/onboarding/personal")}>
                Completa
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-3">
            <Calendar className="h-4 w-4 mb-1 opacity-80" />
            {loadingStats ? (
              <Skeleton className="h-7 w-10 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{stats?.todayBookings || 0}</p>
            )}
            <p className="text-xs text-primary-foreground/80">Appuntamenti oggi</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <Euro className="h-4 w-4 mb-1 opacity-80" />
            {loadingStats ? (
              <Skeleton className="h-7 w-16 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">€{((stats?.weekEarnings || 0) + weekTips).toFixed(0)}</p>
            )}
            <p className="text-xs text-primary-foreground/80">
              Questa settimana{weekTips > 0 && ` · €${weekTips.toFixed(0)} di mance`}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <RevenueLimitBanner professionalId={professional.id} />

        {notifPermission === "default" && (
          <Card className="border-primary/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center shrink-0">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Non perdere nessun lavoro</p>
                <p className="text-xs text-muted-foreground">Attiva le notifiche per le nuove prenotazioni</p>
              </div>
              <Button size="sm" onClick={() => Notification.requestPermission().then(setNotifPermission)}>
                Attiva
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Agenda di oggi */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Agenda di oggi</h2>
            <span className="text-sm text-muted-foreground capitalize">
              {format(new Date(), "EEEE d MMMM", { locale: it })}
            </span>
          </div>
          {loadingBookings ? (
            <Skeleton className="h-28 w-full rounded-3xl" />
          ) : bookingsError ? (
            <LoadError onRetry={() => refetchBookings()} message="Impossibile caricare gli appuntamenti." />
          ) : todayBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nessun appuntamento oggi</p>
              </CardContent>
            </Card>
          ) : (
            <ol className="relative border-l-2 border-primary/20 ml-2 space-y-4">
              {todayBookings.map((booking) => (
                <li key={booking.id} className="relative ml-5">
                  <span
                    className={cn(
                      "absolute -left-[29px] top-5 w-4 h-4 rounded-full border-2 border-background",
                      booking.status === "confirmed" ? "bg-success" : "bg-warning",
                    )}
                  />
                  <Card className="cursor-pointer" onClick={() => navigate("/professional/bookings")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {booking.scheduled_time_start.slice(0, 5)}
                          <span className="text-sm font-medium text-muted-foreground">
                            {" "}– {booking.scheduled_time_end.slice(0, 5)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            booking.status === "confirmed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                          )}
                        >
                          {booking.status === "confirmed" ? "Confermato" : "Da accettare"}
                        </span>
                      </div>
                      <p className="font-semibold mt-1">
                        {serviceTypeLabels[booking.service_type] || booking.service_type} · {clientNameOf(booking)}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{areaOf(booking.address)}</span>
                      </p>
                      {booking.status === "pending" && renderActions(booking.id)}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Prossimi giorni */}
        {laterBookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Prossimi giorni</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/professional/bookings")}>
                Vedi tutti
              </Button>
            </div>
            <div className="space-y-3">
              {laterBookings.slice(0, 4).map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {serviceTypeLabels[booking.service_type] || booking.service_type} · {clientNameOf(booking)}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="capitalize">{formatBookingDate(booking.scheduled_date)}</span>
                          {" · "}{booking.scheduled_time_start.slice(0, 5)}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{areaOf(booking.address)}</span>
                        </p>
                      </div>
                      <span className="font-bold shrink-0">€{Number(booking.total_amount).toFixed(0)}</span>
                    </div>
                    {booking.status === "pending" && renderActions(booking.id)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Zone calde */}
        {isApproved && !!hotZones?.length && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="h-5 w-5 text-destructive" />
                Zone calde
              </h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/professional/service-board")}>
                Bacheca richieste
              </Button>
            </div>
            <Card>
              <CardContent className="p-2">
                {hotZones.map((z) => (
                  <button
                    key={z.city}
                    className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-primary-light text-left"
                    onClick={() => navigate("/professional/service-board")}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center font-bold text-primary shrink-0">
                      {z.count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{z.city}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {z.services.map((s) => serviceTypeLabels[s] || s).join(", ")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Guadagni del mese */}
        <Card
          role="link"
          tabIndex={0}
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/professional/earnings")}
          onKeyDown={(e) => e.key === "Enter" && navigate("/professional/earnings")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center">
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
                <span className="text-xs text-muted-foreground">{stats?.totalCompletedBookings || 0} servizi completati</span>
                <span className="block text-xs font-medium text-primary mt-1">Incassi e prelievi →</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {weekTips > 0 && (
          <div className="flex items-center gap-3 rounded-3xl bg-success/10 p-4 text-success">
            <Gift className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Questa settimana i clienti ti hanno lasciato €{weekTips.toFixed(2)} di mance. Ottimo lavoro!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
