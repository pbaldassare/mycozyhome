import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfessionalStats {
  todayBookings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingRequests: number;
  totalCompletedBookings: number;
}

export function useProfessionalProfile() {
  return useQuery({
    queryKey: ["professional-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useProfessionalStats(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-stats", professionalId],
    queryFn: async (): Promise<ProfessionalStats> => {
      if (!professionalId) throw new Error("No professional ID");

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get today's bookings count
      const { count: todayCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .eq("scheduled_date", today.toISOString().split("T")[0])
        .in("status", ["confirmed", "pending"]);

      // Get pending requests count
      const { count: pendingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .eq("status", "pending");

      // Get week earnings
      const { data: weekBookings } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("professional_id", professionalId)
        .eq("status", "completed")
        .gte("scheduled_date", startOfWeek.toISOString().split("T")[0]);

      const weekEarnings = weekBookings?.reduce(
        (sum, b) => sum + Number(b.total_amount || 0),
        0
      ) || 0;

      // Get month earnings
      const { data: monthBookings } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("professional_id", professionalId)
        .eq("status", "completed")
        .gte("scheduled_date", startOfMonth.toISOString().split("T")[0]);

      const monthEarnings = monthBookings?.reduce(
        (sum, b) => sum + Number(b.total_amount || 0),
        0
      ) || 0;

      // Get total completed bookings
      const { count: completedCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .eq("status", "completed");

      return {
        todayBookings: todayCount || 0,
        weekEarnings,
        monthEarnings,
        pendingRequests: pendingCount || 0,
        totalCompletedBookings: completedCount || 0,
      };
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalBookings(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-bookings", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          client:client_profiles!bookings_client_id_fkey (
            first_name,
            last_name,
            avatar_url,
            phone
          )
        `)
        .eq("professional_id", professionalId)
        .gte("scheduled_date", today)
        .in("status", ["pending", "confirmed"])
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time_start", { ascending: true })
        .limit(10);

      if (error) {
        // Fallback query without join if client_profiles doesn't have matching records
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("bookings")
          .select("*")
          .eq("professional_id", professionalId)
          .gte("scheduled_date", today)
          .in("status", ["pending", "confirmed"])
          .order("scheduled_date", { ascending: true })
          .order("scheduled_time_start", { ascending: true })
          .limit(10);

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    },
    enabled: !!professionalId,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "confirmed" | "cancelled";
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["professional-stats"] });
      toast({
        title: status === "confirmed" ? "Prenotazione confermata" : "Prenotazione rifiutata",
        description: status === "confirmed" 
          ? "Il cliente riceverà una notifica" 
          : "La prenotazione è stata annullata",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la prenotazione",
        variant: "destructive",
      });
    },
  });
}

export function useProfessionalServices(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-own-services", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId)
        .order("service_type");

      if (error) throw error;
      return data || [];
    },
    enabled: !!professionalId,
  });
}

export function useToggleServiceActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      serviceId,
      isActive,
    }: {
      serviceId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("professional_services")
        .update({ is_active: isActive })
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-own-services"] });
      toast({
        title: "Servizio aggiornato",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il servizio",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: {
        hourly_rate: number;
        description: string | null;
        min_hours: number;
        years_experience: number;
      };
    }) => {
      const { error } = await supabase
        .from("professional_services")
        .update(data)
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-own-services"] });
      toast({
        title: "Servizio aggiornato",
        description: "Le modifiche sono state salvate",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il servizio",
        variant: "destructive",
      });
    },
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      professionalId,
      data,
    }: {
      professionalId: string;
      data: {
        service_type: string;
        hourly_rate: number;
        description: string | null;
        min_hours: number;
        years_experience: number;
      };
    }) => {
      const { error } = await supabase.from("professional_services").insert({
        professional_id: professionalId,
        service_type: data.service_type as "cleaning" | "office_cleaning" | "ironing" | "sanitization" | "babysitter" | "dog_sitter",
        hourly_rate: data.hourly_rate,
        description: data.description,
        min_hours: data.min_hours,
        years_experience: data.years_experience,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-own-services"] });
      toast({
        title: "Servizio aggiunto",
        description: "Il nuovo servizio è stato creato",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il servizio",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from("professional_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-own-services"] });
      toast({
        title: "Servizio eliminato",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il servizio",
        variant: "destructive",
      });
    },
  });
}

export function useProfessionalReviews(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-own-reviews", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch booking details separately
      const reviewsWithBookings = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: booking } = await supabase
            .from("bookings")
            .select("service_type, scheduled_date")
            .eq("id", review.booking_id)
            .single();

          return {
            ...review,
            booking,
          };
        })
      );

      return reviewsWithBookings;
    },
    enabled: !!professionalId,
  });
}
