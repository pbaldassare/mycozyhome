import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useGeolocation";
import { toast } from "sonner";

const MAX_RANGE_METERS = 500;

interface BookingTracking {
  id: string;
  booking_id: string;
  professional_id: string;
  check_in_at: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_distance_m: number | null;
  check_in_in_range: boolean | null;
  check_out_at: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_distance_m: number | null;
  check_out_in_range: boolean | null;
  actual_hours: number | null;
  status: string;
  created_at: string;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalizzazione non supportata"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export function useBookingTracking(bookingId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: tracking, isLoading } = useQuery({
    queryKey: ["booking-tracking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const { data, error } = await supabase
        .from("booking_tracking")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as BookingTracking | null;
    },
    enabled: !!bookingId,
  });

  const checkIn = useMutation({
    mutationFn: async ({
      bookingId,
      professionalId,
      bookingLat,
      bookingLng,
    }: {
      bookingId: string;
      professionalId: string;
      bookingLat: number | null;
      bookingLng: number | null;
    }) => {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      let distanceM = 0;
      let inRange = true;

      if (bookingLat != null && bookingLng != null) {
        const distanceKm = calculateDistance(lat, lng, bookingLat, bookingLng);
        distanceM = Math.round(distanceKm * 1000);
        inRange = distanceM <= MAX_RANGE_METERS;
      }

      const { data, error } = await supabase
        .from("booking_tracking")
        .insert({
          booking_id: bookingId,
          professional_id: professionalId,
          check_in_at: new Date().toISOString(),
          check_in_latitude: lat,
          check_in_longitude: lng,
          check_in_distance_m: distanceM,
          check_in_in_range: inRange,
          status: "checked_in",
        })
        .select()
        .single();

      if (error) throw error;
      return { data, inRange, distanceM };
    },
    onSuccess: ({ inRange, distanceM }) => {
      queryClient.invalidateQueries({ queryKey: ["booking-tracking"] });
      if (inRange) {
        toast.success("Check-in registrato con successo! Sei nella zona corretta.");
      } else {
        toast.warning(
          `Check-in registrato, ma risulti a ${distanceM}m dall'indirizzo del cliente (limite: ${MAX_RANGE_METERS}m).`
        );
      }
    },
    onError: (error: any) => {
      if (error?.code === 1) {
        toast.error("Permesso di geolocalizzazione negato. Abilita il GPS.");
      } else {
        toast.error("Errore durante il check-in: " + (error.message || ""));
      }
    },
  });

  const checkOut = useMutation({
    mutationFn: async ({
      trackingId,
      checkInAt,
      bookingLat,
      bookingLng,
    }: {
      trackingId: string;
      checkInAt: string;
      bookingLat: number | null;
      bookingLng: number | null;
    }) => {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      let distanceM = 0;
      let inRange = true;

      if (bookingLat != null && bookingLng != null) {
        const distanceKm = calculateDistance(lat, lng, bookingLat, bookingLng);
        distanceM = Math.round(distanceKm * 1000);
        inRange = distanceM <= MAX_RANGE_METERS;
      }

      const checkOutTime = new Date();
      const checkInTime = new Date(checkInAt);
      const actualHours = Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;

      const { data, error } = await supabase
        .from("booking_tracking")
        .update({
          check_out_at: checkOutTime.toISOString(),
          check_out_latitude: lat,
          check_out_longitude: lng,
          check_out_distance_m: distanceM,
          check_out_in_range: inRange,
          actual_hours: actualHours,
          status: "completed",
        })
        .eq("id", trackingId)
        .select()
        .single();

      if (error) throw error;
      return { data, actualHours };
    },
    onSuccess: ({ actualHours }) => {
      queryClient.invalidateQueries({ queryKey: ["booking-tracking"] });
      toast.success(`Check-out registrato! Ore lavorate: ${actualHours.toFixed(1)}h`);
    },
    onError: (error: any) => {
      if (error?.code === 1) {
        toast.error("Permesso di geolocalizzazione negato. Abilita il GPS.");
      } else {
        toast.error("Errore durante il check-out: " + (error.message || ""));
      }
    },
  });

  return { tracking, isLoading, checkIn, checkOut };
}

export function useBookingTrackingByBookingIds(bookingIds: string[]) {
  return useQuery({
    queryKey: ["booking-tracking-batch", bookingIds],
    queryFn: async () => {
      if (!bookingIds.length) return [];
      const { data, error } = await supabase
        .from("booking_tracking")
        .select("*")
        .in("booking_id", bookingIds);

      if (error) throw error;
      return (data || []) as BookingTracking[];
    },
    enabled: bookingIds.length > 0,
  });
}
