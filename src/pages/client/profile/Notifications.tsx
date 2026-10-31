import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NotificationPreferences } from "@/components/NotificationPreferences";

export default function Notifications() {
  const navigate = useNavigate();

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

      <main className="flex-1 p-4 max-w-2xl w-full mx-auto">
        <NotificationPreferences table="client_profiles" />
      </main>
    </div>
  );
}
