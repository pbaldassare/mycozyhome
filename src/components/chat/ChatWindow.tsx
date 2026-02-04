import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Image, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  sender_type: "professional" | "client" | "system";
  content: string;
  message_type: "text" | "image" | "file" | "system";
  file_url?: string;
  is_read: boolean;
  created_at: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserType: "professional" | "client";
  otherUserName: string;
  otherUserAvatar?: string;
  onReportUser?: () => void;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserType,
  otherUserName,
  otherUserAvatar,
  onReportUser,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_type: currentUserType,
      content: newMessage.trim(),
      message_type: "text",
    });

    if (!error) {
      setNewMessage("");
    }
    setIsLoading(false);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback>
              {otherUserName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUserName}</h3>
            <p className="text-xs text-muted-foreground">
              Chat di servizio
            </p>
          </div>
        </div>
        {onReportUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReportUser}
            className="text-muted-foreground hover:text-destructive"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Segnala
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {/* System message */}
          <div className="flex justify-center">
            <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full">
              Le comunicazioni avvengono solo tramite questa chat per la tua sicurezza
            </div>
          </div>

          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const isSystem = message.sender_type === "system";

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-muted text-muted-foreground text-xs px-3 py-1.5 rounded-full">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {message.message_type === "image" && message.file_url && (
                    <img
                      src={message.file_url}
                      alt="Allegato"
                      className="rounded-lg max-w-full mb-2"
                    />
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(message.created_at), "HH:mm", { locale: it })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Image className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi un messaggio..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
