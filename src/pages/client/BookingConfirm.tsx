import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { it } from "date-fns/locale";
import { 
  MapPin, Calendar, Clock, User, CreditCard, 
  CheckCircle2, AlertCircle, Loader2, Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/client/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

const addressSchema = z.string().trim().min(10, "Inserisci un indirizzo completo").max(200, "Indirizzo troppo lungo");
const promoCodeSchema = z.string().trim().max(20, "Codice promozionale troppo lungo").optional();
const notesSchema = z.string().trim().max(500, "Note troppo lunghe").optional();

export default function BookingConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const professionalId = searchParams.get("professional");
  const serviceType = searchParams.get("service");
  const dateStr = searchParams.get("date");
  const time = searchParams.get("time");
  const duration = parseInt(searchParams.get("duration") || "2");

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [addressError, setAddressError] = useState<string | null>(null);

  const date = dateStr ? parse(dateStr, "yyyy-MM-dd", new Date()) : null;

  const { data: professional, isLoading: loadingProfessional } = useQuery({
    queryKey: ["professional", professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
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
        .eq("service_type", serviceType as "cleaning" | "office_cleaning" | "ironing" | "sanitization" | "babysitter" | "dog_sitter")
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId && !!serviceType,
  });

  const totalAmount = service ? service.hourly_rate * duration : 0;
  const finalAmount = totalAmount - discount;

  // Calculate end time
  const getEndTime = () => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const applyPromoCode = () => {
    // Mock promo code logic - in real app, validate against backend
    if (promoCode.toUpperCase() === "BENVENUTO10") {
      setDiscount(totalAmount * 0.1);
      setPromoApplied(true);
      toast({
        title: "Codice applicato!",
        description: "Sconto del 10% applicato al tuo ordine",
      });
    } else if (promoCode.toUpperCase() === "PRIMA20") {
      setDiscount(totalAmount * 0.2);
      setPromoApplied(true);
      toast({
        title: "Codice applicato!",
        description: "Sconto del 20% applicato al tuo ordine",
      });
    } else if (promoCode) {
      toast({
        title: "Codice non valido",
        description: "Il codice promozionale inserito non è valido",
        variant: "destructive",
      });
    }
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
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

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          client_id: user.id,
          professional_id: professionalId!,
          service_type: serviceType!,
          scheduled_date: dateStr!,
          scheduled_time_start: time!,
          scheduled_time_end: getEndTime(),
          total_hours: duration,
          hourly_rate: service!.hourly_rate,
          total_amount: finalAmount,
          discount_amount: discount > 0 ? discount : null,
          promo_code: promoApplied ? promoCode.toUpperCase() : null,
          address: address.trim(),
          notes: notes.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Prenotazione confermata!",
        description: "Riceverai una conferma dal professionista",
      });
      navigate(`/client/bookings?new=${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (loadingProfessional || loadingService) {
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

  if (!professional || !service || !date || !time) {
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
                <p className="font-medium">{serviceTypeLabels[serviceType!] || serviceType}</p>
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
                €{service.hourly_rate}/ora × {duration} ore
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
                <span className="font-semibold">Totale</span>
                <span className="font-bold text-primary">€{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="trust-indicator">
          <CreditCard className="h-5 w-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Pagamento sicuro</p>
            <p className="text-xs text-muted-foreground">
              Pagherai solo dopo che il servizio sarà completato
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border/30 safe-area-pb">
        <Button
          className="btn-trust-primary"
          onClick={() => createBookingMutation.mutate()}
          disabled={!address.trim() || createBookingMutation.isPending}
        >
          {createBookingMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Confermo...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Conferma prenotazione • €{finalAmount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
