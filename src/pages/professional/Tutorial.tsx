import { useNavigate, useLocation } from "react-router-dom";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { Briefcase, TrendingUp, Shield, Home } from "lucide-react";
import { markProfessionalStorySeen } from "@/lib/onboarding-keys";

export default function ProfessionalTutorial() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ??
    "/professional/onboarding/personal";

  const handleComplete = () => {
    navigate(returnTo);
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold">MyCozyHome Pro</span>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <OnboardingCarousel
          onComplete={handleComplete}
          completeButtonText="Completa il profilo"
          showDismissOption
          onDismiss={markProfessionalStorySeen}
        >
          <OnboardingSlide
            title="Benvenuto nell'app Pro!"
            description="Ecco come funziona MyCozyHome per i professionisti."
            illustration={
              <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Briefcase className="w-24 h-24 text-primary" />
              </div>
            }
          />

          <OnboardingSlide
            title="Ricevi e Gestisci Richieste"
            features={[
              { icon: "📩", text: "Le richieste di prenotazione arrivano nella sezione Prenotazioni" },
              { icon: "✅", text: "Accetta o rifiuta in base alla tua disponibilità" },
              { icon: "💬", text: "Comunica con i clienti tramite la chat interna" },
              { icon: "⭐", text: "Dopo ogni servizio, lascia una recensione sul cliente" },
            ]}
          />

          <OnboardingSlide
            title="Configura il Tuo Profilo"
            icon={<TrendingUp className="w-10 h-10" />}
            features={[
              { icon: "💶", text: "Imposta i prezzi per ogni servizio che offri" },
              { icon: "🕐", text: "Definisci orari e disponibilità settimanale" },
              { icon: "🛠️", text: "Scegli quali servizi attivare dal tuo profilo" },
              { icon: "📍", text: "Indica le zone in cui sei disponibile a lavorare" },
            ]}
          />

          <OnboardingSlide
            title="Supporto e Sicurezza"
            icon={<Shield className="w-10 h-10" />}
            features={[
              { icon: "💰", text: "Ricevi i pagamenti in modo sicuro tramite l'app" },
              { icon: "📋", text: "Richiedi supporto per partita IVA e fatturazione" },
              { icon: "📞", text: "Il team MyCozyHome è disponibile per qualsiasi dubbio" },
            ]}
          />
        </OnboardingCarousel>
      </div>
    </div>
  );
}
