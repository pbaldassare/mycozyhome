import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { useInstallPWA } from "@/hooks/useInstallPWA";

const BANNER_DISMISSED_KEY = "pwa-banner-dismissed";
const IOS_BANNER_DISMISSED_KEY = "pwa-ios-banner-dismissed";

export function InstallBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPWA();
  const [isDismissed, setIsDismissed] = useState(true);

  // Only show on client and professional routes, not admin
  const isAppRoute = location.pathname.startsWith("/client") || 
                     location.pathname.startsWith("/professional");

  useEffect(() => {
    // For iOS, use a separate dismiss key with a shorter duration (6 hours)
    // This ensures iOS users see the banner more often since they need manual instructions
    if (isIOS) {
      const dismissed = localStorage.getItem(IOS_BANNER_DISMISSED_KEY);
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      setIsDismissed(dismissedTime > sixHoursAgo);
    } else {
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      setIsDismissed(dismissedTime > oneDayAgo);
    }
  }, [isIOS]);

  const handleDismiss = () => {
    if (isIOS) {
      localStorage.setItem(IOS_BANNER_DISMISSED_KEY, Date.now().toString());
    } else {
      localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    }
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        handleDismiss();
      }
    } else {
      navigate("/install");
    }
  };

  // Don't show if: already installed, dismissed, not on app route
  if (isInstalled || isDismissed || !isAppRoute) {
    return null;
  }

  // Show if installable or iOS (which needs manual instructions)
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border shadow-lg rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Installa CasaFacile</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Aggiungi alla Home per un'esperienza migliore
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="h-8">
                <Download className="w-4 h-4 mr-1.5" />
                {isInstallable ? "Installa" : "Scopri come"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-8 text-muted-foreground"
              >
                Dopo
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
