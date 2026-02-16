import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadSupportCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-support-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get all user tickets with their last_read_at
      const { data: tickets, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("id, last_read_at")
        .eq("user_id", user.id);

      if (ticketsError || !tickets?.length) return 0;

      let unreadCount = 0;

      for (const ticket of tickets) {
        const { count, error } = await supabase
          .from("ticket_responses")
          .select("id", { count: "exact", head: true })
          .eq("ticket_id", ticket.id)
          .eq("responder_type", "admin")
          .gt("created_at", ticket.last_read_at || "1970-01-01");

        if (!error && count && count > 0) {
          unreadCount++;
        }
      }

      return unreadCount;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
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
    refetchInterval: 15000,
  });
}

export async function markTicketAsRead(ticketId: string) {
  await supabase
    .from("support_tickets")
    .update({ last_read_at: new Date().toISOString() } as any)
    .eq("id", ticketId);
}
