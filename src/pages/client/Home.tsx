import { Search, MapPin, Sparkles, Home as HomeIcon, Shirt, Building2, SprayCan, Baby, Dog, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/client/AppHeader";
import { TrustIndicator } from "@/components/client/TrustIndicator";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { useFeaturedProfessionals } from "@/hooks/useProfessionals";
import { useAuth } from "@/hooks/useAuth";

const services = [
  { id: "cleaning", icon: HomeIcon, title: "Pulizie casa", description: "Pulizia professionale domestica" },
  { id: "office_cleaning", icon: Building2, title: "Pulizie ufficio", description: "Sanificazione ambienti lavoro" },
  { id: "ironing", icon: Shirt, title: "Stiro", description: "Servizio stiro a domicilio" },
  { id: "sanitization", icon: SprayCan, title: "Sanificazione", description: "Igienizzazione profonda" },
  { id: "babysitter", icon: Baby, title: "Babysitter", description: "Assistenza bambini" },
  { id: "dog_sitter", icon: Dog, title: "Dog sitter", description: "Cura animali domestici" },
];

export default function ClientHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: professionals, isLoading } = useFeaturedProfessionals(5);

  const userName = profile?.first_name || "Utente";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showNotifications />

      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ciao {userName}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Di cosa hai bisogno oggi?
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cerca un servizio o professionista..."
            className="pl-12 pr-12 h-12 rounded-xl bg-card border-border/30"
            onClick={() => navigate("/client/search")}
            readOnly
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </button>
        </div>

        {/* Trust Indicator */}
        <TrustIndicator
          type="secure"
          title="Professionisti verificati"
          description="Tutti i nostri professionisti sono verificati e assicurati"
        />

        {/* Services Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Servizi</h2>
            <button 
              className="text-sm text-primary font-medium"
              onClick={() => navigate("/client/search")}
            >
              Vedi tutti
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {services.slice(0, 4).map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/client/search?service=${service.id}`)}
                className="service-card flex flex-col items-center text-center p-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm">{service.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Professionals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Consigliati per te</h2>
            </div>
            <button 
              className="text-sm text-primary font-medium"
              onClick={() => navigate("/client/search")}
            >
              Vedi tutti
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : professionals && professionals.length > 0 ? (
            <div className="space-y-3">
              {professionals.map((pro) => (
                <ProfessionalCard
                  key={pro.id}
                  id={pro.id}
                  name={pro.name}
                  rating={pro.rating}
                  reviewCount={pro.reviewCount}
                  distance={pro.distance}
                  services={pro.services}
                  hourlyRate={pro.hourlyRate}
                  isVerified={pro.isVerified}
                  showFavorite
                  onClick={() => navigate(`/client/professional/${pro.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nessun professionista disponibile al momento</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
