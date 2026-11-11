import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Smartphone, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInstallPWA } from "@/hooks/useInstallPWA";
import { getTheme, setTheme, type ThemeChoice } from "@/lib/theme";
import { AccountDataSection } from "@/components/AccountDataSection";
import { LegalContacts } from "@/components/LegalContacts";

const THEMES: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Chiaro", icon: Sun },
  { id: "dark", label: "Scuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Smartphone },
];

/** Impostazioni comuni a cliente e professionista. */
export function SettingsScreen({ backPath, showAccountData = false }: { backPath: string; showAccountData?: boolean }) {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPWA();
  const [theme, setThemeState] = useState<ThemeChoice>(getTheme);

  const chooseTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    setThemeState(choice);
  };

  const handleInstall = async () => {
    if (isInstallable) {
      if (await promptInstall()) toast.success("App installata");
    } else {
      navigate("/install");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate(backPath)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Impostazioni</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-2xl w-full mx-auto">
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Tema</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={theme === id}
                onClick={() => chooseTheme(id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                  theme === id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border/30 hover:border-border",
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {!isInstalled && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">App</h2>
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="font-medium block">Installa l'app</span>
                  <span className="text-xs text-muted-foreground">
                    {isIOS ? "Aggiungi alla schermata Home" : "Installa sul dispositivo"}
                  </span>
                </div>
              </div>
              <span className="text-primary text-sm font-medium">
                {isInstallable ? "Installa" : "Scopri come"}
              </span>
            </button>
          </section>
        )}

        {showAccountData && <AccountDataSection />}

        <LegalContacts supportPath={backPath.startsWith("/professional") ? "/professional/support" : "/client/support"} />
      </main>
    </div>
  );
}
