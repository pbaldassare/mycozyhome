import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AccountDataSection } from "@/components/AccountDataSection";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/client/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Privacy e dati</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-2xl w-full mx-auto">
        <p className="text-sm text-muted-foreground px-1">
          MyCozyHome usa i tuoi dati solo per gestire prenotazioni, pagamenti in crediti e assistenza. Non li
          condivide con partner e non usa strumenti di analisi esterni. Le comunicazioni promozionali si scelgono
          nelle preferenze di notifica.
        </p>
        <AccountDataSection />
      </main>
    </div>
  );
}
