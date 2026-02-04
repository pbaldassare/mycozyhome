import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface BookingWithProfessional {
  id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  status: string;
  total_amount: number;
  address: string;
  notes: string | null;
  created_at: string;
  professional: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

export function useClientBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          professional:professionals(id, first_name, last_name, avatar_url)
        `)
        .eq("client_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      return data as BookingWithProfessional[];
    },
    enabled: !!user?.id,
  });
}

export function useProfessionalBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["professional-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the professional profile
      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!professional) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("professional_id", professional.id)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
    },
  });
}

export function useCancelBooking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancellation_reason: reason,
        })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
    },
  });
}
