import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/BrandMark";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { Search, Shield, Sparkles } from "lucide-react";
import { markClientStorySeen } from "@/lib/onboarding-keys";

export default function ClientOnboarding() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/client");
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3 flex-shrink-0">
        <Wordmark onDark />
      </header>

      <div className="flex-1 min-h-0">
        <OnboardingCarousel
          onComplete={handleComplete}
          completeButtonText="Inizia"
          showDismissOption
          onDismiss={markClientStorySeen}
        >
          <OnboardingSlide
            title="Benvenuto nell'app!"
            description="Ecco una guida rapida per sfruttare al meglio MyCozyHome."
            illustration={
              <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
            }
          />

          <OnboardingSlide
            title="Cerca e Prenota"
            icon={<Search className="w-10 h-10" />}
            features={[
              { icon: "🔍", text: "Dalla home o dalla ricerca, trova professionisti vicino a te" },
              { icon: "📅", text: "Vedi disponibilità, prezzi e recensioni prima di prenotare" },
              { icon: "🏠", text: "Scegli giorno e orario: il professionista arriva a casa tua" },
              { icon: "⭐", text: "Dopo il servizio, lascia una recensione per aiutare gli altri" },
            ]}
          />

          <OnboardingSlide
            title="Paga in Sicurezza"
            icon={<Shield className="w-10 h-10" />}
            features={[
              { icon: "💳", text: "Aggiungi un metodo di pagamento nel profilo" },
              { icon: "🔒", text: "Paga solo tramite l'app — mai contanti" },
              { icon: "📢", text: "Problemi con un servizio? Segnala dalla sezione Supporto" },
              { icon: "📋", text: "Trova tutte le prenotazioni e lo storico pagamenti nel profilo" },
            ]}
          />

          <OnboardingSlide
            title="Altri Servizi per Te"
            features={[
              { icon: "💬", text: "Comunica con i professionisti nella chat interna" },
              { icon: "❤️", text: "Salva i professionisti preferiti per prenotarli più velocemente" },
              { icon: "🔔", text: "Attiva le notifiche per non perdere aggiornamenti sulle prenotazioni" },
            ]}
          />
        </OnboardingCarousel>
      </div>
    </div>
  );
}
