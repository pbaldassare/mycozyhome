import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useGeolocation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const GEOFENCE_RADIUS_M = 500;
const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface GeofenceState {
  isTracking: boolean;
  isInZone: boolean | null;
  lastPingAt: Date | null;
  distanceM: number | null;
  error: string | null;
  autoCheckedIn: boolean;
  autoCheckedOut: boolean;
  trackingId: string | null;
  totalOutOfRangeMinutes: number;
  leftZoneCount: number;
}

export function useGeofenceTracking(
  bookingId: string | undefined,
  professionalId: string | undefined,
  bookingLat: number | null | undefined,
  bookingLng: number | null | undefined,
  isActive: boolean // only track for confirmed bookings today
) {
  const queryClient = useQueryClient();
  const watchIdRef = useRef<number | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastOutOfRangeStartRef = useRef<Date | null>(null);

  const [state, setState] = useState<GeofenceState>({
    isTracking: false,
    isInZone: null,
    lastPingAt: null,
    distanceM: null,
    error: null,
    autoCheckedIn: false,
    autoCheckedOut: false,
    trackingId: null,
    totalOutOfRangeMinutes: 0,
    leftZoneCount: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Calculate distance to booking location
  const getDistanceM = useCallback(
    (lat: number, lng: number): number => {
      if (bookingLat == null || bookingLng == null) return 0;
      return Math.round(calculateDistance(lat, lng, bookingLat, bookingLng) * 1000);
    },
    [bookingLat, bookingLng]
  );

  // Save a GPS ping to the database
  const savePing = useCallback(
    async (lat: number, lng: number, distanceM: number, inRange: boolean, trackingId: string) => {
      if (!bookingId || !professionalId) return;
      try {
        await supabase.from("tracking_pings").insert({
          tracking_id: trackingId,
          booking_id: bookingId,
          professional_id: professionalId,
          latitude: lat,
          longitude: lng,
          distance_m: distanceM,
          in_range: inRange,
        });

        // Update last_ping_at on tracking record
        await supabase
          .from("booking_tracking")
          .update({ last_ping_at: new Date().toISOString() })
          .eq("id", trackingId);
      } catch (e) {
        console.error("Error saving ping:", e);
      }
    },
    [bookingId, professionalId]
  );

  // Auto check-in: create tracking record
  const performCheckIn = useCallback(
    async (lat: number, lng: number, distanceM: number, inRange: boolean) => {
      if (!bookingId || !professionalId) return null;

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
          auto_checked_in: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Auto check-in error:", error);
        return null;
      }

      queryClient.invalidateQueries({ queryKey: ["booking-tracking"] });
      toast.success("📍 Check-in automatico registrato! Sei nella zona del cliente.");
      return data.id as string;
    },
    [bookingId, professionalId, queryClient]
  );

  // Auto check-out
  const performCheckOut = useCallback(
    async (trackingId: string, checkInAt: string, lat: number, lng: number, distanceM: number, inRange: boolean, outMinutes: number) => {
      const checkOutTime = new Date();
      const checkInTime = new Date(checkInAt);
      const actualHours =
        Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;

      const { error } = await supabase
        .from("booking_tracking")
        .update({
          check_out_at: checkOutTime.toISOString(),
          check_out_latitude: lat,
          check_out_longitude: lng,
          check_out_distance_m: distanceM,
          check_out_in_range: inRange,
          actual_hours: actualHours,
          status: "completed",
          auto_checked_out: true,
          total_out_of_range_minutes: outMinutes,
        })
        .eq("id", trackingId);

      if (error) {
        console.error("Auto check-out error:", error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["booking-tracking"] });
      toast.info(`📍 Check-out automatico. Ore registrate: ${actualHours.toFixed(1)}h`);
    },
    [queryClient]
  );

  // Handle position update
  const handlePosition = useCallback(
    async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const distanceM = getDistanceM(lat, lng);
      const inRange = distanceM <= GEOFENCE_RADIUS_M;
      const s = stateRef.current;

      setState((prev) => ({
        ...prev,
        distanceM,
        isInZone: inRange,
        lastPingAt: new Date(),
        error: null,
      }));

      // Case 1: Not checked in yet and entered zone → auto check-in
      if (!s.autoCheckedIn && !s.trackingId && inRange) {
        const trackingId = await performCheckIn(lat, lng, distanceM, inRange);
        if (trackingId) {
          setState((prev) => ({
            ...prev,
            autoCheckedIn: true,
            trackingId,
          }));
          // Save first ping
          await savePing(lat, lng, distanceM, inRange, trackingId);
        }
        return;
      }

      // Case 2: Checked in, save ping
      if (s.trackingId) {
        await savePing(lat, lng, distanceM, inRange, s.trackingId);

        // Track out-of-range time
        if (!inRange && s.isInZone !== false) {
          // Just left the zone
          lastOutOfRangeStartRef.current = new Date();
          setState((prev) => ({
            ...prev,
            leftZoneCount: prev.leftZoneCount + 1,
          }));

          // Update left_zone_count in DB
          await supabase
            .from("booking_tracking")
            .update({ left_zone_count: s.leftZoneCount + 1 })
            .eq("id", s.trackingId);

          toast.warning(`⚠️ Sei uscito dalla zona del cliente (${distanceM}m). Il sistema lo sta registrando.`);
        } else if (inRange && s.isInZone === false) {
          // Returned to zone
          if (lastOutOfRangeStartRef.current) {
            const outMinutes = (Date.now() - lastOutOfRangeStartRef.current.getTime()) / 60000;
            const newTotal = s.totalOutOfRangeMinutes + outMinutes;
            setState((prev) => ({ ...prev, totalOutOfRangeMinutes: newTotal }));

            await supabase
              .from("booking_tracking")
              .update({ total_out_of_range_minutes: newTotal })
              .eq("id", s.trackingId);

            lastOutOfRangeStartRef.current = null;
          }
          toast.success("✅ Sei rientrato nella zona del cliente.");
        }
      }
    },
    [getDistanceM, performCheckIn, savePing]
  );

  // Start/stop tracking
  useEffect(() => {
    if (!isActive || !bookingId || !professionalId || bookingLat == null || bookingLng == null) {
      return;
    }

    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocalizzazione non supportata" }));
      return;
    }

    // Check if already tracked
    const checkExisting = async () => {
      const { data } = await supabase
        .from("booking_tracking")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (data) {
        setState((prev) => ({
          ...prev,
          trackingId: data.id,
          autoCheckedIn: true,
          autoCheckedOut: data.status === "completed",
          leftZoneCount: (data as any).left_zone_count || 0,
          totalOutOfRangeMinutes: (data as any).total_out_of_range_minutes || 0,
        }));

        if (data.status === "completed") {
          return; // Don't track completed
        }
      }

      // Start watching position
      setState((prev) => ({ ...prev, isTracking: true }));

      const watchId = navigator.geolocation.watchPosition(
        (pos) => handlePosition(pos),
        (err) => {
          console.error("Geolocation error:", err);
          setState((prev) => ({ ...prev, error: err.message }));
          if (err.code === 1) {
            toast.error("❌ Permesso GPS negato. Il tracking automatico richiede l'accesso alla posizione.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );

      watchIdRef.current = watchId;
    };

    checkExisting();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };
  }, [isActive, bookingId, professionalId, bookingLat, bookingLng, handlePosition]);

  // Manual check-out (if professional wants to end early)
  const manualCheckOut = useCallback(async () => {
    const s = stateRef.current;
    if (!s.trackingId) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const distanceM = getDistanceM(lat, lng);
      const inRange = distanceM <= GEOFENCE_RADIUS_M;

      // Get check_in_at from DB
      const { data: tracking } = await supabase
        .from("booking_tracking")
        .select("check_in_at")
        .eq("id", s.trackingId)
        .single();

      if (tracking?.check_in_at) {
        await performCheckOut(
          s.trackingId,
          tracking.check_in_at,
          lat,
          lng,
          distanceM,
          inRange,
          s.totalOutOfRangeMinutes
        );
        setState((prev) => ({ ...prev, autoCheckedOut: true, isTracking: false }));

        // Stop watching
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      }
    } catch (e: any) {
      toast.error("Errore durante il check-out: " + (e.message || ""));
    }
  }, [getDistanceM, performCheckOut]);

  return {
    ...state,
    manualCheckOut,
  };
}
