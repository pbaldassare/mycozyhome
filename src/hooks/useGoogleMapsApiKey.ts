import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedApiKey: string | null = null;

export function useGoogleMapsApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(cachedApiKey);
  const [loading, setLoading] = useState(!cachedApiKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedApiKey) {
      setApiKey(cachedApiKey);
      setLoading(false);
      return;
    }

    async function fetchApiKey() {
      try {
        // First check if we have a VITE env variable
        const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (envKey) {
          cachedApiKey = envKey;
          setApiKey(envKey);
          setLoading(false);
          return;
        }

        // Otherwise fetch from edge function
        const { data, error } = await supabase.functions.invoke("get-maps-key");
        
        if (error) {
          throw error;
        }

        if (data?.apiKey) {
          cachedApiKey = data.apiKey;
          setApiKey(data.apiKey);
        } else {
          throw new Error("API key not found in response");
        }
      } catch (err) {
        console.error("Failed to fetch Google Maps API key:", err);
        setError(err instanceof Error ? err.message : "Failed to load maps");
      } finally {
        setLoading(false);
      }
    }

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
}
