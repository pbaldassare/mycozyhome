import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";

export function useProfessionalFavorites() {
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalProfile();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["professional-favorites", professional?.id],
    queryFn: async () => {
      if (!professional?.id) return [];

      const { data, error } = await supabase
        .from("professional_favorites" as any)
        .select("client_id")
        .eq("professional_id", professional.id);

      if (error) throw error;
      return (data as any[]).map((f) => f.client_id as string);
    },
    enabled: !!professional?.id,
  });

  const addFavorite = useMutation({
    mutationFn: async (clientId: string) => {
      if (!professional?.id) throw new Error("Profilo non trovato");

      const { error } = await supabase
        .from("professional_favorites" as any)
        .insert({ professional_id: professional.id, client_id: clientId } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-favorites"] });
      toast({
        title: "Aggiunto ai preferiti",
        description: "Cliente salvato tra i tuoi preferiti",
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
    mutationFn: async (clientId: string) => {
      if (!professional?.id) throw new Error("Profilo non trovato");

      const { error } = await supabase
        .from("professional_favorites" as any)
        .delete()
        .eq("professional_id", professional.id)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-favorites"] });
      toast({
        title: "Rimosso dai preferiti",
        description: "Cliente rimosso dai tuoi preferiti",
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

  const toggleFavorite = (clientId: string) => {
    if (favorites.includes(clientId)) {
      removeFavorite.mutate(clientId);
    } else {
      addFavorite.mutate(clientId);
    }
  };

  const isFavorite = (clientId: string) => favorites.includes(clientId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}
