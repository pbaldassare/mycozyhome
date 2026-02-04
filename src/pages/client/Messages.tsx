import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AppHeader } from "@/components/client/AppHeader";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";

const mockConversations = [
  {
    id: "1",
    professional: { name: "Maria Rossi", avatar: "", isOnline: true },
    lastMessage: "Perfetto, ci vediamo domani alle 9!",
    timestamp: new Date(),
    unreadCount: 2,
  },
  {
    id: "2",
    professional: { name: "Giuseppe Bianchi", avatar: "", isOnline: false },
    lastMessage: "Ho ricevuto la conferma del pagamento",
    timestamp: new Date(Date.now() - 3600000),
    unreadCount: 0,
  },
  {
    id: "3",
    professional: { name: "Anna Verdi", avatar: "", isOnline: true },
    lastMessage: "Posso essere disponibile giovedì pomeriggio",
    timestamp: new Date(Date.now() - 86400000),
    unreadCount: 0,
  },
];

function formatTimestamp(date: Date) {
  if (isToday(date)) {
    return format(date, "HH:mm");
  }
  if (isYesterday(date)) {
    return "Ieri";
  }
  return format(date, "dd/MM", { locale: it });
}

export default function ClientMessages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Messaggi"
        showNotifications
        rightAction={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cerca conversazione..."
            className="pl-12 h-11 rounded-xl bg-card border-border/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-1">
          {mockConversations.map((conv) => {
            const initials = conv.professional.name
              .split(" ")
              .map((n) => n[0])
              .join("");

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/client/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.professional.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {conv.professional.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold truncate">
                      {conv.professional.name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimestamp(conv.timestamp)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      conv.unreadCount > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {conv.lastMessage}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 bg-primary rounded-full text-xs text-primary-foreground font-medium flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
