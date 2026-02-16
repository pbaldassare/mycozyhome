import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstallPWA } from "@/hooks/useInstallPWA";
import { 
  Smartphone, 
  Share, 
  Plus, 
  Download,
  CheckCircle2,
  ChevronLeft,
  MoreVertical
} from "lucide-react";

export default function Install() {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPWA();

  const handleInstall = async () => {
    await promptInstall();
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">App Installata!</h1>
          <p className="text-muted-foreground">
            MyCozyHome è già installata sul tuo dispositivo.
          </p>
          <Button onClick={() => navigate("/client")} className="mt-4">
            Vai all'App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="flex items-center h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl -ml-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Installa App</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Installa MyCozyHome
            </h2>
            <p className="text-muted-foreground mt-2">
              Aggiungi l'app alla schermata Home per un accesso rapido e un'esperienza migliore.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Vantaggi dell'app:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Accesso rapido dalla Home
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Esperienza fullscreen senza barre browser
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Funziona anche offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Caricamento più veloce
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Install Button or Instructions */}
        {isInstallable ? (
          <Button onClick={handleInstall} className="w-full h-12 text-lg" size="lg">
            <Download className="w-5 h-5 mr-2" />
            Installa Ora
          </Button>
        ) : isIOS ? (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Come installare su iPhone/iPad:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Tocca il pulsante Condividi</p>
                    <p className="text-sm text-muted-foreground">
                      In basso (Safari) o in alto a destra
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg">
                      <Share className="w-4 h-4" />
                      <span className="text-sm">Condividi</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Seleziona "Aggiungi a Home"</p>
                    <p className="text-sm text-muted-foreground">
                      Scorri verso il basso se necessario
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Aggiungi a Home</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Conferma l'installazione</p>
                    <p className="text-sm text-muted-foreground">
                      Tocca "Aggiungi" in alto a destra
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Come installare su Android:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Tocca il menu del browser</p>
                    <p className="text-sm text-muted-foreground">
                      I tre puntini in alto a destra
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                      <span className="text-sm">Menu</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Seleziona "Installa app"</p>
                    <p className="text-sm text-muted-foreground">
                      O "Aggiungi a schermata Home"
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Installa app</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Conferma l'installazione</p>
                    <p className="text-sm text-muted-foreground">
                      Tocca "Installa" nella finestra che appare
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip link */}
        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/client")} className="text-muted-foreground">
            Continua senza installare
          </Button>
        </div>
      </div>
    </div>
  );
}
