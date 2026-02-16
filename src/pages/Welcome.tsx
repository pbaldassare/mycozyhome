import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import welcomeIllustration from "@/assets/welcome-illustration.png";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Image Section */}
      <div className="w-full bg-[#d4e4d9] flex items-center justify-center py-8">
        <img
          src={welcomeIllustration}
          alt="Illustrazione pulizia casa"
          className="w-full max-w-md h-auto object-contain"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Benvenuto su MyCozyHome
        </h1>
        <p className="text-center text-muted-foreground text-lg max-w-md mb-10">
          Trova professionisti affidabili per la pulizia della tua casa e le tue esigenze domestiche. Garantiamo intermediazione sicura e servizio di qualità.
        </p>

        {/* Buttons */}
        <div className="w-full max-w-md space-y-4">
          <Button
            size="lg"
            className="w-full h-14 text-lg rounded-2xl bg-primary hover:bg-primary/90"
            onClick={() => navigate("/client/auth")}
          >
            Registrati come Cliente
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg rounded-2xl border-primary text-primary hover:bg-primary/5"
            onClick={() => navigate("/professional/auth")}
          >
            Registrati come Professionista
          </Button>
        </div>

        {/* Login Link */}
        <div className="mt-auto pt-8">
          <button
            onClick={() => navigate("/login")}
            className="text-primary hover:underline text-base"
          >
            Hai già un account? Accedi
          </button>
        </div>
      </div>
    </div>
  );
}
