import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { it } from "date-fns/locale";
import { 
  MapPin, Calendar, Clock, User, CreditCard, 
  CheckCircle2, AlertCircle, Loader2, Tag, Repeat
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_PROFESSIONAL_COLUMNS } from "@/lib/professional-columns";
import { AppHeader } from "@/components/client/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { assertNotPlatformBlocked } from "@/lib/platform-block";
import { useClientWallet } from "@/hooks/useWallet";
import { z } from "zod";
import { toUserMessage } from "@/lib/errors";
import { PROMO_STORAGE_KEY } from "@/lib/promo";
import { cn } from "@/lib/utils";


import { SERVICE_LABELS as serviceTypeLabels, type ServiceType } from "@/lib/services";
const addressSchema = z.string().trim().min(10, "Inserisci un indirizzo completo").max(200, "Indirizzo troppo lungo");
const promoCodeSchema = z.string().trim().max(20, "Codice promozionale troppo lungo").optional();
const notesSchema = z.string().trim().max(500, "Note troppo lunghe").optional();

export default function BookingConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isBlocked } = useAuth();
  const { data: wallet } = useClientWallet();
  
  const professionalId = searchParams.get("professional");
  const serviceType = searchParams.get("service");
  const dateStr = searchParams.get("date");
  const time = searchParams.get("time");
  const packageId = searchParams.get("package");
  const durationParam = Number(searchParams.get("duration")) || 2;
  // Posizione passata dalla prenotazione rapida (facoltativa).
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const latitude = latParam ? Number(latParam) : null;
  const longitude = lngParam ? Number(lngParam) : null;

  const [address, setAddress] = useState(searchParams.get("address") ?? "");
  const [notes, setNotes] = useState(searchParams.get("notes") ?? "");
  // 0 = una volta sola; altrimenti ogni N settimane per `repeatCount` appuntamenti.
  const [everyWeeks, setEveryWeeks] = useState(0);
  const [repeatCount, setRepeatCount] = useState(4);
  const [promoCode, setPromoCode] = useState(() => {
    try {
      return sessionStorage.getItem(PROMO_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [addressError, setAddressError] = useState<string | null>(null);

  const date = dateStr ? parse(dateStr, "yyyy-MM-dd", new Date()) : null;

  const { data: professional, isLoading: loadingProfessional } = useQuery({
    queryKey: ["professional", professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select(PUBLIC_PROFESSIONAL_COLUMNS)
        .eq("id", professionalId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ["professional-service", professionalId, serviceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId!)
        .eq("service_type", serviceType as ServiceType)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId && !!serviceType,
  });

  const { data: pkg, isLoading: loadingPackage } = useQuery({
    queryKey: ["service-package", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", packageId!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!packageId,
  });

  // Il pacchetto fissa durata e prezzo; il DB ricalcola comunque tutto.
  const duration = pkg ? Number(pkg.hours) : durationParam;
  const totalAmount = pkg ? Number(pkg.price) : service ? service.hourly_rate * duration : 0;
  const finalAmount = totalAmount - discount;
  const appointments = everyWeeks ? repeatCount : 1;
  // Lo sconto promo vale solo sul primo appuntamento della serie.
  const seriesAmount = finalAmount + totalAmount * (appointments - 1);
  const walletBalance = wallet?.balance ?? 0;
  const hasEnoughCredits = walletBalance >= seriesAmount;

  const getEndTime = () => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const end = hours * 60 + minutes + Math.round(duration * 60);
    return `${Math.floor(end / 60).toString().padStart(2, "0")}:${(end % 60).toString().padStart(2, "0")}`;
  };

  const applyPromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    // Il DB valida il codice; lo sconto finale lo ricalcola create_booking.
    const { data: percent, error } = await supabase.rpc("validate_promo_code", { p_code: code });
    if (error || !percent) {
      setDiscount(0);
      setPromoApplied(false);
      toast({
        title: "Codice non valido",
        description: toUserMessage(error, "Il codice promozionale inserito non è valido"),
        variant: "destructive",
      });
      return;
    }
    setDiscount(Math.round(totalAmount * percent) / 100);
    setPromoApplied(true);
    toast({
      title: "Codice applicato!",
      description: `Sconto del ${percent}% applicato al tuo ordine`,
    });
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      assertNotPlatformBlocked(isBlocked);
      // Validate inputs
      const addressResult = addressSchema.safeParse(address);
      if (!addressResult.success) {
        setAddressError(addressResult.error.errors[0].message);
        throw new Error(addressResult.error.errors[0].message);
      }
      setAddressError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Devi effettuare l'accesso per prenotare");
      }

      // Prezzo, sconto e stato li calcola il DB.
      const common = {
        p_professional_id: professionalId!,
        p_service_type: serviceType!,
        p_time_start: time!,
        p_hours: duration,
        p_address: address.trim(),
        p_notes: notes.trim() || undefined,
        p_promo_code: promoApplied ? promoCode.trim().toUpperCase() : undefined,
        p_latitude: latitude ?? undefined,
        p_longitude: longitude ?? undefined,
        p_package_id: packageId ?? undefined,
      };
      if (everyWeeks) {
        const { error } = await supabase.rpc("create_booking_series", {
          ...common,
          p_first_date: dateStr!,
          p_every_weeks: everyWeeks,
          p_count: repeatCount,
        });
        if (error) throw error;
        return { id: null };
      }
      const { data: bookingId, error } = await supabase.rpc("create_booking_v2", {
        ...common,
        p_scheduled_date: dateStr!,
      });

      if (error) throw error;
      return { id: bookingId as string };
    },
    onSuccess: (data) => {
      try {
        sessionStorage.removeItem(PROMO_STORAGE_KEY);
      } catch {
        // Nessuno storage disponibile.
      }
      queryClient.invalidateQueries({ queryKey: ["client-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast({
        title: data.id ? "Prenotazione confermata!" : `${repeatCount} appuntamenti prenotati!`,
        description: "Riceverai una conferma dal professionista",
      });
      navigate(data.id ? `/client/bookings?new=${data.id}` : "/client/bookings");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: toUserMessage(error),
        variant: "destructive",
      });
    },
  });

  if (loadingProfessional || loadingService || loadingPackage) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Conferma" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!professional || !service || !date || !time || (packageId && !pkg)) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Errore" showBack />
        <div className="p-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Dati prenotazione non validi</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/client")}
          >
            Torna alla home
          </Button>
        </div>
      </div>
    );
  }

  const initials = `${professional.first_name?.[0] || ""}${professional.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Conferma prenotazione" showBack />
      
      <div className="px-4 py-4 space-y-4">
        {/* Booking Summary Card */}
        <div className="trust-card space-y-4">
          <h2 className="font-semibold text-lg">Riepilogo prenotazione</h2>
          
          {/* Professional */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <Avatar className="h-12 w-12">
              <AvatarImage src={professional.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">
                {professional.first_name} {professional.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{professional.city}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Servizio</p>
                <p className="font-medium">
                  {serviceTypeLabels[serviceType!] || serviceType}
                  {pkg && <span className="text-muted-foreground"> · {pkg.name}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">{format(date, "EEEE d MMMM yyyy", { locale: it })}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orario</p>
                <p className="font-medium">{time} - {getEndTime()} ({duration} ore)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Input */}
        <div className="trust-card space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Indirizzo del servizio</h3>
          </div>
          <Input
            placeholder="Via, numero civico, città..."
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setAddressError(null);
            }}
            className={addressError ? "border-destructive" : ""}
          />
          {addressError && (
            <p className="text-sm text-destructive">{addressError}</p>
          )}
        </div>

        {/* Notes */}
        <div className="trust-card space-y-3">
          <h3 className="font-semibold">Note aggiuntive (opzionale)</h3>
          <Textarea
            placeholder="Indicazioni particolari, richieste speciali..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Ricorrenza */}
        <div className="trust-card space-y-3">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Ripeti</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { weeks: 0, label: "Una volta" },
              { weeks: 1, label: "Ogni settimana" },
              { weeks: 2, label: "Ogni 2 settimane" },
              { weeks: 4, label: "Ogni 4 settimane" },
            ].map((o) => (
              <button
                key={o.weeks}
                type="button"
                onClick={() => setEveryWeeks(o.weeks)}
                className={cn(
                  "py-3 rounded-2xl text-sm font-medium transition-all",
                  everyWeeks === o.weeks
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/60 hover:bg-muted"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {everyWeeks > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Numero di appuntamenti</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-9 w-9"
                  onClick={() => setRepeatCount((c) => Math.max(2, c - 1))} disabled={repeatCount <= 2}>
                  −
                </Button>
                <span className="w-6 text-center font-semibold">{repeatCount}</span>
                <Button variant="outline" size="icon" className="h-9 w-9"
                  onClick={() => setRepeatCount((c) => Math.min(12, c + 1))} disabled={repeatCount >= 12}>
                  +
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Promo Code */}
        <div className="trust-card space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Codice promozionale</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Inserisci codice"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoApplied}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={applyPromoCode}
              disabled={promoApplied || !promoCode}
            >
              {promoApplied ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                "Applica"
              )}
            </Button>
          </div>
          {promoApplied && (
            <p className="text-sm text-success flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Sconto di €{discount.toFixed(2)} applicato
            </p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="trust-card space-y-3">
          <h3 className="font-semibold">Dettaglio costi</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {pkg ? `Pacchetto a prezzo fisso (${duration} ore)` : `€${service.hourly_rate}/ora × ${duration} ore`}
              </span>
              <span>€{totalAmount.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Sconto promo</span>
                <span>-€{discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t border-border/30 pt-2 mt-2">
              <div className="flex justify-between text-base">
                <span className="font-semibold">{everyWeeks ? "Primo appuntamento" : "Totale"}</span>
                <span className="font-bold text-primary">€{finalAmount.toFixed(2)}</span>
              </div>
              {everyWeeks > 0 && (
                <div className="flex justify-between text-base mt-1">
                  <span className="font-semibold">Totale {repeatCount} appuntamenti</span>
                  <span className="font-bold text-primary">€{seriesAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="trust-indicator">
          <CreditCard className="h-5 w-5 text-success flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Saldo wallet: €{walletBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Alla conferma verranno bloccati €{seriesAmount.toFixed(2)}. Il professionista riceverà il pagamento solo a servizio completato (dopo 5 giorni senza contestazioni).
            </p>
            {!hasEnoughCredits && finalAmount > 0 && (
              <p className="text-xs text-destructive mt-1 font-medium">
                Crediti insufficienti —{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => navigate("/client/profile/payments")}
                >
                  ricarica il wallet
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border/30 safe-area-pb">
        <Button
          className="btn-trust-primary"
          onClick={() => createBookingMutation.mutate()}
          disabled={!address.trim() || createBookingMutation.isPending || !hasEnoughCredits}
        >
          {createBookingMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Confermo...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Conferma prenotazione • €{seriesAmount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
