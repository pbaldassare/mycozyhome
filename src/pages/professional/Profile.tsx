import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Camera,
  Settings,
  LogOut,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfessionalProfile, useProfessionalServices } from "@/hooks/useProfessionalData";
import serviceCleaningImg from "@/assets/service-cleaning.png";
import serviceIroningImg from "@/assets/service-ironing.png";
import servicePetsitterImg from "@/assets/service-petsitter.png";
import promoCleaningImg from "@/assets/promo-cleaning.png";

const serviceImages: Record<string, string> = {
  cleaning: serviceCleaningImg,
  office_cleaning: serviceCleaningImg,
  ironing: serviceIroningImg,
  sanitization: serviceCleaningImg,
  babysitter: servicePetsitterImg,
  dog_sitter: servicePetsitterImg,
};

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

const portfolioImages = [
  { id: "1", label: "Prima", image: "" },
  { id: "2", label: "Dopo", image: "" },
];

export default function ProfessionalProfile() {
  const navigate = useNavigate();
  const { data: professional, isLoading: loadingProfile } = useProfessionalProfile();
  const { data: services, isLoading: loadingServices } = useProfessionalServices(professional?.id);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/");
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!professional) return null;

  const initials = `${professional.first_name[0]}${professional.last_name[0]}`;
  const joinYear = new Date(professional.created_at).getFullYear();
  const averageRating = professional.average_rating ?? 0;
  const reviewCount = professional.review_count ?? 0;

  // Calculate rating breakdown (simplified when we have real data)
  const ratingBreakdown = [
    { stars: 5, percentage: reviewCount > 0 ? 70 : 0 },
    { stars: 4, percentage: reviewCount > 0 ? 20 : 0 },
    { stars: 3, percentage: reviewCount > 0 ? 5 : 0 },
    { stars: 2, percentage: reviewCount > 0 ? 3 : 0 },
    { stars: 1, percentage: reviewCount > 0 ? 2 : 0 },
  ];

  const activeServices = services?.filter((s) => s.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold">Profilo</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/professional/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={professional.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold">
            {professional.first_name} {professional.last_name}
          </h2>
          <p className="text-muted-foreground">{professional.city}</p>
          <p className="text-sm text-muted-foreground">Iscritto dal {joinYear}</p>
        </div>

        {/* Rating Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold">{Number(averageRating).toFixed(1)}</p>
                <div className="flex items-center justify-center gap-0.5 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-5 w-5",
                        star <= Math.round(averageRating)
                          ? "fill-warning text-warning"
                          : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{reviewCount} recensioni</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingBreakdown.map((item) => (
                  <div key={item.stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{item.stars}</span>
                    <Progress value={item.percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Portfolio</h2>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              <ImagePlus className="h-4 w-4" />
              Aggiungi
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {portfolioImages.map((item) => (
              <div
                key={item.id}
                className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center relative overflow-hidden"
              >
                {item.image ? (
                  <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute bottom-2 left-2 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top Services */}
        {loadingServices ? (
          <Skeleton className="h-32 w-full" />
        ) : activeServices.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Servizi Principali</h2>
            <div className="grid grid-cols-3 gap-3">
              {activeServices.slice(0, 3).map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl overflow-hidden bg-card border"
                >
                  <div className="aspect-square relative">
                    <img
                      src={serviceImages[service.service_type] || serviceCleaningImg}
                      alt={serviceTypeLabels[service.service_type]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs font-medium truncate">
                      {serviceTypeLabels[service.service_type]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Services */}
        {services && services.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Tutti i Servizi</h2>
            <Card>
              <CardContent className="p-0 divide-y">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4">
                    <span className="font-medium">
                      {serviceTypeLabels[service.service_type]}
                    </span>
                    <span className="text-primary font-semibold">
                      €{Number(service.hourly_rate).toFixed(0)}/ora
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Promotion */}
        <section>
          <h2 className="text-base font-semibold mb-3">Promozioni</h2>
          <Card className="overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs font-medium text-destructive">Offerta Limitata</span>
                  <h3 className="font-semibold mt-1">10% di sconto sulla prima prenotazione</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usa il codice <span className="font-bold text-foreground">PULITO10</span> al checkout
                  </p>
                  <Button size="sm" className="mt-3">
                    Applica
                  </Button>
                </div>
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={promoCleaningImg}
                    alt="Promo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </Button>
      </div>
    </div>
  );
}
