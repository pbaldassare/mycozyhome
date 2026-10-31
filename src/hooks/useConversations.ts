import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ConversationWithDetails {
  id: string;
  professional_id: string;
  client_id: string;
  status: string;
  last_message_at: string | null;
  booking_id: string | null;
  unread_count_client: number | null;
  unread_count_professional: number | null;
  // Joined data
  professional?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  client?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

export function useConversations(userType: "client" | "professional" = "client") {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Una sola richiesta: conversazioni, ultimo messaggio e nomi delle parti.
      const { data, error } = await supabase.rpc("my_conversations");
      if (error) throw error;

      const conversationsWithMessages: ConversationWithDetails[] = (data ?? [])
        .filter((row) => (userType === "client" ? row.client_id === user.id : row.client_id !== user.id))
        .map((row) => ({
          id: row.id,
          professional_id: row.professional_id,
          client_id: row.client_id,
          status: row.status,
          last_message_at: row.last_message_at,
          booking_id: row.booking_id,
          unread_count_client: row.unread_count_client,
          unread_count_professional: row.unread_count_professional,
          professional: {
            first_name: row.professional_first_name,
            last_name: row.professional_last_name,
            avatar_url: row.professional_avatar_url,
          },
          client: {
            first_name: row.client_first_name,
            last_name: row.client_last_name,
            avatar_url: row.client_avatar_url,
          },
          lastMessage: row.last_created_at
            ? { content: row.last_content, created_at: row.last_created_at, sender_id: row.last_sender_id }
            : undefined,
        }));

      setConversations(conversationsWithMessages);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, userType]);

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    if (!user?.id) return;

    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "mycozyhome",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "mycozyhome",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, user?.id]);

  return { conversations, isLoading, refetch: fetchConversations };
}

export function useCreateConversation() {
  const { user } = useAuth();
  const { toast } = useToast();

  const createConversation = async (professionalId: string): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per iniziare una conversazione",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", user.id)
        .eq("professional_id", professionalId)
        .eq("status", "active")
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          client_id: user.id,
          professional_id: professionalId,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      toast({
        title: "Errore",
        description: "Impossibile creare la conversazione",
        variant: "destructive",
      });
      return null;
    }
  };

  return { createConversation };
}
