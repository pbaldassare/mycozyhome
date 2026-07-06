import { useNavigate } from "react-router-dom";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { Home, Shield, Sparkles } from "lucide-react";

export default function ClientWelcomeStory() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/client/auth", { state: { signup: true } });
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold">MyCozyHome</span>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <OnboardingCarousel
          onComplete={handleComplete}
          completeButtonText="Crea il tuo account"
        >
          <OnboardingSlide
            title="La tua casa, le nostre cure"
            description="MyCozyHome mette in contatto chi ama la propria casa con professionisti affidabili. Scopri perché migliaia di famiglie si affidano a noi."
            illustration={
              <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
            }
          />

          <OnboardingSlide
            title="Professionisti Verificati"
            icon={<Shield className="w-10 h-10" />}
            features={[
              {
                icon: "🪪",
                text: "Ogni professionista deve presentare documenti d'identità e certificazioni per registrarsi",
              },
              {
                icon: "✅",
                text: "Controlliamo ogni profilo prima di approvarlo sulla piattaforma",
              },
              {
                icon: "🛡️",
                text: "Tutti i professionisti sono coperti da assicurazione per la tua tranquillità",
              },
            ]}
          />

          <OnboardingSlide
            title="Trova il Professionista Giusto"
            features={[
              {
                icon: "🔍",
                text: "Cerca professionisti nella tua zona con disponibilità, prezzi e recensioni visibili subito",
              },
              {
                icon: "📅",
                text: "Vedi in tempo reale quando sono liberi e quanto costa il servizio",
              },
              {
                icon: "⭐",
                text: "Leggi le recensioni di altri clienti prima di prenotare",
              },
            ]}
          />

          <OnboardingSlide
            title="Pagamenti Sicuri nell'App"
            features={[
              {
                icon: "💳",
                text: "Tutti i pagamenti avvengono tramite l'app — niente contanti, niente rischi",
              },
              {
                icon: "📢",
                text: "In caso di problemi puoi segnalarli direttamente alla piattaforma",
              },
              {
                icon: "🤝",
                text: "MyCozyHome ti tutela in ogni fase del servizio",
              },
            ]}
          />

          <OnboardingSlide
            title="Assicurazioni a Prezzo Agevolato"
            description="Proteggi la tua casa e chi lavora per te con polizze assicurative scontate, disponibili direttamente nell'app."
            features={[
              {
                icon: "🏠",
                text: "Polizze per la tua abitazione a condizioni vantaggiose",
              },
              {
                icon: "🩹",
                text: "Copertura in caso di infortunio del professionista a casa tua",
              },
              {
                icon: "💰",
                text: "Tariffe riservate esclusivamente agli utenti MyCozyHome",
              },
            ]}
          />
        </OnboardingCarousel>
      </div>
    </div>
  );
}
