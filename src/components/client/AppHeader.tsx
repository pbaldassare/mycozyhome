import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Keep in sync with src/pages/client/Notifications.tsx
const NOTIFICATIONS_READ_KEY = "client_notifications_read";
const KNOWN_NOTIFICATION_IDS = ["welcome"];

function hasUnreadNotifications() {
  try {
    const read: string[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_READ_KEY) || "[]");
    return KNOWN_NOTIFICATION_IDS.some((id) => !read.includes(id));
  } catch {
    return true;
  }
}

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
  onBack?: () => void;
}

export function AppHeader({
  title,
  showBack = false,
  showNotifications = false,
  rightAction,
  className,
  onBack,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!showNotifications) return;
    const update = () => setUnread(hasUnreadNotifications());
    update();
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, [showNotifications]);

  return (
    <header className={cn("app-header", className)}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl -ml-2"
              onClick={handleBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightAction}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl relative"
              onClick={() => navigate("/client/notifications")}
              aria-label="Notifiche"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
