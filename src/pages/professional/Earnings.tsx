import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Clock, Landmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { useProfessionalWallet, useWalletTransactions } from "@/hooks/useWallet";
import { toUserMessage } from "@/lib/errors";
import { serviceLabel } from "@/lib/services";

const euro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);

const PAYOUT_STATUS: Record<string, string> = {
  pending: "IN LAVORAZIONE",
  paid: "PAGATO",
  rejected: "RIFIUTATO",
};

export default function ProfessionalEarnings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalProfile();
  const { data: wallet, isLoading: loadingWallet, isError: walletError, refetch } = useProfessionalWallet(professional?.id);
  const { data: transactions = [] } = useWalletTransactions();
  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");

  const { data: incoming = [] } = useQuery({
    queryKey: ["professional-incoming", professional?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, service_type, scheduled_date, payment_held_amount, dispute_deadline_at, payment_status")
        .eq("professional_id", professional!.id)
        .in("payment_status", ["pending_release", "disputed"])
        .order("dispute_deadline_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!professional?.id,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["payout-requests", professional?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("id, amount, status, created_at, processed_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!professional?.id,
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("request_payout", {
        p_amount: Number(amount.replace(",", ".")),
        p_iban: iban,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Richiesta di prelievo inviata");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["professional-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
    onError: (error) => toast.error(toUserMessage(error)),
  });

  const balance = wallet?.balance ?? 0;
  const approved = professional?.status === "approved";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/professional/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Incassi</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-2xl w-full mx-auto">
        <section className="bg-primary text-primary-foreground rounded-2xl p-5">
          <p className="text-sm opacity-80">Saldo disponibile</p>
          {loadingWallet ? (
            <Skeleton className="h-9 w-32 mt-1" />
          ) : walletError ? (
            <button className="mt-1 underline" onClick={() => refetch()}>
              Impossibile caricare il saldo. Riprova
            </button>
          ) : (
            <p className="text-3xl font-bold tabular-nums mt-1">{euro(balance)}</p>
          )}
          <p className="text-xs opacity-80 mt-2">
            I pagamenti arrivano qui 5 giorni dopo il servizio, se il cliente non apre una contestazione.
          </p>
        </section>

        {incoming.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">In arrivo</h2>
            <ul className="bg-card rounded-2xl border border-border/30 divide-y divide-border/30">
              {incoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{serviceLabel(b.service_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.payment_status === "disputed"
                          ? "In contestazione"
                          : b.dispute_deadline_at
                            ? `Disponibile dal ${format(parseISO(b.dispute_deadline_at), "d MMMM", { locale: it })}`
                            : "In attesa"}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">{euro(Number(b.payment_held_amount ?? 0))}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Richiedi un prelievo</h2>
          <form
            className="bg-card rounded-2xl border border-border/30 p-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              requestPayout.mutate();
            }}
          >
            {!approved && (
              <p className="text-sm text-muted-foreground">
                Potrai richiedere prelievi quando il tuo profilo sarà approvato.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="payout-amount">Importo (minimo 10 €)</Label>
              <Input
                id="payout-amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!approved}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-iban">IBAN del conto</Label>
              <Input
                id="payout-iban"
                autoComplete="off"
                placeholder="IT60 X054 2811 1010 0000 0123 456"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                disabled={!approved}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!approved || requestPayout.isPending}>
              <Landmark className="w-4 h-4 mr-2" />
              Richiedi il bonifico
            </Button>
          </form>
        </section>

        {payouts.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Prelievi</h2>
            <ul className="bg-card rounded-2xl border border-border/30 divide-y divide-border/30">
              {payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium tabular-nums">{euro(Number(p.amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(p.created_at), "d MMM yyyy", { locale: it })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold tracking-wide px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {PAYOUT_STATUS[p.status] ?? p.status.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Movimenti</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-card rounded-2xl border border-border/30 p-4">
              Nessun movimento per ora.
            </p>
          ) : (
            <ul className="bg-card rounded-2xl border border-border/30 divide-y divide-border/30">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {t.direction === "credit" ? (
                      <ArrowDownLeft className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.description ?? "Movimento"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.created_at), "d MMM yyyy, HH:mm", { locale: it })}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {t.direction === "credit" ? "+" : "−"}
                    {euro(Number(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
