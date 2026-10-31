import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { toUserMessage } from "@/lib/errors";

/** Tabelle esportate: tutto ciò che l'utente può leggere di sé su MyCozyHome. */
const EXPORT_TABLES = [
  "client_profiles",
  "professional_private",
  "bookings",
  "reviews",
  "client_reviews",
  "service_requests",
  "favorites",
  "wallet_transactions",
  "payout_requests",
  "support_tickets",
  "conversations",
  "messages",
] as const;

/** Esportazione dei dati personali e uscita da MyCozyHome. */
export function AccountDataSection() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const result: Record<string, unknown> = {
        account: { id: user?.id, email: user?.email, created_at: user?.created_at },
        exported_at: new Date().toISOString(),
      };
      for (const table of EXPORT_TABLES) {
        // Le policy del DB restituiscono solo le righe dell'utente.
        const { data, error } = await supabase.from(table as "bookings").select("*").limit(5000);
        result[table] = error ? [] : data;
      }
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mycozyhome-dati-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const leave = async () => {
    setLeaving(true);
    const { error } = await supabase.rpc("leave_mycozyhome");
    if (error) {
      toast.error(toUserMessage(error));
      setLeaving(false);
      return;
    }
    await signOut();
    toast.success("I tuoi dati su MyCozyHome sono stati eliminati");
    navigate("/", { replace: true });
  };

  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">I tuoi dati</h2>
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-14 rounded-2xl"
          onClick={exportData}
          disabled={exporting}
        >
          <Download className="w-5 h-5" />
          {exporting ? "Preparazione del file..." : "Scarica i tuoi dati"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <LogOut className="w-5 h-5" />
              Esci da MyCozyHome
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare i tuoi dati da MyCozyHome?</AlertDialogTitle>
              <AlertDialogDescription>
                Nome, contatti e indirizzi vengono cancellati e non potrai più usare MyCozyHome con questo account.
                Lo storico delle prenotazioni resta, ma con "Utente eliminato" al posto del tuo nome. Il tuo account
                di accesso resta valido per le altre app che lo usano.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={leave} disabled={leaving}>
                Elimina i miei dati
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-xs text-muted-foreground px-1">
          Termini di servizio e informativa privacy saranno pubblicati prima dell'apertura al pubblico.
        </p>
      </div>
    </section>
  );
}
