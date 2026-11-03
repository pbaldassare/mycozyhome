import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Mance ricevute da lunedì scorso. */
export function useWeekTips(userId: string | undefined) {
  return useQuery({
    queryKey: ["pro-week-tips", userId],
    queryFn: async () => {
      const monday = new Date();
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("amount")
        .eq("user_id", userId!)
        .eq("type", "tip")
        .eq("direction", "credit")
        .gte("created_at", monday.toISOString());
      if (error) throw error;
      return data.reduce((sum, t) => sum + Number(t.amount), 0);
    },
    enabled: !!userId,
  });
}

export interface HotZone {
  city: string;
  count: number;
  services: string[];
}

/** Richieste aperte raggruppate per città, le più richieste prima. */
export function useHotZones(enabled: boolean) {
  return useQuery({
    queryKey: ["pro-hot-zones"],
    queryFn: async (): Promise<HotZone[]> => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("city, service_type")
        .eq("status", "open")
        .limit(500);
      if (error) throw error;
      const zones = new Map<string, HotZone>();
      for (const r of data) {
        const city = r.city.trim();
        const z = zones.get(city.toLowerCase()) ?? { city, count: 0, services: [] };
        z.count++;
        if (!z.services.includes(r.service_type)) z.services.push(r.service_type);
        zones.set(city.toLowerCase(), z);
      }
      return [...zones.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    },
    enabled,
  });
}
