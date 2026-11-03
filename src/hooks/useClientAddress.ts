import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ClientAddress {
  text: string;
  lat: number;
  lng: number;
}

/** Indirizzo principale del cliente (salvato nel profilo): usato per distanze e prenotazioni. */
export function useClientAddress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["client-address", user?.id];

  const { data: address = null, isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<ClientAddress | null> => {
      const { data, error } = await supabase
        .from("client_profiles")
        .select("address, latitude, longitude")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.address || data.latitude == null || data.longitude == null) return null;
      return { text: data.address, lat: Number(data.latitude), lng: Number(data.longitude) };
    },
  });

  const save = useMutation({
    mutationFn: async (a: ClientAddress) => {
      const { error } = await supabase
        .from("client_profiles")
        .update({ address: a.text, latitude: a.lat, longitude: a.lng })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return { address, isLoading, save };
}
