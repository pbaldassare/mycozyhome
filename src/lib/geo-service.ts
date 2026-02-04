import { supabase } from "@/integrations/supabase/client";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id: string;
}

export interface DistanceResult {
  distance_km: number;
  duration_minutes: number;
}

export interface MatchedProfessional {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  city: string;
  bio: string | null;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  min_hours: number;
  distance_km: number;
  available_start: string;
  available_end: string;
}

export interface MatchFilters {
  service_type: string;
  day_of_week: number;
  time: string;
  max_budget?: number;
  sort_by?: "distance" | "rating" | "price";
}

export interface MatchResult {
  professionals: MatchedProfessional[];
  total: number;
  filters: MatchFilters;
}

// Geocode an address to coordinates
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const { data, error } = await supabase.functions.invoke("geo-service/geocode", {
    body: { address },
  });

  if (error) throw error;
  return data as GeocodeResult;
}

// Calculate distance between two coordinates
export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult> {
  const { data, error } = await supabase.functions.invoke("geo-service/distance", {
    body: { origin, destination },
  });

  if (error) throw error;
  return data as DistanceResult;
}

// Find matching professionals based on location, service, and availability
export async function findMatchingProfessionals(
  clientLatitude: number,
  clientLongitude: number,
  filters: MatchFilters
): Promise<MatchResult> {
  const { data, error } = await supabase.functions.invoke("match-professionals", {
    body: {
      client_latitude: clientLatitude,
      client_longitude: clientLongitude,
      ...filters,
    },
  });

  if (error) throw error;
  return data as MatchResult;
}

// Get day of week from date (0 = Sunday, 6 = Saturday)
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

// Format time as HH:MM
export function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

// Get Italian day name
export function getItalianDayName(dayOfWeek: number): string {
  const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  return days[dayOfWeek];
}