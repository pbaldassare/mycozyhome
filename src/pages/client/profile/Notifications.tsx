import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Mail, MessageSquare, Calendar, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NotificationSetting {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
}

const defaultSettings: NotificationSetting[] = [
  {
    id: "push",
    icon: Bell,
    title: "Notifiche Push",
    description: "Ricevi notifiche sul dispositivo",
    enabled: true,
  },
  {
    id: "email",
    icon: Mail,
    title: "Email",
    description: "Aggiornamenti via email",
    enabled: true,
  },
  {
    id: "messages",
    icon: MessageSquare,
    title: "Messaggi",
    description: "Notifiche per nuovi messaggi",
    enabled: true,
  },
  {
    id: "bookings",
    icon: Calendar,
    title: "Prenotazioni",
    description: "Promemoria e aggiornamenti prenotazioni",
    enabled: true,
  },
  {
    id: "reviews",
    icon: Star,
    title: "Recensioni",
    description: "Richieste di recensione dopo il servizio",
    enabled: false,
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(defaultSettings);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    toast.success("Preferenze aggiornate");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/client/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Notifiche</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className={`flex items-center justify-between p-4 ${
                  index < settings.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{setting.title}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
