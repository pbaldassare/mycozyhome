import { useNavigate } from "react-router-dom";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { Briefcase, TrendingUp } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export default function ProfessionalWelcomeStory() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/professional/auth", { state: { signup: true } });
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <BrandMark className="w-5 h-5" heartColor="hsl(var(--blush-dark))" />
          </div>
          <span className="font-display font-semibold">MyCozyHome Pro</span>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <OnboardingCarousel
          onComplete={handleComplete}
          completeButtonText="Inizia la registrazione"
        >
          <OnboardingSlide
            title="Lavora con MyCozyHome"
            description="Unisciti alla rete di professionisti domestici più affidabile d'Italia. Tu porti le competenze, noi i clienti."
            illustration={
              <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Briefcase className="w-24 h-24 text-primary" />
              </div>
            }
          />

          <OnboardingSlide
            title="Un'enorme base clienti"
            icon={<TrendingUp className="w-10 h-10" />}
            features={[
              {
                icon: "👥",
                text: "Accedi a migliaia di clienti che cercano servizi domestici nella tua zona",
              },
              {
                icon: "📍",
                text: "Tu scegli quanto lavorare e in quali zone operare",
              },
              {
                icon: "🗓️",
                text: "Massima flessibilità: decidi tu quando e dove accettare incarichi",
              },
            ]}
          />

          <OnboardingSlide
            title="Il Tuo Business, le Tue Regole"
            features={[
              {
                icon: "💶",
                text: "Imposta il prezzo che ritieni giusto per ogni servizio",
              },
              {
                icon: "⭐",
                text: "Consulta le recensioni che altri professionisti hanno lasciato sui clienti",
              },
              {
                icon: "🕐",
                text: "Configura orari, disponibilità e servizi offerti dal tuo profilo",
              },
            ]}
          />

          <OnboardingSlide
            title="Vantaggi Esclusivi"
            features={[
              {
                icon: "🛡️",
                text: "Polizze assicurative a prezzo scontato, pensate per chi lavora a domicilio",
              },
              {
                icon: "📋",
                text: "Supporto di consulenti per l'apertura della partita IVA e la fatturazione",
              },
              {
                icon: "💬",
                text: "Assistenza dedicata per tutte le questioni fiscali e amministrative",
              },
            ]}
          />

          <OnboardingSlide
            title="Pronto per iniziare?"
            description="Completa la registrazione, carica i documenti e inizia a ricevere richieste dai clienti della tua zona."
            features={[
              {
                icon: "📩",
                text: "Ricevi richieste di prenotazione direttamente nell'app",
              },
              {
                icon: "✅",
                text: "Accetta o rifiuta in base alla tua disponibilità",
              },
              {
                icon: "💰",
                text: "Ricevi i pagamenti in modo sicuro e puntuale",
              },
            ]}
          />
        </OnboardingCarousel>
      </div>
    </div>
  );
}
