import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { Star, MapPin, Loader2, Navigation, Zap, SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/client/AppHeader";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useClientAddress } from "@/hooks/useClientAddress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/LoadError";
import { SERVICE_CATALOG, serviceLabel, type ServiceType } from "@/lib/services";
import { SERVICE_ICONS } from "@/lib/service-icons";
import { cn } from "@/lib/utils";

const TIMES = Array.from({ length: 12 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`); // 08:00–19:00
const HOURS = [1, 2, 3, 4, 5, 6, 8];
const LAST_START = 19;

/** Prossima ora piena di oggi, o domani alle 9 se è troppo tardi. */
function asap(): { date: Date; time: string } {
  const now = new Date();
  const h = now.getHours() + 1;
  if (h >= 8 && h <= LAST_START) return { date: startOfDay(now), time: `${String(h).padStart(2, "0")}:00` };
  return { date: h < 8 ? startOfDay(now) : addDays(startOfDay(now), 1), time: h < 8 ? "08:00" : "09:00" };
}

type When = "asap" | "today" | "tomorrow" | "pick";

const chip = (active: boolean) =>
  cn(
    "px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all whitespace-nowrap",
    active ? "bg-brand-gradient text-primary-foreground border-transparent shadow-md shadow-primary/25" : "bg-card border-border/60 text-foreground hover:bg-primary-light",
  );

export default function QuickBook() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialService = SERVICE_CATALOG.some((s) => s.id === params.get("service")) ? (params.get("service") as ServiceType) : null;
  const initialHours = Number(params.get("hours"));
  const notes = params.get("notes") ?? "";

  const [service, setService] = useState<ServiceType | null>(initialService);
  const [when, setWhen] = useState<When>("asap");
  const [date, setDate] = useState<Date>(() => asap().date);
  const [time, setTime] = useState<string>(() => asap().time);
  const [hours, setHours] = useState<number>(initialHours >= 1 && initialHours <= 8 ? initialHours : 2);
  const { address: savedAddress } = useClientAddress();
  const [address, setAddress] = useState<{ text: string; lat: number; lng: number } | null>(null);
  // Precompila con l'indirizzo salvato nel profilo.
  useEffect(() => {
    if (savedAddress && !address) setAddress(savedAddress);
  }, [savedAddress, address]);
  const [locating, setLocating] = useState(false);

  const today = startOfDay(new Date());
  const isToday = date.getTime() === today.getTime();
  const times = isToday ? TIMES.filter((t) => Number(t.slice(0, 2)) > new Date().getHours()) : TIMES;

  const pickWhen = (w: When) => {
    setWhen(w);
    if (w === "asap") {
      const a = asap();
      setDate(a.date);
      setTime(a.time);
    } else if (w === "today") setDate(today);
    else if (w === "tomorrow") setDate(addDays(today, 1));
  };

  const useMyPosition = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setAddress({ text: "", lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const dateStr = format(date, "yyyy-MM-dd");
  const ready = !!service && times.includes(time);

  const { data: pros, isLoading, isError, refetch } = useQuery({
    queryKey: ["available-professionals", service, dateStr, time, hours, address?.lat, address?.lng],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("available_professionals", {
        p_service_type: service!,
        p_date: dateStr,
        p_time_start: time,
        p_hours: hours,
        p_latitude: address?.lat,
        p_longitude: address?.lng,
      });
      if (error) throw error;
      return data;
    },
    enabled: ready,
  });

  const goToConfirm = (proId: string) => {
    const q = new URLSearchParams({
      professional: proId,
      service: service!,
      date: dateStr,
      time,
      duration: String(hours),
    });
    if (address?.text) q.set("address", address.text);
    if (address) {
      q.set("lat", String(address.lat));
      q.set("lng", String(address.lng));
    }
    if (notes) q.set("notes", notes);
    navigate(`/client/booking/confirm?${q}`);
  };

  const whenLabel = useMemo(
    () => `${isToday ? "Oggi" : format(date, "EEEE d MMMM", { locale: it })} alle ${time}`,
    [date, time, isToday],
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title="Prenota in 30 secondi" showBack />

      <div className="px-4 py-5 space-y-7">
        {notes && (
          <div className="rounded-2xl bg-primary-light p-3 text-sm text-primary">
            Abbiamo capito: <span className="font-semibold">{service ? serviceLabel(service) : "—"}</span>, circa {hours}h. Puoi cambiare tutto qui sotto.
          </div>
        )}

        {/* 1. Servizio */}
        <section>
          <h2 className="text-lg font-bold mb-3">1. Di cosa hai bisogno?</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {SERVICE_CATALOG.map((s) => {
              const Icon = SERVICE_ICONS[s.id];
              const active = service === s.id;
              return (
                <button
                  key={s.id}
                  ref={active ? (el) => el?.scrollIntoView({ inline: "center", block: "nearest" }) : undefined}
                  onClick={() => setService(s.id)}
                  className={cn(
                    "snap-start shrink-0 w-28 rounded-3xl p-3 flex flex-col items-center gap-2 text-center border transition-all shadow-soft",
                    active ? "border-primary ring-2 ring-primary bg-card" : "border-border/60 bg-card",
                  )}
                >
                  <span className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", active ? "bg-brand-gradient text-primary-foreground" : "bg-primary-light text-primary")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Quando */}
        <section>
          <h2 className="text-lg font-bold mb-3">2. Quando?</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <button className={chip(when === "asap")} onClick={() => pickWhen("asap")}>
              <Zap className="inline h-4 w-4 mr-1 -mt-0.5" />
              Appena possibile
            </button>
            <button className={chip(when === "today")} onClick={() => pickWhen("today")}>Oggi</button>
            <button className={chip(when === "tomorrow")} onClick={() => pickWhen("tomorrow")}>Domani</button>
            <label className={cn(chip(when === "pick"), "relative cursor-pointer")}>
              {when === "pick" ? format(date, "d MMM", { locale: it }) : "Scegli data"}
              <input
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer"
                min={format(today, "yyyy-MM-dd")}
                max={format(addDays(today, 60), "yyyy-MM-dd")}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setWhen("pick");
                  setDate(startOfDay(new Date(`${e.target.value}T00:00`)));
                }}
              />
            </label>
          </div>
          {when !== "asap" && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {times.map((t) => (
                <button key={t} className={chip(time === t)} onClick={() => setTime(t)}>{t}</button>
              ))}
              {times.length === 0 && <p className="col-span-4 text-sm text-muted-foreground">Per oggi è tardi: scegli domani.</p>}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-2 first-letter:uppercase">{whenLabel}</p>
        </section>

        {/* 3. Durata */}
        <section>
          <h2 className="text-lg font-bold mb-3">3. Per quanto tempo?</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {HOURS.map((h) => (
              <button key={h} className={chip(hours === h)} onClick={() => setHours(h)}>{h} {h === 1 ? "ora" : "ore"}</button>
            ))}
          </div>
        </section>

        {/* 4. Dove */}
        <section>
          <h2 className="text-lg font-bold mb-3">4. Dove?</h2>
          <AddressAutocomplete
            value={address?.text}
            placeholder="Via, numero civico, città"
            onSelect={(r) => setAddress({ text: r.formatted_address, lat: r.latitude, lng: r.longitude })}
          />
          <button onClick={useMyPosition} className="mt-2 text-sm font-medium text-primary inline-flex items-center gap-1.5">
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            {address && !address.text ? "Uso la tua posizione" : "Usa la mia posizione"}
          </button>
        </section>

        {/* 5. Risultati */}
        <section>
          <h2 className="text-lg font-bold mb-3">Disponibili per te</h2>
          {!ready ? (
            <p className="text-sm text-muted-foreground">Scegli servizio e orario per vedere chi è libero.</p>
          ) : isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : isError ? (
            <LoadError onRetry={() => refetch()} message="Impossibile cercare i professionisti disponibili." />
          ) : !pros?.length ? (
            <div className="rounded-3xl bg-card shadow-soft border border-border/60 p-6 text-center space-y-3">
              <SearchX className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-semibold">Nessuno è libero in questo orario</p>
              <p className="text-sm text-muted-foreground">Prova un altro orario o un altro giorno, oppure pubblica una richiesta e ricevi offerte.</p>
              <Button variant="outline" onClick={() => navigate("/client/service-requests/new")}>Pubblica una richiesta</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pros.map((p) => {
                const total = Math.round(p.hourly_rate * hours * 100) / 100;
                const tooShort = (p.min_hours ?? 1) > hours;
                return (
                  <button
                    key={p.id}
                    onClick={() => goToConfirm(p.id)}
                    disabled={tooShort}
                    className="w-full text-left rounded-3xl bg-card shadow-soft border border-border/60 p-4 flex items-center gap-3 disabled:opacity-50 active:scale-[0.99] transition-transform"
                  >
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={p.avatar_url ?? ""} />
                      <AvatarFallback className="bg-primary-light text-primary font-semibold">
                        {`${p.first_name[0] ?? ""}${p.last_name[0] ?? ""}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{p.first_name} {p.last_name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          {Number(p.average_rating ?? 0).toFixed(1)} ({p.review_count ?? 0})
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5" />
                          {p.distance_km != null ? `${p.distance_km} km` : p.city}
                        </span>
                      </div>
                      {p.min_package_price != null && (
                        <p className="text-xs text-primary font-medium mt-0.5">Pacchetti da €{p.min_package_price}</p>
                      )}
                      {tooShort && <p className="text-xs text-muted-foreground mt-0.5">Minimo {p.min_hours} ore</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">€{total}</p>
                      <p className="text-xs text-muted-foreground">{hours}h · €{p.hourly_rate}/h</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
