import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Moon, Sun, Smartphone, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInstallPWA } from "@/hooks/useInstallPWA";

export default function ProfessionalSettings() {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPWA();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("it");

  const themes = [
    { id: "light", label: "Chiaro", icon: Sun },
    { id: "dark", label: "Scuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Smartphone },
  ] as const;

  const languages = [
    { id: "it", label: "Italiano" },
    { id: "en", label: "English" },
  ];

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await promptInstall();
      if (success) {
        toast.success("App installata con successo!");
      }
    } else {
      navigate("/install");
    }
  };
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
         <div className="flex items-center justify-between">
           <button
             onClick={() => navigate("/professional/profile")}
             className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
           >
             <ArrowLeft className="w-5 h-5 text-foreground" />
           </button>
           <h1 className="font-semibold text-lg">Impostazioni</h1>
           <div className="w-9" />
         </div>
       </header>
 
       {/* Content */}
       <div className="flex-1 p-4 space-y-6">
         {/* Theme */}
         <div>
           <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
             Tema
           </h2>
           <div className="grid grid-cols-3 gap-2">
             {themes.map((t) => {
               const Icon = t.icon;
               return (
                 <button
                   key={t.id}
                   onClick={() => {
                     setTheme(t.id);
                     toast.success(`Tema ${t.label} selezionato`);
                   }}
                   className={cn(
                     "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                     theme === t.id
                       ? "bg-primary/10 border-primary text-primary"
                       : "bg-card border-border/30 hover:border-border"
                   )}
                 >
                   <Icon className="w-6 h-6" />
                   <span className="text-sm font-medium">{t.label}</span>
                 </button>
               );
             })}
           </div>
         </div>
 
         {/* Language */}
         <div>
           <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
             Lingua
           </h2>
           <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
             {languages.map((lang, index) => (
               <button
                 key={lang.id}
                 onClick={() => {
                   setLanguage(lang.id);
                   toast.success(`Lingua: ${lang.label}`);
                 }}
                 className={cn(
                   "w-full flex items-center justify-between p-4 transition-colors",
                   index < languages.length - 1 && "border-b border-border/30",
                   language === lang.id && "bg-primary/5"
                 )}
               >
                 <div className="flex items-center gap-3">
                   <Globe className="w-5 h-5 text-muted-foreground" />
                   <span className="font-medium">{lang.label}</span>
                 </div>
                 {language === lang.id && (
                   <div className="w-2 h-2 bg-primary rounded-full" />
                 )}
               </button>
             ))}
           </div>
         </div>
 
        {/* App Info */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Informazioni App
          </h2>
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
            {/* Install App - only show if not already installed */}
            {!isInstalled && (
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-between p-4 border-b border-border/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <span className="font-medium block">Installa App</span>
                    <span className="text-xs text-muted-foreground">
                      {isIOS ? "Aggiungi a Home" : "Installa sul dispositivo"}
                    </span>
                  </div>
                </div>
                <div className="text-primary text-sm font-medium">
                  {isInstallable ? "Installa" : "Scopri come"}
                </div>
              </button>
            )}
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versione</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build</span>
                <span className="font-medium">2026.02.05</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}