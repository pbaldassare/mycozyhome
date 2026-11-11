import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Target = { kind: "human_review" | "complaint"; disputeId?: string };

const TEXT = {
  human_review: {
    button: "Chiedi la verifica di una persona",
    title: "Verifica di una persona",
    help: "Un operatore controlla che la regola automatica sia stata applicata correttamente ai dati (orari e posizione del check-in). Spiega cosa non ti torna.",
  },
  complaint: {
    button: "Presenta reclamo contro la decisione",
    title: "Reclamo interno",
    help: "Il reclamo viene esaminato da un operatore diverso da chi ha deciso. Si presenta entro 1 mese dalla decisione; riceverai una risposta motivata entro 60 giorni.",
  },
};

/**
 * Verifica umana (esiti automatici: check-in, cliente assente, mancata presentazione) e
 * reclamo interno contro le decisioni sulle segnalazioni di questo servizio. Specifiche §5, §10-11.
 */
export function BookingAppeals({ bookingId, automaticOutcome }: { bookingId: string; automaticOutcome: boolean }) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["booking-appeals", bookingId],
    queryFn: async () => {
      const [{ data: disputes }, { data: appeals }] = await Promise.all([
        supabase.from("disputes").select("id, resolved_at").eq("booking_id", bookingId).not("resolved_at", "is", null),
        supabase.from("appeals").select("*"),
      ]);
      const disputeIds = new Set((disputes || []).map((d) => d.id));
      return {
        disputes: disputes || [],
        appeals: (appeals || []).filter((a) => a.booking_id === bookingId || disputeIds.has(a.dispute_id ?? "")),
      };
    },
  });

  const appeals = data?.appeals || [];
  const hasReview = appeals.some((a) => a.kind === "human_review");
  const openComplaintFor = (disputeId: string) => appeals.some((a) => a.dispute_id === disputeId);

  async function submit() {
    if (!target) return;
    setBusy(true);
    const { error } = await supabase.rpc("create_appeal", {
      p_kind: target.kind,
      p_booking_id: target.kind === "human_review" ? bookingId : null,
      p_dispute_id: target.disputeId ?? null,
      p_message: message,
    });
    setBusy(false);
    if (error) return toast.error(toUserMessage(error));
    toast.success("Richiesta inviata. Riceverai una risposta motivata.");
    setTarget(null);
    setMessage("");
    queryClient.invalidateQueries({ queryKey: ["booking-appeals", bookingId] });
  }

  return (
    <div className="space-y-2">
      {appeals.map((a) => (
        <div key={a.id} className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium">{TEXT[a.kind as Target["kind"]].title}</p>
          {a.status === "answered" ? (
            <p className="whitespace-pre-wrap">{a.answer}</p>
          ) : (
            <p className="text-muted-foreground">
              In esame. Risposta entro il {new Date(a.reply_due_at).toLocaleDateString("it-IT")}.
            </p>
          )}
        </div>
      ))}

      {automaticOutcome && !hasReview && (
        <Button variant="outline" className="w-full" onClick={() => setTarget({ kind: "human_review" })}>
          {TEXT.human_review.button}
        </Button>
      )}
      {data?.disputes.filter((d) => !openComplaintFor(d.id)).map((d) => (
        <Button key={d.id} variant="outline" className="w-full" onClick={() => setTarget({ kind: "complaint", disputeId: d.id })}>
          {TEXT.complaint.button}
        </Button>
      ))}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          {target && (
            <>
              <DialogHeader>
                <DialogTitle>{TEXT[target.kind].title}</DialogTitle>
                <DialogDescription>{TEXT[target.kind].help}</DialogDescription>
              </DialogHeader>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Scrivi qui (almeno 10 caratteri)" />
              <Button onClick={submit} disabled={busy || message.trim().length < 10}>Invia</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
