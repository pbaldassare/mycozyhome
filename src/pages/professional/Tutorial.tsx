 import { useNavigate } from "react-router-dom";
 import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
 import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
 import { Briefcase, TrendingUp, Shield, Home } from "lucide-react";
 
 const TUTORIAL_SEEN_KEY = "professional_tutorial_seen";
 
 export default function ProfessionalTutorial() {
   const navigate = useNavigate();
 
   const handleComplete = () => {
     localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
     navigate("/professional/onboarding/personal");
   };
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
             <Home className="w-4 h-4" />
           </div>
           <span className="font-display font-semibold">MyCozyHome Pro</span>
         </div>
       </header>
 
       {/* Carousel */}
       <div className="flex-1">
         <OnboardingCarousel
           onComplete={handleComplete}
           completeButtonText="Inizia Registrazione"
         >
           {/* Slide 1: Welcome */}
           <OnboardingSlide
             title="Benvenuto in MyCozyHome Pro"
             description="Inizia a guadagnare offrendo i tuoi servizi domestici a clienti verificati nella tua zona."
             illustration={
               <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                 <Briefcase className="w-24 h-24 text-primary" />
               </div>
             }
           />
 
           {/* Slide 2: How it works */}
           <OnboardingSlide
             title="Come Funziona"
             features={[
               { icon: "📩", text: "Ricevi richieste di prenotazione dai clienti nella tua zona" },
               { icon: "✅", text: "Accetta o rifiuta in base alla tua disponibilità" },
               { icon: "🏠", text: "Svolgi il servizio al domicilio del cliente" },
               { icon: "💰", text: "Ricevi il pagamento in modo sicuro tramite l'app" },
             ]}
           />
 
           {/* Slide 3: Benefits */}
           <OnboardingSlide
             title="I Tuoi Vantaggi"
             icon={<TrendingUp className="w-10 h-10" />}
             features={[
               { icon: "📅", text: "Orari flessibili - lavora quando vuoi tu" },
               { icon: "👥", text: "Clienti verificati e affidabili" },
               { icon: "💳", text: "Pagamenti garantiti e puntuali" },
               { icon: "📈", text: "Costruisci la tua reputazione con le recensioni" },
             ]}
           />
 
           {/* Slide 4: Security */}
           <OnboardingSlide
             title="Lavora in Sicurezza"
             icon={<Shield className="w-10 h-10" />}
             features={[
               { icon: "🔒", text: "Chat interna protetta - niente scambio di numeri" },
               { icon: "🛡️", text: "Intermediazione pagamenti sicura" },
               { icon: "📞", text: "Supporto clienti disponibile 24/7" },
               { icon: "⚖️", text: "Sistema di risoluzione dispute equo" },
             ]}
           />
         </OnboardingCarousel>
       </div>
     </div>
   );
 }