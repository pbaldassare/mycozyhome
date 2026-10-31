import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
}

/**
 * Ultima rete per gli errori di rendering: messaggio comprensibile al posto della
 * pagina bianca. Un chunk vecchio dopo un deploy si risolve ricaricando.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Si è verificato un errore imprevisto</h1>
          <p className="text-muted-foreground">Ricarica la pagina. Se il problema continua, riprova tra qualche minuto.</p>
          <Button onClick={() => window.location.reload()}>Ricarica</Button>
        </div>
      </main>
    );
  }
}
