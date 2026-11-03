import { useState } from "react";
import { Search, Sparkles, Zap, ArrowRight, Wand2, Gift, Share2, CalendarClock, RotateCcw, Navigation, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { AppHeader } from "@/components/client/AppHeader";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadError } from "@/components/LoadError";
import { useFeaturedProfessionals } from "@/hooks/useProfessionals";
import { useClientBookings, type BookingWithProfessional } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { SERVICE_CATALOG, serviceLabel } from "@/lib/services";
import { SERVICE_ICONS } from "@/lib/service-icons";
import { suggestFromText } from "@/lib/smart-assistant";

type HomeBooking = BookingWithProfessional & { en_route_at?: string | null; total_hours?: number };

const initials = (b: HomeBooking) =>
  `${b.professional?.first_name?.[0] ?? ""}${b.professional?.last_name?.[0] ?? ""}`.toUpperCase();

export default function ClientHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: professionals, isLoading, isError, refetch } = useFeaturedProfessionals(5);
  const { data: bookings } = useClientBookings();
  const [wish, setWish] = useState("");

  const userName = profile?.first_name || "Utente";
  const all = (bookings ?? []) as HomeBooking[];
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const next = all
    .filter((b) => ["pending", "confirmed"].includes(b.status) && b.scheduled_date >= todayStr)
    .sort((a, b) => (a.scheduled_date + a.scheduled_time_start).localeCompare(b.scheduled_date + b.scheduled_time_start))[0];

  // Lista già ordinata per data decrescente: il primo di ogni coppia professionista+servizio è il più recente.
  const seen = new Set<string>();
  const rebook = all
    .filter((b) => b.status === "completed" && b.professional)
    .filter((b) => {
      const key = `${b.professional!.id}:${b.service_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);

  const askAssistant = () => {
    const s = suggestFromText(wish);
    if (!s) {
      toast.error("Non ho capito il servizio: prova con parole come pulizia, stiro, cane, giardino…");
      return;
    }
    navigate(`/client/book?${new URLSearchParams({ service: s.service_type, hours: String(s.hours), notes: s.notes })}`);
  };

  const invite = async () => {
    const url = window.location.origin;
    const text = "Uso MyCozyHome per pulizie, stiro e pet sitting: prova anche tu!";
    try {
      if (navigator.share) await navigator.share({ title: "MyCozyHome", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link copiato: incollalo dove vuoi");
      }
    } catch {
      // Condivisione annullata dall'utente.
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showAddress showNotifications />

      <div className="px-4 py-6 space-y-7">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ciao {userName}! 👋</h1>
          <p className="text-muted-foreground mt-1">Di cosa hai bisogno oggi?</p>
        </div>

        {/* Ricerca */}
        <button
          onClick={() => navigate("/client/search")}
          className="w-full flex items-center gap-3 h-14 px-4 rounded-2xl bg-card border border-border/60 shadow-soft text-muted-foreground text-left"
        >
          <Search className="h-5 w-5" />
          Cerca un servizio o professionista…
        </button>

        {/* Prenotazione rapida */}
        <button
          onClick={() => navigate("/client/book")}
          className="w-full text-left rounded-3xl bg-brand-gradient text-primary-foreground p-5 shadow-lg shadow-primary/30 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <Zap className="h-4 w-4" /> Nuovo
          </div>
          <p className="text-2xl font-bold mt-1">Prenota in 30 secondi</p>
          <p className="text-sm opacity-90 mt-1">Scegli servizio e orario: ti mostriamo chi è libero, con il prezzo finale.</p>
          <span className="mt-4 inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-2xl px-4 py-2.5">
            Inizia ora <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        {/* Prossimo appuntamento */}
        {next && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" /> Prossimo appuntamento
            </h2>
            <button
              onClick={() => navigate(`/client/booking/${next.id}`)}
              className="w-full text-left rounded-3xl bg-card border border-border/60 shadow-soft p-4 flex items-center gap-3"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={next.professional?.avatar_url ?? ""} />
                <AvatarFallback className="bg-primary-light text-primary font-semibold">{initials(next)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{serviceLabel(next.service_type)}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {format(parseISO(next.scheduled_date), "EEE d MMM", { locale: it })} · {next.scheduled_time_start.slice(0, 5)} ·{" "}
                  {next.professional?.first_name}
                </p>
              </div>
              {next.en_route_at ? (
                <span className="status-badge bg-success/10 text-success gap-1">
                  <Navigation className="h-3 w-3" /> In viaggio
                </span>
              ) : (
                <span className="status-badge bg-primary-light text-primary">
                  {next.status === "confirmed" ? "Confermato" : "In attesa"}
                </span>
              )}
            </button>
          </section>
        )}

        {/* Assistente */}
        <section className="rounded-3xl bg-card border border-border/60 shadow-soft p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
              <Wand2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">Descrivi cosa ti serve</h2>
              <p className="text-xs text-muted-foreground">Scegliamo noi servizio e durata</p>
            </div>
          </div>
          <Textarea
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            placeholder="Es. trilocale con cane, pulizia dopo il trasloco"
            className="rounded-2xl bg-background min-h-[72px]"
            maxLength={500}
          />
          <Button className="w-full" onClick={askAssistant} disabled={!wish.trim()}>
            Trova il servizio giusto <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        {/* Prenota di nuovo */}
        {rebook.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" /> Prenota di nuovo
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {rebook.map((b) => (
                <button
                  key={b.id}
                  onClick={() =>
                    navigate(`/client/booking/new?professional=${b.professional!.id}&service=${b.service_type}&duration=${b.total_hours ?? 2}`)
                  }
                  className="snap-start shrink-0 w-40 rounded-3xl bg-card border border-border/60 shadow-soft p-4 text-left"
                >
                  <Avatar className="h-11 w-11 mb-2">
                    <AvatarImage src={b.professional?.avatar_url ?? ""} />
                    <AvatarFallback className="bg-primary-light text-primary font-semibold">{initials(b)}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm truncate">{b.professional?.first_name} {b.professional?.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{serviceLabel(b.service_type)}</p>
                  <p className="text-xs font-semibold text-primary mt-2">Riprenota →</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Categorie */}
        <section>
          <h2 className="text-lg font-bold mb-3">Servizi per ogni esigenza</h2>
          <div className="grid grid-cols-3 gap-3">
            {SERVICE_CATALOG.map((s) => {
              const Icon = SERVICE_ICONS[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/client/book?service=${s.id}`)}
                  className="rounded-3xl bg-card border border-border/60 shadow-soft p-3 flex flex-col items-center gap-2 text-center"
                >
                  <span className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Promo + invita */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/client/promotions")}
            className="rounded-3xl p-4 text-left bg-straw-light border border-straw/40 shadow-soft"
          >
            <Gift className="h-6 w-6 text-straw-dark" />
            <p className="font-bold mt-2">Promozioni</p>
            <p className="text-xs text-muted-foreground">Codici sconto attivi</p>
          </button>
          <button onClick={invite} className="rounded-3xl p-4 text-left bg-sage-light border border-sage/40 shadow-soft">
            <Share2 className="h-6 w-6 text-sage-dark" />
            <p className="font-bold mt-2">Invita un amico</p>
            <p className="text-xs text-muted-foreground">Condividi MyCozyHome</p>
          </button>
        </div>

        {/* Consigliati */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" /> Consigliati per te
            </h2>
            <button className="text-sm text-primary font-medium" onClick={() => navigate("/client/search")}>
              Vedi tutti
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <LoadError onRetry={() => refetch()} message="Impossibile caricare i professionisti." />
          ) : professionals && professionals.length > 0 ? (
            <div className="space-y-3">
              {professionals.map((pro) => (
                <ProfessionalCard
                  key={pro.id}
                  id={pro.id}
                  name={pro.name}
                  avatarUrl={pro.avatarUrl ?? undefined}
                  rating={pro.rating}
                  reviewCount={pro.reviewCount}
                  yearsExperience={pro.yearsExperience}
                  services={pro.services}
                  hourlyRate={pro.hourlyRate}
                  isVerified={pro.isVerified}
                  showFavorite
                  onClick={() => navigate(`/client/professional/${pro.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Nessun professionista disponibile al momento</p>
          )}
        </section>
      </div>
    </div>
  );
}
