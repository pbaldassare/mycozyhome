import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletTransactions } from "@/hooks/useWallet";

const typeLabels: Record<string, string> = {
  top_up: "Ricarica crediti",
  hold: "Prenotazione",
  refund: "Rimborso",
  release: "Erogazione al professionista",
  payout: "Incasso",
  dispute_refund: "Rimborso contestazione",
  dispute_payout: "Pagamento contestazione",
};

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { data: transactions = [], isLoading } = useWalletTransactions();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/client/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Indietro">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Storico pagamenti</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun movimento registrato</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-card rounded-2xl border border-border/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{typeLabels[tx.type] ?? tx.type}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(tx.created_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-bold text-lg shrink-0",
                      tx.direction === "credit" ? "text-success" : "text-destructive"
                    )}
                  >
                    {tx.direction === "credit" ? "+" : "-"}€{Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
