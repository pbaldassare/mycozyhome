import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lista dei bannati (specifiche §10): 5 anni, modificabile dall'admin. Togliere = far scadere oggi. */
export function BannedList() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-banned-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_list")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("banned_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setExpiry(id: string, expiresAt: string) {
    const { error } = await supabase.from("banned_list").update({ expires_at: expiresAt }).eq("id", id);
    if (error) return toast.error(toUserMessage(error));
    toast.success("Ban aggiornato");
    queryClient.invalidateQueries({ queryKey: ["admin-banned-list"] });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Lista dei bannati</h2>
      <p className="text-sm text-muted-foreground">Controllata a ogni registrazione (email, telefono, codice fiscale).</p>
      {!data?.length && <p className="text-sm text-muted-foreground">Nessun ban attivo.</p>}
      {data?.map((b) => (
        <div key={b.id} className="rounded-2xl border border-border/30 bg-card p-4 space-y-2 text-sm">
          <p className="font-medium">
            {b.full_name || "—"} · {b.role === "professional" ? "Professionista" : "Cliente"}
          </p>
          <p className="text-muted-foreground">{[b.email, b.phone, b.fiscal_code].filter(Boolean).join(" · ")}</p>
          <p className="whitespace-pre-wrap">{b.reason}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Scade il</span>
            <Input
              type="date"
              className="w-40"
              defaultValue={b.expires_at.slice(0, 10)}
              onBlur={(e) => e.target.value && e.target.value !== b.expires_at.slice(0, 10) && setExpiry(b.id, new Date(e.target.value).toISOString())}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => confirm("Togliere questo ban? Potrà registrarsi di nuovo.") && setExpiry(b.id, new Date().toISOString())}
            >
              Togli il ban
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
