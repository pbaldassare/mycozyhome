import { useState } from "react";
import { Ban, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  isBlocked: boolean;
  blockedReason?: string | null;
  onConfirm: (reason?: string, action?: SanctionAction) => Promise<void>;
  isLoading?: boolean;
  userType: "client" | "professional";
}

export type SanctionAction = "suspend" | "exclude_30" | "ban";

const ACTIONS: { value: SanctionAction; label: string; help: string; proOnly?: boolean }[] = [
  { value: "suspend", label: "Sospendi", help: "Account bloccato finché non lo sblocchi." },
  { value: "exclude_30", label: "Escludi tra 30 giorni", help: "Sospeso subito; dopo 30 giorni entra nella lista dei bannati (Regolamento P2B). Es. primo pagamento fuori piattaforma (TP 13.3).", proOnly: true },
  { value: "ban", label: "Ban definitivo", help: "Esclusione immediata e lista dei bannati per 5 anni. Professionisti: solo casi gravi di TP 13.3 (es. pagamenti fuori piattaforma ripetuti). Clienti: es. pagamenti fuori piattaforma (TU 7.8)." },
];

export function BlockUserDialog({
  open,
  onOpenChange,
  userName,
  isBlocked,
  blockedReason,
  onConfirm,
  isLoading,
  userType,
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<SanctionAction>("suspend");

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason("");
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    await onConfirm(isBlocked ? undefined : reason, action);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <ShieldOff className="w-5 h-5 text-sage-dark" />
                Sblocca utente
              </>
            ) : (
              <>
                <Ban className="w-5 h-5 text-destructive" />
                Blocca utente
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlocked ? (
              <>
                Stai per sbloccare <strong>{userName}</strong>. L'utente potrà di nuovo
                utilizzare tutte le funzioni della piattaforma.
              </>
            ) : (
              <>
                Stai per bloccare <strong>{userName}</strong>. L'account resterà attivo ma
                non potrà prenotare, pubblicare richieste o inviare offerte. Potrà ancora
                chattare con l'assistenza.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isBlocked && (
          <div className="space-y-2">
            <div className="grid gap-2">
              {ACTIONS.filter((a) => !a.proOnly || userType === "professional").map((a) => (
                <label key={a.value} className="flex items-start gap-2 rounded-lg border p-2 text-sm cursor-pointer">
                  <input type="radio" name="sanction" className="mt-1" checked={action === a.value} onChange={() => setAction(a.value)} />
                  <span>
                    <span className="font-medium">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.help}</span>
                  </span>
                </label>
              ))}
            </div>
            <Label htmlFor="block-reason">Motivazione (obbligatoria: fatti e regola applicata)</Label>
            <Textarea
              id="block-reason"
              placeholder="Es. il 3/11 ha chiesto al cliente un pagamento in contanti fuori dall'app (Termini 9.8)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {isBlocked && blockedReason && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium text-muted-foreground mb-1">Motivo del blocco</p>
            <p>{blockedReason}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Annulla
          </Button>
          <Button
            variant={isBlocked ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isLoading || (!isBlocked && reason.trim().length < 10)}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isBlocked ? "Sblocca" : ACTIONS.find((a) => a.value === action)!.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
