import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { filterMessageContent } from "@/lib/content-filter";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: string;
  created_at: string;
  is_read: boolean;
  is_blocked: boolean;
  file_url: string | null;
  message_type: string;
}

export interface Conversation {
  id: string;
  professional_id: string;
  client_id: string;
  status: string;
  last_message_at: string;
  booking_id: string | null;
}

export function useChat(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch conversation and messages
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      
      // Fetch conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;
      setConversation(convData);

      // Fetch messages
      const { data: messagesData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;
      setMessages(messagesData || []);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError("Impossibile caricare la conversazione");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, imageFile?: File) => {
      if (!conversationId || !conversation) return;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Errore",
          description: "Devi essere autenticato per inviare messaggi",
          variant: "destructive",
        });
        return;
      }

      const userId = userData.user.id;
      const senderType = userId === conversation.client_id ? "client" : "professional";

      // Filter content
      const filterResult = filterMessageContent(content);

      let fileUrl: string | null = null;

      // Upload image if present
      if (imageFile) {
        const fileName = `${conversationId}/${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast({
            title: "Errore",
            description: "Impossibile caricare l'immagine",
            variant: "destructive",
          });
        } else {
          const { data: urlData } = supabase.storage
            .from("chat-attachments")
            .getPublicUrl(uploadData.path);
          fileUrl = urlData.publicUrl;
        }
      }

      // Insert message
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        content: filterResult.sanitizedContent,
        sender_id: userId,
        sender_type: senderType,
        message_type: imageFile ? "image" : "text",
        file_url: fileUrl,
        is_blocked: filterResult.isBlocked,
        original_content: filterResult.isBlocked ? content : null,
      });

      if (insertError) {
        console.error("Error sending message:", insertError);
        toast({
          title: "Errore",
          description: "Impossibile inviare il messaggio",
          variant: "destructive",
        });
      }
    },
    [conversationId, conversation, toast]
  );

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const userId = userData.user.id;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false);
  }, [conversationId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    fetchConversation();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchConversation]);

  return {
    messages,
    conversation,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    refetch: fetchConversation,
  };
}

export function useConversations(userId: string | undefined, userType: "client" | "professional") {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      
      const column = userType === "client" ? "client_id" : "professional_id";
      
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          messages (
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .eq(column, userId)
        .eq("status", "active")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, isLoading, refetch: fetchConversations };
}
