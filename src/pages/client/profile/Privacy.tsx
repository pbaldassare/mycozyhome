import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Download, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Privacy() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    shareData: false,
    analytics: true,
    marketing: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
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
          <h1 className="font-semibold text-lg">Privacy e Sicurezza</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Privacy Settings */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Impostazioni Privacy
          </h2>
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium">Condivisione Dati</p>
                  <p className="text-sm text-muted-foreground">
                    Condividi dati con partner
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.shareData}
                onCheckedChange={() => toggleSetting("shareData")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Aiutaci a migliorare l'app
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={() => toggleSetting("analytics")}
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Gestione Dati
          </h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 rounded-2xl"
              onClick={() => toast.info("Download dati in preparazione...")}
            >
              <Download className="w-5 h-5" />
              Scarica i Tuoi Dati
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => toast.info("Contatta il supporto per eliminare l'account")}
            >
              <Trash2 className="w-5 h-5" />
              Elimina Account
            </Button>
          </div>
        </div>

        {/* Legal Links */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Documenti Legali
          </h2>
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
            <button className="w-full text-left p-4 hover:bg-muted/50 transition-colors">
              <p className="font-medium">Termini di Servizio</p>
            </button>
            <Separator />
            <button className="w-full text-left p-4 hover:bg-muted/50 transition-colors">
              <p className="font-medium">Informativa Privacy</p>
            </button>
            <Separator />
            <button className="w-full text-left p-4 hover:bg-muted/50 transition-colors">
              <p className="font-medium">Cookie Policy</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
