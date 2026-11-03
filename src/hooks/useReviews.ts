import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { toUserMessage } from "@/lib/errors";
import { uploadReviewPhotos } from "@/hooks/useBookingPhotos";
export interface ReviewWithDetails {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking_id: string;
  professional_id: string;
  client_id: string;
  professional?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  booking?: {
    service_type: string;
    scheduled_date: string;
  };
}

export function useClientReviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          professionals:professional_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch booking details for each review
      const reviewsWithBookings = await Promise.all(
        (data || []).map(async (review) => {
          const { data: booking } = await supabase
            .from("bookings")
            .select("service_type, scheduled_date")
            .eq("id", review.booking_id)
            .single();

          return {
            ...review,
            professional: review.professionals,
            booking,
          };
        })
      );

      return reviewsWithBookings as ReviewWithDetails[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      professionalId,
      rating,
      comment,
      punctuality,
      quality,
      kindness,
      photos = [],
    }: {
      bookingId: string;
      professionalId: string;
      rating: number;
      comment: string;
      punctuality?: number;
      quality?: number;
      kindness?: number;
      photos?: File[];
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if review already exists for this booking
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .single();

      if (existing) {
        throw new Error("Hai già lasciato una recensione per questa prenotazione");
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          professional_id: professionalId,
          client_id: user.id,
          rating,
          comment: comment || null,
          rating_punctuality: punctuality || null,
          rating_quality: quality || null,
          rating_kindness: kindness || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Le foto si caricano dopo la recensione: se falliscono la recensione resta valida.
      if (photos.length) {
        try {
          await uploadReviewPhotos(bookingId, photos);
        } catch (e) {
          console.error(e);
          toast({ title: "Foto non caricate", description: "La recensione è stata salvata senza foto." });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["can-review"] });
      queryClient.invalidateQueries({ queryKey: ["booking-photos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: toUserMessage(error, "Impossibile inviare la recensione"),
        variant: "destructive",
      });
    },
  });
}

export function useCanReview(bookingId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can-review", bookingId],
    queryFn: async () => {
      if (!bookingId || !user?.id) return false;

      // Check if review already exists
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .single();

      return !existing;
    },
    enabled: !!bookingId && !!user?.id,
  });
}
