import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchRequest {
  client_latitude: number;
  client_longitude: number;
  service_type: string;
  day_of_week: number;
  time: string; // HH:MM format
  max_budget?: number;
  sort_by?: "distance" | "rating" | "price";
}

interface MatchedProfessional {
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

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "POST") {
      const body = await req.json() as MatchRequest;
      
      const {
        client_latitude,
        client_longitude,
        service_type,
        day_of_week,
        time,
        max_budget,
        sort_by = "distance",
      } = body;

      console.log("Match request:", { service_type, day_of_week, time, sort_by });

      // Validate required fields
      if (!client_latitude || !client_longitude || !service_type || day_of_week === undefined || !time) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: client_latitude, client_longitude, service_type, day_of_week, time" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get approved professionals with the requested service
      const { data: professionals, error: profError } = await supabase
        .from("professionals")
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          city,
          bio,
          latitude,
          longitude,
          max_radius_km,
          professional_services!inner (
            service_type,
            hourly_rate,
            min_hours,
            is_active
          ),
          professional_availability (
            day_of_week,
            start_time,
            end_time,
            is_available
          ),
          professional_areas (
            latitude,
            longitude,
            max_distance_km
          )
        `)
        .eq("status", "approved")
        .eq("professional_services.service_type", service_type)
        .eq("professional_services.is_active", true);

      if (profError) {
        console.error("Error fetching professionals:", profError);
        throw profError;
      }

      console.log(`Found ${professionals?.length || 0} professionals with service ${service_type}`);

      const matchedProfessionals: MatchedProfessional[] = [];

      for (const prof of professionals || []) {
        // Check if professional has location data
        let profLat = prof.latitude;
        let profLng = prof.longitude;
        let maxRadius = prof.max_radius_km || 10;

        // If no main location, check areas
        if (!profLat || !profLng) {
          const areaWithLocation = prof.professional_areas?.find(
            (a: any) => a.latitude && a.longitude
          );
          if (areaWithLocation) {
            profLat = areaWithLocation.latitude;
            profLng = areaWithLocation.longitude;
            maxRadius = areaWithLocation.max_distance_km || 10;
          }
        }

        // Skip if no location data
        if (!profLat || !profLng) {
          console.log(`Professional ${prof.id} has no location data, skipping`);
          continue;
        }

        // Calculate distance
        const distance = calculateDistance(
          client_latitude,
          client_longitude,
          Number(profLat),
          Number(profLng)
        );

        // Check if within radius
        if (distance > maxRadius) {
          console.log(`Professional ${prof.id} is ${distance.toFixed(2)}km away, max radius is ${maxRadius}km, skipping`);
          continue;
        }

        // Check availability for the requested day and time
        const availability = prof.professional_availability?.find(
          (a: any) => a.day_of_week === day_of_week && a.is_available
        );

        if (!availability) {
          console.log(`Professional ${prof.id} not available on day ${day_of_week}, skipping`);
          continue;
        }

        // Check if time is within availability window
        const requestedTime = time;
        const startTime = availability.start_time.slice(0, 5);
        const endTime = availability.end_time.slice(0, 5);

        if (requestedTime < startTime || requestedTime >= endTime) {
          console.log(`Professional ${prof.id} not available at ${requestedTime} (works ${startTime}-${endTime}), skipping`);
          continue;
        }

        // Get service details
        const service = prof.professional_services[0];
        
        // Check budget if provided
        if (max_budget && service.hourly_rate > max_budget) {
          console.log(`Professional ${prof.id} rate ${service.hourly_rate} exceeds budget ${max_budget}, skipping`);
          continue;
        }

        // Add to matched list
        matchedProfessionals.push({
          id: prof.id,
          first_name: prof.first_name,
          last_name: prof.last_name,
          avatar_url: prof.avatar_url,
          city: prof.city,
          bio: prof.bio,
          rating: 4.5, // TODO: Calculate from reviews
          reviews_count: 0, // TODO: Count from reviews
          hourly_rate: service.hourly_rate,
          min_hours: service.min_hours,
          distance_km: Math.round(distance * 10) / 10,
          available_start: startTime,
          available_end: endTime,
        });
      }

      // Sort results
      matchedProfessionals.sort((a, b) => {
        switch (sort_by) {
          case "rating":
            return b.rating - a.rating;
          case "price":
            return a.hourly_rate - b.hourly_rate;
          case "distance":
          default:
            return a.distance_km - b.distance_km;
        }
      });

      console.log(`Returning ${matchedProfessionals.length} matched professionals`);

      return new Response(
        JSON.stringify({
          professionals: matchedProfessionals,
          total: matchedProfessionals.length,
          filters: { service_type, day_of_week, time, max_budget, sort_by },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Match service error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});