import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight,
  Info, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/client/AppHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

const durationOptions = [
  { hours: 1, label: "1 ora" },
  { hours: 2, label: "2 ore" },
  { hours: 3, label: "3 ore" },
  { hours: 4, label: "4 ore" },
  { hours: 5, label: "5 ore" },
  { hours: 6, label: "6 ore" },
  { hours: 8, label: "8 ore" },
];

export default function BookingNew() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const professionalId = searchParams.get("professional");
  const preselectedService = searchParams.get("service");

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(preselectedService);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(2);

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

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });

  const { data: availability } = useQuery({
    queryKey: ["professional-availability", professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("is_available", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });

  const selectedServiceData = useMemo(() => 
    services?.find(s => s.service_type === selectedService),
    [services, selectedService]
  );

  const totalAmount = useMemo(() => {
    if (!selectedServiceData) return 0;
    return selectedServiceData.hourly_rate * selectedDuration;
  }, [selectedServiceData, selectedDuration]);

  const minDuration = selectedServiceData?.min_hours || 1;

  const filteredDurationOptions = durationOptions.filter(d => d.hours >= minDuration);

  // Determine available dates based on availability
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    if (!availability?.length) return false;
    
    const dayOfWeek = date.getDay();
    return !availability.some(a => a.day_of_week === dayOfWeek);
  };

  // Get available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !availability?.length) return timeSlots;
    
    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability.length) return [];
    
    return timeSlots.filter(slot => {
      return dayAvailability.some(a => {
        const slotTime = slot;
        return slotTime >= a.start_time.slice(0, 5) && slotTime < a.end_time.slice(0, 5);
      });
    });
  }, [selectedDate, availability]);

  const canProceedStep1 = !!selectedService;
  const canProceedStep2 = !!selectedDate && !!selectedTime;
  const canProceedStep3 = selectedDuration >= minDuration;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Navigate to confirmation page
      navigate(`/client/booking/confirm?professional=${professionalId}&service=${selectedService}&date=${format(selectedDate!, "yyyy-MM-dd")}&time=${selectedTime}&duration=${selectedDuration}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  if (loadingProfessional || loadingServices) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Prenota" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Errore" showBack />
        <div className="p-4 text-center text-muted-foreground">
          Professionista non trovato
        </div>
      </div>
    );
  }

  const initials = `${professional.first_name?.[0] || ""}${professional.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Prenota" showBack onBack={handleBack} />
      
      {/* Professional Mini Header */}
      <div className="px-4 py-3 bg-card border-b border-border/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={professional.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">
              {professional.first_name} {professional.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">{professional.city}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  s < step
                    ? "bg-success text-success-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-colors",
                    s < step ? "bg-success" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Seleziona il servizio</h2>
            <div className="space-y-3">
              {services?.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service.service_type);
                    // Reset duration if less than min
                    if (selectedDuration < (service.min_hours || 1)) {
                      setSelectedDuration(service.min_hours || 1);
                    }
                  }}
                  className={cn(
                    "w-full trust-card text-left transition-all",
                    selectedService === service.service_type
                      ? "ring-2 ring-primary border-primary"
                      : "hover:shadow-md"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {serviceTypeLabels[service.service_type] || service.service_type}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Min. {service.min_hours || 1}h
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary">€{service.hourly_rate}</div>
                      <div className="text-xs text-muted-foreground">/ora</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Scegli data e ora</h2>
              
              <div className="trust-card">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDateDisabled}
                  locale={it}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                  className="pointer-events-auto"
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="font-medium mb-3">
                  Orari disponibili per {format(selectedDate, "EEEE d MMMM", { locale: it })}
                </h3>
                
                {availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "py-3 px-2 rounded-xl text-sm font-medium transition-all",
                          selectedTime === slot
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border/30 text-foreground hover:bg-muted"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nessun orario disponibile per questa data</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Duration */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Durata del servizio</h2>
              
              <div className="grid grid-cols-2 gap-3">
                {filteredDurationOptions.map((option) => (
                  <button
                    key={option.hours}
                    onClick={() => setSelectedDuration(option.hours)}
                    className={cn(
                      "py-4 px-4 rounded-xl text-center transition-all",
                      selectedDuration === option.hours
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border/30 text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="text-lg font-bold">{option.label}</div>
                    {selectedServiceData && (
                      <div className="text-sm opacity-80">
                        €{selectedServiceData.hourly_rate * option.hours}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="trust-card space-y-3">
              <h3 className="font-semibold text-foreground">Riepilogo</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servizio</span>
                  <span className="font-medium">
                    {selectedService && (serviceTypeLabels[selectedService] || selectedService)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: it })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orario</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durata</span>
                  <span className="font-medium">{selectedDuration} ore</span>
                </div>
                
                <div className="border-t border-border/30 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      €{selectedServiceData?.hourly_rate}/ora × {selectedDuration}h
                    </span>
                    <span className="font-medium">€{totalAmount}</span>
                  </div>
                </div>
                
                <div className="border-t border-border/30 pt-2 mt-2">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Totale</span>
                    <span className="font-bold text-primary">€{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border/30 safe-area-pb">
        <Button
          className="btn-trust-primary"
          onClick={handleNext}
          disabled={
            (step === 1 && !canProceedStep1) ||
            (step === 2 && !canProceedStep2) ||
            (step === 3 && !canProceedStep3)
          }
        >
          {step < 3 ? "Continua" : "Conferma prenotazione"}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
