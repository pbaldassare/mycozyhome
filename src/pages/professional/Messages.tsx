import { useState } from "react";
import { Search, Lock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";
import { useConversations } from "@/hooks/useConversations";

function formatTimestamp(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "HH:mm");
  }
  if (isYesterday(date)) {
    return "Ieri";
  }
  return format(date, "dd/MM", { locale: it });
}

export default function ProfessionalMessages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { conversations, isLoading } = useConversations("professional");

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.client
      ? `${conv.client.first_name || ""} ${conv.client.last_name || ""}`
      : "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Messaggi</h1>

      {/* Security Notice */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-info/10 text-info text-sm">
        <Lock className="h-4 w-4 flex-shrink-0" />
        <span>Tutte le chat sono sicure e monitorate per la tua protezione.</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Cerca cliente..."
          className="pl-12 h-11 rounded-xl bg-card border-border/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Nessuna conversazione</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Le chat con i clienti appariranno qui quando ti contatteranno
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const client = conv.client;
            const name = client
              ? `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Cliente"
              : "Cliente";
            const initials = client
              ? `${client.first_name?.[0] || ""}${client.last_name?.[0] || ""}`.toUpperCase() || "CL"
              : "CL";

            const unreadCount = conv.unread_count_professional || 0;

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/professional/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold truncate">{name}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimestamp(conv.lastMessage?.created_at || conv.last_message_at)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {conv.lastMessage?.content || "Nessun messaggio"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 bg-primary rounded-full text-xs text-primary-foreground font-medium flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
