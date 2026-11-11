import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { SERVICE_LABELS as serviceTypeLabels } from "@/lib/services";
export interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  city: string;
  average_rating: number | null;
  review_count: number | null;
  status: string;
  bio: string | null;
  years_experience: number | null;
}

export interface ProfessionalWithServices extends Professional {
  services: {
    service_type: string;
    hourly_rate: number;
    description: string | null;
  }[];
}


export function useFeaturedProfessionals(limit = 5) {
  return useQuery({
    queryKey: ["featured-professionals", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select(`
          id, first_name, last_name, avatar_url, city, average_rating, review_count, status, bio, years_experience,
          professional_services(service_type, hourly_rate)
        `)
        .eq("status", "approved")
        .order("average_rating", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      return data.map((pro) => ({
        id: pro.id,
        name: `${pro.first_name} ${pro.last_name}`,
        rating: pro.average_rating || 0,
        reviewCount: pro.review_count || 0,
        yearsExperience: pro.years_experience || 0,
        distance: "N/A", // Would need geo calculation
        services: pro.professional_services?.map(s => serviceTypeLabels[s.service_type] || s.service_type) || [],
        hourlyRate: pro.professional_services?.[0]?.hourly_rate || 0,
        isVerified: pro.status === "approved",
        avatarUrl: pro.avatar_url,
      }));
    },
  });
}

export interface SearchFilters {
  maxDistance: number | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
}

interface UseSearchProfessionalsOptions {
  userLatitude?: number;
  userLongitude?: number;
  filters?: SearchFilters;
  /** Giorno scelto dal cliente (YYYY-MM-DD): chi lavora quel giorno della settimana sale in cima. */
  date?: string;
}

export function useSearchProfessionals(
  serviceType: string | null,
  searchQuery: string,
  options?: UseSearchProfessionalsOptions
) {
  const { userLatitude, userLongitude, filters, date } = options || {};

  return useQuery({
    queryKey: ["search-professionals", serviceType, searchQuery, userLatitude, userLongitude, filters, date],
    queryFn: async () => {
      const query = supabase
        .from("professionals")
        .select(`
          id, first_name, last_name, avatar_url, city, average_rating, review_count, status, bio, latitude, longitude, years_experience,
          professional_services(service_type, hourly_rate)
        `)
        .eq("status", "approved");

      const [{ data, error }, { data: counts }, { data: slots }] = await Promise.all([
        query,
        supabase.rpc("professional_completed_counts"),
        date
          ? supabase
              .from("professional_availability")
              .select("professional_id")
              .eq("is_available", true)
              .eq("day_of_week", new Date(`${date}T12:00:00`).getDay())
          : Promise.resolve({ data: null }),
      ]);

      if (error) throw error;
      const completedBy = new Map((counts || []).map((c) => [c.professional_id, Number(c.completed)]));
      const availableIds = slots ? new Set(slots.map((s) => s.professional_id)) : null;

      let results = data.map((pro) => {
        // Calculate distance if user location is available
        let distance = "N/A";
        let distanceKm: number | undefined;
        
        if (userLatitude && userLongitude && pro.latitude && pro.longitude) {
          distanceKm = calculateDistance(
            userLatitude,
            userLongitude,
            Number(pro.latitude),
            Number(pro.longitude)
          );
          distance = `${distanceKm.toFixed(1)} km`;
        }

        return {
          id: pro.id,
          name: `${pro.first_name} ${pro.last_name}`,
          rating: pro.average_rating || 0,
          reviewCount: pro.review_count || 0,
          yearsExperience: pro.years_experience || 0,
          distance,
          distanceKm,
          services: pro.professional_services?.map(s => serviceTypeLabels[s.service_type] || s.service_type) || [],
          serviceTypes: pro.professional_services?.map(s => s.service_type) || [],
          hourlyRate: pro.professional_services?.[0]?.hourly_rate || 0,
          minHourlyRate: Math.min(...(pro.professional_services?.map(s => s.hourly_rate) || [0])),
          isVerified: pro.status === "approved",
          avatarUrl: pro.avatar_url,
          city: pro.city,
          latitude: pro.latitude ? Number(pro.latitude) : undefined,
          longitude: pro.longitude ? Number(pro.longitude) : undefined,
          availableOnDate: availableIds ? availableIds.has(pro.id) : undefined,
          score: rankingScore({
            availableOnDate: availableIds ? availableIds.has(pro.id) : undefined,
            distanceKm,
            rating: pro.average_rating || 0,
            completed: completedBy.get(pro.id) || 0,
            profileFields: [pro.avatar_url, pro.bio, pro.years_experience, pro.city],
          }),
        };
      });

      // Filter by service type
      if (serviceType && serviceType !== "all") {
        results = results.filter(pro => pro.serviceTypes.includes(serviceType as typeof pro.serviceTypes[number]));
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        results = results.filter(pro => 
          pro.name.toLowerCase().includes(query) ||
          pro.city?.toLowerCase().includes(query) ||
          pro.services.some(s => s.toLowerCase().includes(query))
        );
      }

      // Apply advanced filters
      if (filters) {
        // Distance filter
        if (filters.maxDistance !== null && userLatitude && userLongitude) {
          results = results.filter(pro => 
            pro.distanceKm !== undefined && pro.distanceKm <= filters.maxDistance!
          );
        }

        // Price filter
        if (filters.minPrice > 0 || filters.maxPrice < 100) {
          results = results.filter(pro => 
            pro.minHourlyRate >= filters.minPrice && pro.minHourlyRate <= filters.maxPrice
          );
        }

        // Rating filter
        if (filters.minRating > 0) {
          results = results.filter(pro => pro.rating >= filters.minRating);
        }
      }

      results.sort((a, b) => b.score - a.score);

      return results;
    },
  });
}

/**
 * Ordinamento dichiarato (TU 6.1, TP 12.1): distanza, valutazione media, servizi completati,
 * completezza del profilo; con una data scelta, prima chi è disponibile quel giorno.
 * Nessuna posizione a pagamento: se arriveranno, etichettarle "sponsorizzato".
 * ponytail: disponibilità = orari settimanali, non controlla le prenotazioni già prese quel giorno.
 */
export const RANKING_CRITERIA =
  "I risultati sono ordinati per disponibilità nella data scelta, distanza, valutazione media, numero di servizi completati e completezza del profilo. Nessun professionista paga per comparire più in alto.";

export function rankingScore(p: {
  availableOnDate?: boolean;
  distanceKm?: number;
  rating: number;
  completed: number;
  profileFields: unknown[];
}) {
  const distance = p.distanceKm === undefined ? 0 : 1 - Math.min(p.distanceKm, 30) / 30;
  const rating = p.rating / 5;
  const completed = Math.min(p.completed, 50) / 50;
  const profile = p.profileFields.filter(Boolean).length / p.profileFields.length;
  // Disponibile nel giorno scelto vale più di tutto il resto (che somma al massimo 1).
  return (p.availableOnDate ? 1 : 0) + distance * 0.35 + rating * 0.3 + completed * 0.2 + profile * 0.15;
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
