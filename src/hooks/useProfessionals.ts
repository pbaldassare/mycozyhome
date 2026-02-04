import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog sitter",
};

export function useFeaturedProfessionals(limit = 5) {
  return useQuery({
    queryKey: ["featured-professionals", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select(`
          id, first_name, last_name, avatar_url, city, average_rating, review_count, status, bio,
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
        distance: "N/A", // Would need geo calculation
        services: pro.professional_services?.map(s => serviceTypeLabels[s.service_type] || s.service_type) || [],
        hourlyRate: pro.professional_services?.[0]?.hourly_rate || 0,
        isVerified: pro.status === "approved",
        avatarUrl: pro.avatar_url,
      }));
    },
  });
}

export function useSearchProfessionals(
  serviceType: string | null,
  searchQuery: string
) {
  return useQuery({
    queryKey: ["search-professionals", serviceType, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("professionals")
        .select(`
          id, first_name, last_name, avatar_url, city, average_rating, review_count, status, bio, latitude, longitude,
          professional_services(service_type, hourly_rate)
        `)
        .eq("status", "approved");

      const { data, error } = await query.order("average_rating", { ascending: false, nullsFirst: false });

      if (error) throw error;

      let results = data.map((pro) => ({
        id: pro.id,
        name: `${pro.first_name} ${pro.last_name}`,
        rating: pro.average_rating || 0,
        reviewCount: pro.review_count || 0,
        distance: "N/A",
        services: pro.professional_services?.map(s => serviceTypeLabels[s.service_type] || s.service_type) || [],
        serviceTypes: pro.professional_services?.map(s => s.service_type) || [],
        hourlyRate: pro.professional_services?.[0]?.hourly_rate || 0,
        isVerified: pro.status === "approved",
        avatarUrl: pro.avatar_url,
        city: pro.city,
        latitude: pro.latitude ? Number(pro.latitude) : undefined,
        longitude: pro.longitude ? Number(pro.longitude) : undefined,
      }));

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

      return results;
    },
  });
}
