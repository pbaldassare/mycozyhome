import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/client/AppHeader";
import { ProfessionalCard } from "@/components/client/ProfessionalCard";
import { Skeleton } from "@/components/ui/skeleton";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

export default function Favorites() {
  const navigate = useNavigate();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites-with-professionals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: favs, error: favsError } = await supabase
        .from("favorites")
        .select("professional_id, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (favsError) throw favsError;
      if (!favs.length) return [];

      const professionalIds = favs.map((f) => f.professional_id);

      const { data: professionals, error: proError } = await supabase
        .from("professionals")
        .select("*")
        .in("id", professionalIds);

      if (proError) throw proError;

      // Get services for each professional
      const { data: services, error: servError } = await supabase
        .from("professional_services")
        .select("*")
        .in("professional_id", professionalIds)
        .eq("is_active", true);

      if (servError) throw servError;

      // Combine data
      return professionals.map((pro) => {
        const proServices = services.filter((s) => s.professional_id === pro.id);
        const minRate = proServices.length
          ? Math.min(...proServices.map((s) => s.hourly_rate))
          : null;

        return {
          id: pro.id,
          name: `${pro.first_name} ${pro.last_name}`,
          avatarUrl: pro.avatar_url,
          rating: pro.average_rating || 0,
          reviewCount: pro.review_count || 0,
          distance: pro.city,
          services: proServices.map((s) => serviceTypeLabels[s.service_type] || s.service_type),
          hourlyRate: minRate,
          isVerified: pro.status === "approved",
        };
      });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-6">
      <AppHeader title="I miei preferiti" showBack />

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                id={pro.id}
                name={pro.name}
                avatarUrl={pro.avatarUrl || undefined}
                rating={pro.rating}
                reviewCount={pro.reviewCount}
                distance={pro.distance}
                services={pro.services}
                hourlyRate={pro.hourlyRate || undefined}
                isVerified={pro.isVerified}
                showFavorite
                onClick={() => navigate(`/client/professional/${pro.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-blush/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-blush" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              Nessun preferito
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Salva i tuoi professionisti preferiti toccando il cuore per ritrovarli facilmente qui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
