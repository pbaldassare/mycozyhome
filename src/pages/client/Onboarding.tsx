 import { useNavigate } from "react-router-dom";
 import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
 import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
 import { Search, Shield, Sparkles, Home } from "lucide-react";
 
 const ONBOARDING_SEEN_KEY = "client_onboarding_seen";
 
 export default function ClientOnboarding() {
   const navigate = useNavigate();
 
   const handleComplete = () => {
     localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
     navigate("/client");
   };
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
             <Home className="w-4 h-4" />
           </div>
           <span className="font-display font-semibold">MyCozyHome</span>
         </div>
       </header>
 
       {/* Carousel */}
       <div className="flex-1">
         <OnboardingCarousel
           onComplete={handleComplete}
           completeButtonText="Inizia"
         >
           {/* Slide 1: Welcome */}
           <OnboardingSlide
             title="Benvenuto su MyCozyHome"
             description="Trova professionisti affidabili per la pulizia e i servizi domestici nella tua zona."
             illustration={
               <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                 <Sparkles className="w-24 h-24 text-primary" />
               </div>
             }
           />
 
           {/* Slide 2: How it works */}
           <OnboardingSlide
             title="Come Funziona"
             icon={<Search className="w-10 h-10" />}
             features={[
               { icon: "🔍", text: "Cerca professionisti vicino a te per il servizio che ti serve" },
               { icon: "📅", text: "Prenota il giorno e l'orario che preferisci" },
               { icon: "🏠", text: "Ricevi il professionista direttamente a casa tua" },
               { icon: "⭐", text: "Lascia una recensione per aiutare gli altri utenti" },
             ]}
           />
 
           {/* Slide 3: Security */}
           <OnboardingSlide
             title="La Tua Sicurezza Prima di Tutto"
             icon={<Shield className="w-10 h-10" />}
             features={[
               { icon: "✅", text: "Professionisti verificati e recensiti dalla community" },
               { icon: "🔒", text: "Pagamenti sicuri tramite l'app - mai contanti" },
               { icon: "💬", text: "Comunicazione protetta nella chat interna" },
               { icon: "🛡️", text: "Garanzia soddisfazione su ogni servizio" },
             ]}
           />
 
           {/* Slide 4: Benefits */}
           <OnboardingSlide
             title="Perché Scegliere MyCozyHome"
             features={[
               { icon: "⏰", text: "Risparmia tempo prezioso - noi troviamo il professionista giusto" },
               { icon: "💯", text: "Qualità garantita con professionisti selezionati" },
               { icon: "💰", text: "Prezzi trasparenti - sai sempre quanto paghi" },
               { icon: "📱", text: "Tutto a portata di app - prenota in pochi tap" },
             ]}
           />
         </OnboardingCarousel>
       </div>
     </div>
   );
 }