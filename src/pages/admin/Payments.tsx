import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toUserMessage } from "@/lib/errors";

const euro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);

const TYPE_LABELS: Record<string, string> = {
  top_up: "Ricarica",
  tip: "Mancia",
  hold: "Crediti bloccati",
  refund: "Rimborso",
  release: "Pagamento al professionista",
  payout: "Prelievo",
  payout_reversal: "Prelievo annullato",
  dispute_refund: "Rimborso da contestazione",
  dispute_payout: "Pagamento dopo contestazione",
};

const PAYOUT_STATUS: Record<string, string> = {
  pending: "DA PAGARE",
  paid: "PAGATO",
  rejected: "RIFIUTATO",
};

export default function Payments() {
  const queryClient = useQueryClient();

  const payouts = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("id, amount, iban, status, created_at, processed_at, professional:professionals(first_name, last_name)")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const transactions = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("id, type, amount, direction, description, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const processPayout = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "paid" | "rejected" }) => {
      const { error } = await supabase.rpc("process_payout", { p_payout_id: id, p_status: status });
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "paid" ? "Prelievo segnato come pagato" : "Prelievo rifiutato, importo riaccreditato");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error) => toast.error(toUserMessage(error)),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pagamenti</h1>
        <p className="text-muted-foreground mt-1">
          Richieste di prelievo dei professionisti e movimenti dei crediti.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Prelievi</h2>
        <div className="bg-card rounded-2xl border border-border/30 overflow-x-auto">
          {payouts.isLoading ? (
            <Skeleton className="h-40 m-4" />
          ) : payouts.isError ? (
            <p className="p-6">Impossibile caricare i prelievi.</p>
          ) : payouts.data?.length === 0 ? (
            <p className="p-6 text-muted-foreground">Nessuna richiesta di prelievo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professionista</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Richiesto il</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.professional ? `${p.professional.first_name} ${p.professional.last_name}` : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{euro(Number(p.amount))}</TableCell>
                    <TableCell className="font-mono text-xs">{p.iban}</TableCell>
                    <TableCell>{format(parseISO(p.created_at), "d MMM yyyy", { locale: it })}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "pending" ? "default" : "secondary"}>
                        {PAYOUT_STATUS[p.status] ?? p.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {p.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={processPayout.isPending}
                            onClick={() => processPayout.mutate({ id: p.id, status: "paid" })}
                          >
                            Segna pagato
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processPayout.isPending}
                            onClick={() => processPayout.mutate({ id: p.id, status: "rejected" })}
                          >
                            Rifiuta
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          "Segna pagato" dopo aver fatto il bonifico; "Rifiuta" riaccredita l'importo al professionista.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Ultimi movimenti</h2>
        <div className="bg-card rounded-2xl border border-border/30 overflow-x-auto">
          {transactions.isLoading ? (
            <Skeleton className="h-40 m-4" />
          ) : transactions.isError ? (
            <p className="p-6">Impossibile caricare i movimenti.</p>
          ) : transactions.data?.length === 0 ? (
            <p className="p-6 text-muted-foreground">Nessun movimento.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.data?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="flex items-center gap-2">
                      {t.direction === "credit" ? (
                        <ArrowDownLeft className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      {TYPE_LABELS[t.type] ?? t.type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.description ?? "—"}</TableCell>
                    <TableCell>{format(parseISO(t.created_at), "d MMM yyyy, HH:mm", { locale: it })}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.direction === "credit" ? "+" : "−"}
                      {euro(Number(t.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <BuyoutRequests />
    </div>
  );
}

// Quote di riscatto (PT, TP 9.10): richieste dai professionisti, pagamento segnato a mano finché non c'è Stripe.
function BuyoutRequests() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-buyouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_pro_relations")
        .select("*")
        .not("buyout_requested_at", "is", null)
        .order("buyout_requested_at", { ascending: false });
      if (error) throw error;
      const proIds = data.map((r) => r.professional_id);
      const clientIds = data.map((r) => r.client_id);
      const [{ data: pros }, { data: clients }] = await Promise.all([
        supabase.from("professionals").select("id, first_name, last_name").in("id", proIds),
        supabase.from("client_profiles").select("user_id, first_name, last_name").in("user_id", clientIds),
      ]);
      const name = (u?: { first_name: string | null; last_name: string | null }) => [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "—";
      return data.map((r) => ({
        ...r,
        pro: name(pros?.find((p) => p.id === r.professional_id)),
        client: name(clients?.find((c) => c.user_id === r.client_id)),
      }));
    },
  });

  async function markPaid(clientId: string, professionalId: string) {
    const { error } = await supabase.rpc("mark_buyout_paid", { p_client_id: clientId, p_professional_id: professionalId });
    if (error) return toast.error(toUserMessage(error));
    toast.success("Quota segnata come pagata");
    queryClient.invalidateQueries({ queryKey: ["admin-buyouts"] });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Quote di riscatto</h2>
      <div className="bg-card rounded-2xl border border-border/30 overflow-x-auto">
        {!data?.length ? (
          <p className="p-6 text-sm text-muted-foreground">Nessuna richiesta.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professionista</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Primo servizio</TableHead>
                <TableHead>Richiesta</TableHead>
                <TableHead className="text-right">Quota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.client_id + r.professional_id}>
                  <TableCell>{r.pro}</TableCell>
                  <TableCell>{r.client}</TableCell>
                  <TableCell>{format(parseISO(r.first_service_at), "d MMM yyyy", { locale: it })}</TableCell>
                  <TableCell>{format(parseISO(r.buyout_requested_at!), "d MMM yyyy", { locale: it })}</TableCell>
                  <TableCell className="text-right">
                    {r.buyout_paid_at ? (
                      <Badge variant="secondary">Pagata</Badge>
                    ) : (
                      <Button size="sm" onClick={() => markPaid(r.client_id, r.professional_id)}>
                        Segna pagata ({euro(Number(r.buyout_amount))})
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
