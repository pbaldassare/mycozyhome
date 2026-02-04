import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useFavorites() {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("professional_id")
        .eq("client_id", user.id);

      if (error) throw error;
      return data.map((f) => f.professional_id);
    },
  });

  const addFavorite = useMutation({
    mutationFn: async (professionalId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Devi effettuare l'accesso");

      const { error } = await supabase
        .from("favorites")
        .insert({ client_id: user.id, professional_id: professionalId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: "Aggiunto ai preferiti",
        description: "Professionista salvato tra i tuoi preferiti",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere ai preferiti",
        variant: "destructive",
      });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (professionalId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Devi effettuare l'accesso");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("client_id", user.id)
        .eq("professional_id", professionalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: "Rimosso dai preferiti",
        description: "Professionista rimosso dai tuoi preferiti",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile rimuovere dai preferiti",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = (professionalId: string) => {
    if (favorites.includes(professionalId)) {
      removeFavorite.mutate(professionalId);
    } else {
      addFavorite.mutate(professionalId);
    }
  };

  const isFavorite = (professionalId: string) => favorites.includes(professionalId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}
