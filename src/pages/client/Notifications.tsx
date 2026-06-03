import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, MessageSquare, Star, Settings, CheckCheck } from "lucide-react";
import { AppHeader } from "@/components/client/AppHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "booking" | "message" | "review" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

const STORAGE_KEY = "client_notifications_read";

const mockNotifications: NotificationItem[] = [
  {
    id: "welcome",
    type: "system",
    title: "Benvenuto su MyCozyHome! 🎉",
    description: "Esplora i professionisti vicino a te e prenota in pochi tap.",
    time: "Ora",
    read: false,
    link: "/client/search",
  },
];

const iconByType = {
  booking: Calendar,
  message: MessageSquare,
  review: Star,
  system: Bell,
};

export default function ClientNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const readIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setNotifications(
      mockNotifications.map((n) => ({ ...n, read: readIds.includes(n.id) }))
    );
  }, []);

  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (n: NotificationItem) => {
    const readIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!readIds.includes(n.id)) {
      readIds.push(n.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
    }
    if (n.link) navigate(n.link);
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader
        title="Notifiche"
        showBack
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => navigate("/client/profile/notifications")}
            aria-label="Impostazioni notifiche"
          >
            <Settings className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-3">
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-primary">
            <CheckCheck className="h-4 w-4 mr-1" />
            Segna tutte come lette
          </Button>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nessuna notifica al momento</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconByType[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors",
                  n.read
                    ? "bg-card border-border/30"
                    : "bg-primary/5 border-primary/20"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl flex-shrink-0",
                  n.read ? "bg-muted" : "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", n.read ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
