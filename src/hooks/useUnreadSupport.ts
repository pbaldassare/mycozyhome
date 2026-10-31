import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadSupportCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-support-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Un solo conteggio nel DB invece di una query per ticket.
      const { data, error } = await supabase.rpc("my_unread_support_count");
      if (error) return 0;
      return data ?? 0;
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });
}

export function useTicketHasUnread(ticketId: string | undefined, lastReadAt: string | null) {
  return useQuery({
    queryKey: ["ticket-unread", ticketId, lastReadAt],
    queryFn: async () => {
      if (!ticketId) return false;

      const { count, error } = await supabase
        .from("ticket_responses")
        .select("id", { count: "exact", head: true })
        .eq("ticket_id", ticketId)
        .eq("responder_type", "admin")
        .gt("created_at", lastReadAt || "1970-01-01");

      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!ticketId,
    refetchInterval: 60_000,
  });
}

export async function markTicketAsRead(ticketId: string) {
  await supabase
    .from("support_tickets")
    .update({ last_read_at: new Date().toISOString() })
    .eq("id", ticketId);
}
