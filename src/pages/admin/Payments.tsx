import { useState } from "react";
import { Search, Filter, Download, Euro, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  type: "payment" | "payout" | "refund";
  amount: number;
  fee: number;
  net: number;
  from: string;
  to: string;
  service: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

const payments: Payment[] = [
  {
    id: "PAY-001",
    type: "payment",
    amount: 45,
    fee: 4.5,
    net: 40.5,
    from: "Paolo Colombo",
    to: "Maria Rossi",
    service: "Pulizia Casa",
    status: "completed",
    date: "4 Feb 2026, 15:30",
  },
  {
    id: "PAY-002",
    type: "payout",
    amount: 320,
    fee: 0,
    net: 320,
    from: "HomeServ",
    to: "Maria Rossi",
    service: "Payout Settimanale",
    status: "pending",
    date: "4 Feb 2026, 10:00",
  },
  {
    id: "PAY-003",
    type: "payment",
    amount: 50,
    fee: 5,
    net: 45,
    from: "Giulia Romano",
    to: "Francesca Neri",
    service: "Dog sitter",
    status: "completed",
    date: "3 Feb 2026, 20:15",
  },
  {
    id: "PAY-004",
    type: "refund",
    amount: -80,
    fee: 0,
    net: -80,
    from: "HomeServ",
    to: "Alessandro Ferrari",
    service: "Sanificazione (Rimborso)",
    status: "completed",
    date: "3 Feb 2026, 14:00",
  },
  {
    id: "PAY-005",
    type: "payment",
    amount: 24,
    fee: 2.4,
    net: 21.6,
    from: "Chiara Ricci",
    to: "Anna Bianchi",
    service: "Stiratura",
    status: "completed",
    date: "2 Feb 2026, 11:45",
  },
  {
    id: "PAY-006",
    type: "payment",
    amount: 32,
    fee: 3.2,
    net: 28.8,
    from: "Matteo Conti",
    to: "Luca Marino",
    service: "Dog Sitter",
    status: "failed",
    date: "2 Feb 2026, 09:00",
  },
];

const typeConfig = {
  payment: { label: "Pagamento", icon: ArrowUpRight, color: "text-success" },
  payout: { label: "Payout", icon: ArrowDownLeft, color: "text-primary" },
  refund: { label: "Rimborso", icon: ArrowDownLeft, color: "text-destructive" },
};

const statusConfig = {
  completed: { label: "Completato", className: "status-approved" },
  pending: { label: "In Attesa", className: "status-pending" },
  failed: { label: "Fallito", className: "status-rejected" },
};

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter(
    (p) =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments
    .filter((p) => p.type === "payment" && p.status === "completed")
    .reduce((acc, p) => acc + p.fee, 0);

  const totalVolume = payments
    .filter((p) => p.type === "payment" && p.status === "completed")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pagamenti</h1>
          <p className="text-muted-foreground mt-1">
            Monitora tutti i movimenti finanziari
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Esporta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Volume Totale</p>
          <p className="text-2xl font-bold">€{totalVolume.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Commissioni</p>
          <p className="text-2xl font-bold text-success">€{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Payout in Attesa</p>
          <p className="text-2xl font-bold text-warning">€320.00</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Rimborsi (mese)</p>
          <p className="text-2xl font-bold text-destructive">€80.00</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per ID, mittente o destinatario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtri
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Da / A</TableHead>
              <TableHead>Servizio</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-right">Netto</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => {
              const type = typeConfig[payment.type];
              const status = statusConfig[payment.status];
              const TypeIcon = type.icon;

              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className={cn("w-4 h-4", type.color)} />
                      <span className="text-sm">{type.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{payment.from}</p>
                      <p className="text-muted-foreground">→ {payment.to}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{payment.service}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={cn(
                        payment.type === "refund" ? "text-destructive" : ""
                      )}
                    >
                      €{Math.abs(payment.amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    €{payment.fee.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={cn(
                        payment.type === "refund" ? "text-destructive" : ""
                      )}
                    >
                      €{Math.abs(payment.net).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("status-badge", status.className)}>
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.date}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
