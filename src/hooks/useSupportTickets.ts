import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TicketResponse {
  id: string;
  ticket_id: string;
  responder_id: string;
  responder_type: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_type: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  last_read_at: string | null;
}

export function useUserTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-tickets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });
}

export function useTicketResponses(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["ticket-responses", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("ticket_responses")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as TicketResponse[];
    },
    enabled: !!ticketId,
    refetchInterval: 10000,
  });
}

export function useSendTicketResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      responderId,
      responderType,
      content,
      attachmentFile,
    }: {
      ticketId: string;
      responderId: string;
      responderType: string;
      content: string;
      attachmentFile?: File;
    }) => {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;

      if (attachmentFile) {
        const filePath = `${ticketId}/${Date.now()}_${attachmentFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("support-attachments")
          .upload(filePath, attachmentFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from("support-attachments")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);

        attachment_url = urlData?.signedUrl || null;
        attachment_name = attachmentFile.name;
      }

      const { data, error } = await supabase
        .from("ticket_responses")
        .insert({
          ticket_id: ticketId,
          responder_id: responderId,
          responder_type: responderType,
          content,
          attachment_url,
          attachment_name,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-responses", variables.ticketId],
      });
    },
  });
}
