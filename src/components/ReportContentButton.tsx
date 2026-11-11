import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toUserMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** "Segnala" su profili e recensioni (Policy §2-3, DSA art. 16). Funziona anche senza account. */
export function ReportContentButton({
  targetType,
  targetId,
  location,
}: {
  targetType: "professional" | "review";
  targetId: string;
  location: string;
}) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [goodFaith, setGoodFaith] = useState(false);
  const [busy, setBusy] = useState(false);

  function openDialog() {
    setName([profile?.first_name, profile?.last_name].filter(Boolean).join(" "));
    setEmail(profile?.email || user?.email || "");
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    const { error } = await supabase.rpc("report_content", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_location: `${location} (${window.location.pathname})`,
      p_reason: reason,
      p_urgent: urgent,
      p_name: name,
      p_email: email,
      p_good_faith: goodFaith,
    });
    setBusy(false);
    if (error) return toast.error(toUserMessage(error));
    toast.success("Segnalazione ricevuta. La esaminiamo e ti comunichiamo la decisione.");
    setOpen(false);
    setReason("");
    setUrgent(false);
    setGoodFaith(false);
  }

  const contactOk = urgent || (name.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()));

  return (
    <>
      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={openDialog}>
        <Flag className="h-3.5 w-3.5 mr-1" />
        Segnala
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Segnala un contenuto</DialogTitle>
            <DialogDescription>Stai segnalando: {location}. Per i pericoli immediati chiama il 112.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Perché ritieni il contenuto illecito? (es. profilo falso, recensione falsa, contenuto offensivo)"
            />
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={urgent} onCheckedChange={(c) => setUrgent(c === true)} className="mt-0.5" />
              <span>Riguarda la sicurezza delle persone o un minore (esaminata con priorità)</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={urgent ? "Nome (facoltativo)" : "Nome e cognome"} />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={urgent ? "Email (facoltativa)" : "Email"} />
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={goodFaith} onCheckedChange={(c) => setGoodFaith(c === true)} className="mt-0.5" />
              <span>Dichiaro in buona fede che le informazioni della segnalazione sono esatte e complete.</span>
            </label>
            <Button className="w-full" onClick={submit} disabled={busy || reason.trim().length < 10 || !goodFaith || !contactOk}>
              Invia segnalazione
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
