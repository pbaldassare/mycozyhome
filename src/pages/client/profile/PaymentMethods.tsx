import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, Plus, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientWallet, useSimulateTopUp, useWalletTransactions } from "@/hooks/useWallet";
import { WALLET_NOT_ACTIVE_MESSAGE } from "@/lib/wallet-errors";

import { toUserMessage } from "@/lib/errors";
const QUICK_AMOUNTS = [20, 50, 100, 200];

const typeLabels: Record<string, string> = {
  top_up: "Ricarica",
  hold: "Prenotazione",
  refund: "Rimborso",
  release: "Erogazione",
  payout: "Incasso",
  dispute_refund: "Rimborso contestazione",
  dispute_payout: "Pagamento contestazione",
};

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { data: wallet, isLoading } = useClientWallet();
  const { data: transactions = [] } = useWalletTransactions();
  const topUp = useSimulateTopUp();
  const [customAmount, setCustomAmount] = useState("");

  const balance = wallet?.balance ?? 0;
  const walletInactive = wallet?.schemaMissing === true;

  const handleTopUp = async (amount: number) => {
    if (walletInactive) {
      toast.error(WALLET_NOT_ACTIVE_MESSAGE);
      return;
    }

    try {
      const newBalance = await topUp.mutateAsync(amount);
      toast.success(`Ricarica di €${amount.toFixed(2)} completata. Saldo: €${newBalance.toFixed(2)}`);
      setCustomAmount("");
    } catch (err) {
      toast.error(toUserMessage(err, "Ricarica non riuscita. Riprova."));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/client/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Indietro">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Wallet e crediti</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {walletInactive && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium">Wallet non configurato</p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
              {WALLET_NOT_ACTIVE_MESSAGE}
            </p>
          </div>
        )}

        <div className="trust-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground">Saldo disponibile</span>
          </div>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <p className="text-4xl font-bold text-foreground">€{balance.toFixed(2)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            I crediti vengono usati per prenotare i servizi. Il pagamento al professionista avviene solo a servizio completato.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ricarica simulata
          </h2>
          <p className="text-sm text-muted-foreground">
            Versione demo: seleziona un importo per aggiungere crediti al wallet.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                disabled={topUp.isPending || walletInactive}
                onClick={() => handleTopUp(amount)}
              >
                + €{amount}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={10000}
              placeholder="Altro importo"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <Button
              disabled={topUp.isPending || walletInactive || !customAmount || Number(customAmount) <= 0}
              onClick={() => handleTopUp(Number(customAmount))}
            >
              Ricarica
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Movimenti recenti
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessun movimento ancora
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {typeLabels[tx.type] ?? tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.description ?? new Date(tx.created_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                  <span
                    className={
                      tx.direction === "credit"
                        ? "text-success font-semibold"
                        : "text-destructive font-semibold"
                    }
                  >
                    {tx.direction === "credit" ? "+" : "-"}€{Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
