import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeRequest {
  address: string;
}

interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id: string;
}

interface DistanceRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

interface DistanceResponse {
  distance_km: number;
  duration_minutes: number;
}

interface PlaceAutocompleteRequest {
  input: string;
  country?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (req.method === "POST") {
      const body = await req.json();

      // Geocode an address
      if (action === "geocode") {
        const { address } = body as GeocodeRequest;
        
        if (!address) {
          return new Response(
            JSON.stringify({ error: "Address is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=it&region=it`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        console.log("Geocode response status:", data.status);

        if (data.status === "OK" && data.results.length > 0) {
          const result = data.results[0];
          const geocodeResult: GeocodeResponse = {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            formatted_address: result.formatted_address,
            place_id: result.place_id,
          };

          return new Response(
            JSON.stringify(geocodeResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: "Address not found", status: data.status }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Calculate distance between two points
      if (action === "distance") {
        const { origin, destination } = body as DistanceRequest;

        if (!origin || !destination) {
          return new Response(
            JSON.stringify({ error: "Origin and destination are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}&language=it`;
        
        const response = await fetch(distanceUrl);
        const data = await response.json();

        console.log("Distance Matrix response status:", data.status);

        if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
          const element = data.rows[0].elements[0];
          const distanceResult: DistanceResponse = {
            distance_km: element.distance.value / 1000,
            duration_minutes: Math.round(element.duration.value / 60),
          };

          return new Response(
            JSON.stringify(distanceResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: "Could not calculate distance", status: data.status }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Place autocomplete
      if (action === "autocomplete") {
        const { input, country = "it" } = body as PlaceAutocompleteRequest;

        if (!input || input.length < 3) {
          return new Response(
            JSON.stringify({ predictions: [] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:${country}&types=address&key=${GOOGLE_MAPS_API_KEY}&language=it`;
        
        const response = await fetch(autocompleteUrl);
        const data = await response.json();

        console.log("Autocomplete response status:", data.status);

        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          const predictions = (data.predictions || []).map((p: any) => ({
            place_id: p.place_id,
            description: p.description,
            main_text: p.structured_formatting?.main_text,
            secondary_text: p.structured_formatting?.secondary_text,
          }));

          return new Response(
            JSON.stringify({ predictions }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: "Autocomplete failed", status: data.status }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Get place details
      if (action === "place-details") {
        const { place_id } = body;

        if (!place_id) {
          return new Response(
            JSON.stringify({ error: "Place ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}&language=it`;
        
        const response = await fetch(detailsUrl);
        const data = await response.json();

        console.log("Place Details response status:", data.status);

        if (data.status === "OK" && data.result) {
          return new Response(
            JSON.stringify({
              latitude: data.result.geometry.location.lat,
              longitude: data.result.geometry.location.lng,
              formatted_address: data.result.formatted_address,
              place_id: place_id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: "Place not found", status: data.status }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: geocode, distance, autocomplete, place-details" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Geo service error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});