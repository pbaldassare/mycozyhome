import { useState } from "react";
import {
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Dispute {
  id: string;
  type: "complaint" | "refund" | "behavior" | "fraud";
  subject: string;
  description: string;
  reporter: {
    name: string;
    type: "client" | "professional";
  };
  reported: {
    name: string;
    type: "client" | "professional";
  };
  bookingId: string;
  status: "open" | "in_review" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
}

const disputes: Dispute[] = [
  {
    id: "DIS-001",
    type: "complaint",
    subject: "Servizio non completato",
    description: "Il professionista ha lasciato il lavoro a metà senza avvisare",
    reporter: { name: "Paolo Colombo", type: "client" },
    reported: { name: "Mario Rossi", type: "professional" },
    bookingId: "BK-045",
    status: "open",
    priority: "high",
    createdAt: "4 Feb 2026",
  },
  {
    id: "DIS-002",
    type: "refund",
    subject: "Richiesta rimborso",
    description: "Richiedo rimborso per servizio non soddisfacente",
    reporter: { name: "Giulia Romano", type: "client" },
    reported: { name: "Anna Bianchi", type: "professional" },
    bookingId: "BK-089",
    status: "in_review",
    priority: "medium",
    createdAt: "3 Feb 2026",
  },
  {
    id: "DIS-003",
    type: "behavior",
    subject: "Comportamento inappropriato",
    description: "Il cliente ha avuto un comportamento poco rispettoso",
    reporter: { name: "Francesca Neri", type: "professional" },
    reported: { name: "Alessandro Ferrari", type: "client" },
    bookingId: "BK-112",
    status: "open",
    priority: "urgent",
    createdAt: "4 Feb 2026",
  },
  {
    id: "DIS-004",
    type: "fraud",
    subject: "Sospetta frode",
    description: "Profilo potenzialmente falso con documenti sospetti",
    reporter: { name: "Sistema", type: "client" },
    reported: { name: "Giovanni Bianchi", type: "professional" },
    bookingId: "-",
    status: "in_review",
    priority: "urgent",
    createdAt: "2 Feb 2026",
  },
  {
    id: "DIS-005",
    type: "complaint",
    subject: "Ritardo eccessivo",
    description: "Professionista arrivato con 2 ore di ritardo",
    reporter: { name: "Chiara Ricci", type: "client" },
    reported: { name: "Luca Marino", type: "professional" },
    bookingId: "BK-156",
    status: "resolved",
    priority: "low",
    createdAt: "1 Feb 2026",
  },
];

const typeConfig = {
  complaint: { label: "Reclamo", icon: MessageSquare },
  refund: { label: "Rimborso", icon: AlertTriangle },
  behavior: { label: "Comportamento", icon: User },
  fraud: { label: "Frode", icon: AlertTriangle },
};

const statusConfig = {
  open: { label: "Aperto", className: "bg-warning/10 text-warning" },
  in_review: { label: "In Revisione", className: "bg-primary/10 text-primary" },
  resolved: { label: "Risolto", className: "bg-success/10 text-success" },
  dismissed: { label: "Archiviato", className: "bg-muted text-muted-foreground" },
};

const priorityConfig = {
  low: { label: "Bassa", className: "bg-muted text-muted-foreground" },
  medium: { label: "Media", className: "bg-primary/10 text-primary" },
  high: { label: "Alta", className: "bg-warning/10 text-warning" },
  urgent: { label: "Urgente", className: "bg-destructive/10 text-destructive" },
};

export default function Disputes() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredDisputes = disputes.filter((d) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return d.status === "open" || d.status === "in_review";
    return d.status === activeTab;
  });

  const counts = {
    all: disputes.length,
    active: disputes.filter((d) => d.status === "open" || d.status === "in_review").length,
    resolved: disputes.filter((d) => d.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Segnalazioni e Dispute</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci reclami, richieste rimborso e segnalazioni
        </p>
      </div>

      {/* Urgent Alert */}
      {disputes.some((d) => d.priority === "urgent" && d.status !== "resolved") && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">
              Ci sono segnalazioni urgenti da gestire
            </p>
            <p className="text-sm text-muted-foreground">
              {disputes.filter((d) => d.priority === "urgent" && d.status !== "resolved").length}{" "}
              casi richiedono attenzione immediata
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tutte ({counts.all})</TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Attive
            <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
              {counts.active}
            </span>
          </TabsTrigger>
          <TabsTrigger value="resolved">Risolte ({counts.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const type = typeConfig[dispute.type];
              const status = statusConfig[dispute.status];
              const priority = priorityConfig[dispute.priority];
              const TypeIcon = type.icon;

              return (
                <div
                  key={dispute.id}
                  className={cn(
                    "bg-card rounded-xl border p-5 transition-all",
                    dispute.priority === "urgent" && dispute.status !== "resolved"
                      ? "border-destructive/50"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl",
                          dispute.priority === "urgent"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {dispute.id}
                          </span>
                          <Badge variant="outline">{type.label}</Badge>
                          <span className={cn("status-badge", priority.className)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold">{dispute.subject}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dispute.description}
                        </p>

                        {/* Reporter / Reported */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            <strong>Segnalato da:</strong>{" "}
                            {dispute.reporter.name}{" "}
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {dispute.reporter.type === "client"
                                ? "Cliente"
                                : "Professionista"}
                            </Badge>
                          </span>
                          <span className="text-muted-foreground">
                            <strong>Contro:</strong> {dispute.reported.name}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dispute.createdAt}
                          </span>
                          {dispute.bookingId !== "-" && (
                            <span>Prenotazione: {dispute.bookingId}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={cn("status-badge", status.className)}>
                        {status.label}
                      </span>
                      {dispute.status !== "resolved" && dispute.status !== "dismissed" && (
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Dettagli
                          </Button>
                          <Button size="sm" className="bg-success hover:bg-success/90">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
