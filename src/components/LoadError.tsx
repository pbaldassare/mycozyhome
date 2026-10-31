import { Button } from "@/components/ui/button";

/** Stato di errore di una lista: messaggio comprensibile e pulsante per riprovare. */
export function LoadError({ onRetry, message = "Impossibile caricare i dati." }: { onRetry: () => void; message?: string }) {
  return (
    <div className="text-center py-10 space-y-3" role="alert">
      <p className="text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry}>Riprova</Button>
    </div>
  );
}
