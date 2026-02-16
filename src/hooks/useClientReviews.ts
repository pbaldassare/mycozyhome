import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useCreateClientReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      professionalId,
      clientId,
      rating,
      comment,
    }: {
      bookingId: string;
      professionalId: string;
      clientId: string;
      rating: number;
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from("client_reviews" as any)
        .insert({
          booking_id: bookingId,
          professional_id: professionalId,
          client_id: clientId,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-all-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["client-review-status"] });
      toast({
        title: "Recensione inviata",
        description: "Grazie per il tuo feedback sul cliente!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message.includes("duplicate")
          ? "Hai già recensito questo cliente per questa prenotazione"
          : "Impossibile inviare la recensione",
        variant: "destructive",
      });
    },
  });
}

export function useCanReviewClient(bookingId: string | undefined, professionalId: string | undefined) {
  return useQuery({
    queryKey: ["client-review-status", bookingId],
    queryFn: async () => {
      if (!bookingId || !professionalId) return false;

      const { data } = await supabase
        .from("client_reviews" as any)
        .select("id")
        .eq("booking_id", bookingId)
        .eq("professional_id", professionalId)
        .maybeSingle();

      return !data;
    },
    enabled: !!bookingId && !!professionalId,
  });
}
