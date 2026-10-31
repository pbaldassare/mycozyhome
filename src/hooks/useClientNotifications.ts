import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { serviceLabel } from "@/lib/services";

export interface ClientNotification {
  id: string;
  type: "booking" | "review";
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
}

const READ_KEY = "client_notifications_read";

function readIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Notifiche del cliente ricavate dalle sue prenotazioni degli ultimi 30 giorni
 * (conferme, annullamenti, servizi da recensire). Lo stato "letta" resta sul dispositivo.
 */
export function useClientNotifications() {
  const { user } = useAuth();
  const [read, setRead] = useState<string[]>(readIds);

  useEffect(() => {
    const update = () => setRead(readIds());
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  const query = useQuery({
    queryKey: ["client-notifications", user?.id],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: bookings, error }, { data: reviews }] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, service_type, status, scheduled_date, updated_at")
          .eq("client_id", user!.id)
          .in("status", ["confirmed", "cancelled", "completed"])
          .gte("updated_at", since)
          .order("updated_at", { ascending: false })
          .limit(30),
        supabase.from("reviews").select("booking_id").eq("client_id", user!.id),
      ]);
      if (error) throw error;
      const reviewed = new Set((reviews ?? []).map((r) => r.booking_id));
      return (bookings ?? []).map((b) => {
        const service = serviceLabel(b.service_type);
        const time = formatDistanceToNow(parseISO(b.updated_at), { addSuffix: true, locale: it });
        if (b.status === "completed" && !reviewed.has(b.id)) {
          return { id: `review-${b.id}`, type: "review" as const, title: "Com'è andata?", description: `Lascia una recensione per ${service}.`, time, link: `/client/booking/${b.id}` };
        }
        const title =
          b.status === "confirmed" ? "Prenotazione confermata" : b.status === "cancelled" ? "Prenotazione annullata" : "Servizio completato";
        return { id: `${b.status}-${b.id}`, type: "booking" as const, title, description: service, time, link: `/client/booking/${b.id}` };
      });
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const notifications: ClientNotification[] = (query.data ?? []).map((n) => ({ ...n, read: read.includes(n.id) }));

  const markAllRead = useCallback(() => {
    const ids = Array.from(new Set([...readIds(), ...(query.data ?? []).map((n) => n.id)]));
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      // Senza storage restano non lette.
    }
    setRead(ids);
  }, [query.data]);

  return { ...query, notifications, unreadCount: notifications.filter((n) => !n.read).length, markAllRead };
}
