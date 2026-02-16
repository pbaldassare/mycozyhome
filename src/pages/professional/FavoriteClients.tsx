import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Star, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useProfessionalFavorites } from "@/hooks/useProfessionalFavorites";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function FavoriteClients() {
  const navigate = useNavigate();
  const { favorites, isLoading: loadingFavorites, toggleFavorite } = useProfessionalFavorites();
  const { data: professional } = useProfessionalProfile();

  // Fetch client profiles for favorite client IDs
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["favorite-clients-profiles", favorites],
    queryFn: async () => {
      if (!favorites.length) return [];

      // We need to fetch via bookings since client_profiles RLS only allows own profile
      // Instead, fetch from bookings which the professional can access
      const { data, error } = await supabase
        .from("bookings")
        .select("client_id")
        .eq("professional_id", professional!.id)
        .in("client_id", favorites);

      if (error) throw error;

      // Get unique client IDs that have bookings
      const clientIds = [...new Set(data.map((b) => b.client_id))];

      // For each client, get their info from the most recent booking
      const clientProfiles = await Promise.all(
        clientIds.map(async (clientId) => {
          const { data: clientData } = await supabase
            .from("client_profiles")
            .select("first_name, last_name, avatar_url, average_rating, review_count")
            .eq("user_id", clientId)
            .single();

          return {
            id: clientId,
            first_name: clientData?.first_name || "",
            last_name: clientData?.last_name || "",
            avatar_url: clientData?.avatar_url || "",
            average_rating: clientData?.average_rating || 0,
            review_count: clientData?.review_count || 0,
          };
        })
      );

      // Also include favorites without bookings (just show client_id)
      const missingIds = favorites.filter((id) => !clientIds.includes(id));
      const missingProfiles = missingIds.map((id) => ({
        id,
        first_name: "Cliente",
        last_name: "",
        avatar_url: "",
        average_rating: 0,
        review_count: 0,
      }));

      return [...clientProfiles, ...missingProfiles];
    },
    enabled: !!professional?.id && favorites.length > 0,
  });

  const isLoading = loadingFavorites || loadingClients;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/professional/profile")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Clienti preferiti</h1>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !clients || clients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Nessun cliente preferito</p>
              <p className="text-sm text-muted-foreground mt-1">
                Salva i tuoi clienti preferiti dalle prenotazioni
              </p>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => {
            const name = `${client.first_name} ${client.last_name}`.trim() || "Cliente";
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{name}</h3>
                      {Number(client.average_rating) > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          <span>{Number(client.average_rating).toFixed(1)}</span>
                          <span className="text-muted-foreground/60">
                            ({client.review_count})
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(client.id)}
                      className="text-destructive"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
