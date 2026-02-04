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

      // Query conversations based on user type
      const column = userType === "client" ? "client_id" : "professional_id";

      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          professionals:professional_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq(column, user.id)
        .eq("status", "active")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convError) throw convError;

      // Fetch last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Get client profile if we're a professional viewing the conversation
          let clientData = null;
          if (userType === "professional") {
            const { data } = await supabase
              .from("client_profiles")
              .select("first_name, last_name, avatar_url")
              .eq("user_id", conv.client_id)
              .single();
            clientData = data;
          }

          return {
            ...conv,
            professional: conv.professionals,
            client: clientData,
            lastMessage: messages?.[0] || null,
          };
        })
      );

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
          schema: "public",
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
          schema: "public",
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
