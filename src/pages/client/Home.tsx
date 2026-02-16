import { Search, MapPin, Sparkles, Home as HomeIcon, Shirt, Leaf, PackageOpen, Truck, Snowflake, TreePine, LayoutGrid, Dog, PawPrint, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/client/AppHeader";
import { TrustIndicator } from "@/components/client/TrustIndicator";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { useFeaturedProfessionals } from "@/hooks/useProfessionals";
import { useAuth } from "@/hooks/useAuth";

const serviceCategories = [
  {
    title: "🏠 Cura della casa",
    services: [
      { id: "cleaning", icon: HomeIcon, title: "Pulizie", description: "Pulizie ordinarie e profonde" },
      { id: "ironing", icon: Shirt, title: "Stiro e lavanderia", description: "Stiraggio e lavanderia a domicilio" },
      { id: "wardrobe_seasonal", icon: PackageOpen, title: "Cambio stagione", description: "Cambio stagione armadi" },
      { id: "decluttering", icon: LayoutGrid, title: "Riordino", description: "Riordino e decluttering" },
      { id: "post_renovation", icon: Truck, title: "Post-trasloco", description: "Pulizia post-trasloco o ristrutturazione" },
      { id: "seasonal_cleaning", icon: Snowflake, title: "Servizi stagionali", description: "Natale, primavera e altro" },
      { id: "garden_care", icon: TreePine, title: "Piante e giardino", description: "Cura piante e giardino" },
      { id: "home_organizing", icon: Leaf, title: "Home organizing", description: "Organizzazione professionale spazi" },
    ],
  },
  {
    title: "🐾 Animali",
    services: [
      { id: "dog_walking", icon: Dog, title: "Dog walking", description: "Passeggiate con il cane" },
      { id: "pet_care_travel", icon: PawPrint, title: "Cura animali", description: "Cura animali in casa durante viaggi" },
      { id: "pet_space_cleaning", icon: Trash2, title: "Pulizia spazi", description: "Pulizia lettiere e spazi animali" },
    ],
  },
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

        {/* Pubblica inserzione */}
        <div
          className="p-4 rounded-xl border bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => navigate("/client/service-requests")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pubblica una richiesta</h3>
              <p className="text-sm text-muted-foreground">Ricevi offerte dai professionisti</p>
            </div>
          </div>
        </div>

        {/* Trust Indicator */}
        <TrustIndicator
          type="secure"
          title="Professionisti verificati"
          description="Tutti i nostri professionisti sono verificati e assicurati"
        />

        {/* Services by Category */}
        {serviceCategories.map((category) => (
          <section key={category.title}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{category.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {category.services.slice(0, 4).map((service) => (
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
            {category.services.length > 4 && (
              <button
                className="text-sm text-primary font-medium mt-2 w-full text-center"
                onClick={() => navigate("/client/search")}
              >
                Vedi tutti i servizi →
              </button>
            )}
          </section>
        ))}

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
                  yearsExperience={pro.yearsExperience}
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
