import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    type: "visa",
    last4: "4242",
    expiryMonth: "12",
    expiryYear: "26",
    isDefault: true,
  },
];

const cardLogos: Record<string, string> = {
  visa: "💳 Visa",
  mastercard: "💳 Mastercard",
  amex: "💳 Amex",
};

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => ({ ...pm, isDefault: pm.id === id }))
    );
    toast.success("Metodo di pagamento predefinito aggiornato");
  };

  const handleDelete = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    toast.success("Metodo di pagamento rimosso");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/client/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Metodi di Pagamento</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun metodo di pagamento salvato</p>
          </div>
        ) : (
          paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={cn(
                "bg-card rounded-2xl border p-4 transition-all",
                pm.isDefault ? "border-primary" : "border-border/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                    {cardLogos[pm.type]}
                  </div>
                  <div>
                    <p className="font-medium">•••• {pm.last4}</p>
                    <p className="text-sm text-muted-foreground">
                      Scade {pm.expiryMonth}/{pm.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pm.isDefault ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Predefinito
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(pm.id)}
                    >
                      Imposta
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(pm.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}

        <Button
          variant="outline"
          className="w-full gap-2 h-14 rounded-2xl border-dashed"
          onClick={() => toast.info("Integrazione Stripe in arrivo!")}
        >
          <Plus className="w-5 h-5" />
          Aggiungi Metodo di Pagamento
        </Button>
      </div>
    </div>
  );
}
