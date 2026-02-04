import { useState, useEffect } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Conversation {
  id: string;
  professional_id: string;
  client_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined data
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  unread_count?: number;
}

interface ConversationListProps {
  currentUserId: string;
  currentUserType: "professional" | "client";
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  currentUserId,
  currentUserType,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  async function loadConversations() {
    setIsLoading(true);
    
    const filterColumn = currentUserType === "professional" ? "professional_id" : "client_id";
    
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq(filterColumn, currentUserId)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      // For now, use placeholder data for other user info
      // In production, you'd join with a users/profiles table
      const enrichedConversations = data.map((conv, idx) => ({
        ...conv,
        other_user_name: `Utente ${idx + 1}`,
        last_message: "Ultimo messaggio...",
        unread_count: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
      }));
      setConversations(enrichedConversations);
    }
    setIsLoading(false);
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messaggi
        </h2>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca conversazione..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nessuna conversazione</p>
            <p className="text-sm mt-1">
              Le chat con i clienti appariranno qui
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                  selectedConversationId === conversation.id && "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.other_user_avatar} />
                    <AvatarFallback>
                      {conversation.other_user_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {conversation.other_user_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.updated_at), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message}
                      </p>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs ml-2">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
