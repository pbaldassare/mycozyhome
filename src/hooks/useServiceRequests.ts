import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ServiceRequest {
  id: string;
  client_id: string;
  service_type: string;
  title: string;
  description: string;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  flexible_dates: boolean;
  address: string;
  city: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  budget_min: number | null;
  budget_max: number | null;
  estimated_hours: number | null;
  status: string;
  offers_count: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceOffer {
  id: string;
  request_id: string;
  professional_id: string;
  price_type: string;
  hourly_rate: number | null;
  total_price: number | null;
  estimated_hours: number | null;
  message: string | null;
  status: string;
  client_accepted_at: string | null;
  professional_confirmed_at: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  professional?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    average_rating: number | null;
    review_count: number | null;
    city: string;
  };
}

// Client: get own requests
export function useMyServiceRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-service-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
    enabled: !!user?.id,
  });
}

// Professional: browse open requests
export function useOpenServiceRequests(filters?: { city?: string; service_type?: string }) {
  return useQuery({
    queryKey: ["open-service-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("service_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (filters?.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }
      if (filters?.service_type) {
        query = query.eq("service_type", filters.service_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
  });
}

// Create a service request
export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: Omit<ServiceRequest, "id" | "status" | "offers_count" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("service_requests")
        .insert(req as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-service-requests"] });
    },
  });
}

// Update request status (close)
export function useUpdateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("service_requests")
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["open-service-requests"] });
    },
  });
}

// Get offers for a request (client view)
export function useOffersForRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ["service-offers", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await supabase
        .from("service_offers")
        .select("*, professional:professionals(id, first_name, last_name, avatar_url, average_rating, review_count, city)")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceOffer[];
    },
    enabled: !!requestId,
  });
}

// Professional: get own offers
export function useMyOffers(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["my-offers", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      const { data, error } = await supabase
        .from("service_offers")
        .select("*, service_request:service_requests(*)")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!professionalId,
  });
}

// Professional: send an offer
export function useSendOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (offer: {
      request_id: string;
      professional_id: string;
      price_type: string;
      hourly_rate?: number;
      total_price?: number;
      estimated_hours?: number;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from("service_offers")
        .insert(offer as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["service-offers", vars.request_id] });
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["open-service-requests"] });
    },
  });
}

// Client: accept an offer
export function useAcceptOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, requestId }: { offerId: string; requestId: string }) => {
      const { error } = await supabase
        .from("service_offers")
        .update({ status: "accepted", client_accepted_at: new Date().toISOString() } as any)
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["service-offers", vars.requestId] });
    },
  });
}

// Professional: confirm accepted offer
export function useConfirmOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId }: { offerId: string }) => {
      const { error } = await supabase
        .from("service_offers")
        .update({ status: "confirmed", professional_confirmed_at: new Date().toISOString() } as any)
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["service-offers"] });
    },
  });
}
