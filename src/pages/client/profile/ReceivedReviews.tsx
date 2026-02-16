import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ReceivedReviews() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["client-received-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("client_reviews")
        .select(`
          *,
          professional:professionals(first_name, last_name, avatar_url),
          booking:bookings(service_type, scheduled_date)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const serviceLabels: Record<string, string> = {
    cleaning: "Pulizie casa",
    office_cleaning: "Pulizie ufficio",
    ironing: "Stiraggio",
    sanitization: "Sanificazione",
    dog_sitter: "Dog sitting",
    wardrobe_seasonal: "Cambio stagione armadi",
    decluttering: "Riordino e decluttering",
    post_renovation: "Post ristrutturazione",
    seasonal_cleaning: "Pulizie stagionali",
    garden_care: "Cura piante e giardino",
    home_organizing: "Home organizing",
    dog_walking: "Dog walking",
    pet_care_travel: "Cura animali in viaggio",
    pet_space_cleaning: "Pulizia spazi animali",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Recensioni ricevute</h1>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !reviews?.length ? (
          <div className="text-center py-12 space-y-2">
            <Star className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold">Nessuna recensione</h3>
            <p className="text-sm text-muted-foreground">
              Le recensioni dei professionisti appariranno qui
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const proName = review.professional
              ? `${review.professional.first_name} ${review.professional.last_name}`
              : "Professionista";
            const initials = proName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={review.id} className="trust-card space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{proName}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.booking
                        ? serviceLabels[review.booking.service_type] || review.booking.service_type
                        : ""}
                      {review.booking?.scheduled_date &&
                        ` • ${format(new Date(review.booking.scheduled_date), "d MMM yyyy", { locale: it })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? "text-warning fill-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {format(new Date(review.created_at), "d MMM yyyy", { locale: it })}
                  </span>
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
