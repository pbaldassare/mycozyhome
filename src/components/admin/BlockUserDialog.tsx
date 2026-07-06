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
  onConfirm: (reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export function BlockUserDialog({
  open,
  onOpenChange,
  userName,
  isBlocked,
  blockedReason,
  onConfirm,
  isLoading,
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason("");
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    await onConfirm(isBlocked ? undefined : reason);
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
            <Label htmlFor="block-reason">Motivo (opzionale)</Label>
            <Textarea
              id="block-reason"
              placeholder="Es. violazione delle regole della piattaforma..."
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
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isBlocked ? "Sblocca" : "Blocca utente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
