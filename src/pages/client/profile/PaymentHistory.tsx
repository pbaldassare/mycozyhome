import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  description: string;
  professionalName: string;
}

const mockPayments: Payment[] = [
  {
    id: "1",
    date: "3 Feb 2026",
    amount: 45,
    status: "completed",
    description: "Pulizia Casa - 3 ore",
    professionalName: "Maria Rossi",
  },
  {
    id: "2",
    date: "28 Gen 2026",
    amount: 30,
    status: "completed",
    description: "Stiratura - 2 ore",
    professionalName: "Anna Verdi",
  },
  {
    id: "3",
    date: "20 Gen 2026",
    amount: 60,
    status: "completed",
    description: "Pulizia Profonda - 4 ore",
    professionalName: "Maria Rossi",
  },
  {
    id: "4",
    date: "15 Gen 2026",
    amount: 25,
    status: "failed",
    description: "Dog sitter - 2.5 ore",
    professionalName: "Lucia Bianchi",
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle,
    label: "Completato",
    className: "text-success",
  },
  pending: {
    icon: Clock,
    label: "In attesa",
    className: "text-warning",
  },
  failed: {
    icon: XCircle,
    label: "Fallito",
    className: "text-destructive",
  },
};

export default function PaymentHistory() {
  const navigate = useNavigate();

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
          <h1 className="font-semibold text-lg">Storico Pagamenti</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {mockPayments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun pagamento effettuato</p>
          </div>
        ) : (
          mockPayments.map((payment) => {
            const status = statusConfig[payment.status];
            const StatusIcon = status.icon;
            return (
              <div
                key={payment.id}
                className="bg-card rounded-2xl border border-border/30 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.professionalName}
                    </p>
                  </div>
                  <p className="font-bold text-lg">€{payment.amount}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{payment.date}</p>
                  <div className={cn("flex items-center gap-1 text-sm", status.className)}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{status.label}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
