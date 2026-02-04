import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MoreVertical, Flag, Info, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppHeader } from "@/components/client/AppHeader";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { useCreateConversation } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";
import type { Message } from "@/hooks/useChat";

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Oggi";
  if (isYesterday(date)) return "Ieri";
  return format(date, "d MMMM yyyy", { locale: it });
}

function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();

  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.created_at), "yyyy-MM-dd");
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  });

  return groups;
}

export default function ClientChat() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const professionalIdFromQuery = searchParams.get("professional");
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { createConversation } = useCreateConversation();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    conversationId
  );

  // Handle creating new conversation from professional detail
  useEffect(() => {
    async function handleNewConversation() {
      if (professionalIdFromQuery && !conversationId) {
        const newConvId = await createConversation(professionalIdFromQuery);
        if (newConvId) {
          setActiveConversationId(newConvId);
          navigate(`/client/chat/${newConvId}`, { replace: true });
        }
      }
    }
    handleNewConversation();
  }, [professionalIdFromQuery, conversationId, createConversation, navigate]);

  const { messages, conversation, isLoading, sendMessage, markAsRead } = useChat(activeConversationId);

  // Fetch professional details
  const { data: professional } = useQuery({
    queryKey: ["chat-professional", conversation?.professional_id],
    queryFn: async () => {
      if (!conversation?.professional_id) return null;
      const { data } = await supabase
        .from("professionals")
        .select("first_name, last_name, avatar_url")
        .eq("id", conversation.professional_id)
        .single();
      return data;
    },
    enabled: !!conversation?.professional_id,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConversationId) {
      markAsRead();
    }
  }, [activeConversationId, markAsRead]);

  const handleSendMessage = async (content: string, imageFile?: File) => {
    if (!activeConversationId) return;
    await sendMessage(content, imageFile);
  };

  const handleReport = () => {
    navigate(`/client/dispute?conversation=${activeConversationId}`);
  };

  if (isLoading && activeConversationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeConversationId && !professionalIdFromQuery) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showBack title="Chat" />
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Conversazione non trovata</p>
        </div>
      </div>
    );
  }

  const initials = professional
    ? `${professional.first_name?.[0] || ""}${professional.last_name?.[0] || ""}`
    : "??";
  const fullName = professional
    ? `${professional.first_name} ${professional.last_name}`
    : "Professionista";

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center gap-3 h-14 px-4">
          <AppHeader showBack className="flex-none bg-transparent border-none" />

          <button
            onClick={() => navigate(`/client/professional/${conversation?.professional_id}`)}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={professional?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0">
              <h1 className="font-semibold truncate">{fullName}</h1>
              <p className="text-xs text-success">Online</p>
            </div>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => navigate(`/client/professional/${conversation?.professional_id}`)}
              >
                <Info className="h-4 w-4 mr-2" />
                Vedi profilo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                Segnala
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Safety Banner */}
      <div className="bg-info/10 text-info text-xs px-4 py-2 text-center">
        🔒 Per la tua sicurezza, comunica solo tramite questa chat. Non condividere dati personali.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Inizia la conversazione!</p>
              <p className="text-sm mt-1">Scrivi un messaggio per contattare il professionista.</p>
            </div>
          </div>
        ) : (
          Array.from(groupedMessages.entries()).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex justify-center my-4">
                <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  {formatDateHeader(msgs[0].created_at)}
                </span>
              </div>

              {/* Messages for this date */}
              {msgs.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  content={msg.content}
                  timestamp={new Date(msg.created_at)}
                  isSent={msg.sender_id === user?.id}
                  isRead={msg.is_read}
                  isBlocked={msg.is_blocked}
                  imageUrl={msg.file_url || undefined}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
