import { useState } from "react";
import {
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DisputeEvidence {
  id: string;
  file_type: "image" | "document" | "chat_export";
  file_url: string;
  file_name: string;
  description?: string;
  created_at: string;
}

interface DisputeDetailProps {
  dispute: {
    id: string;
    reason: string;
    description: string;
    status: string;
    reporter: {
      id: string;
      name: string;
      type: "professional" | "client";
      avatar?: string;
    };
    reported: {
      id: string;
      name: string;
      type: "professional" | "client";
      avatar?: string;
    };
    evidence: DisputeEvidence[];
    createdAt: string;
    bookingId?: string;
    adminNotes?: string;
  };
  onResolve: (resolution: "reporter" | "reported", notes: string) => void;
  onReject: (notes: string) => void;
  onEscalate: (notes: string) => void;
}

const reasonLabels: Record<string, string> = {
  no_show: "Mancata presentazione",
  poor_quality: "Qualità scadente",
  inappropriate_behavior: "Comportamento inappropriato",
  payment_issue: "Problema pagamento",
  damage: "Danni causati",
  other: "Altro",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "Aperta", className: "bg-warning/10 text-warning" },
  investigating: { label: "In indagine", className: "bg-primary/10 text-primary" },
  resolved_reporter: { label: "Risolta (segnalante)", className: "bg-success/10 text-success" },
  resolved_reported: { label: "Risolta (segnalato)", className: "bg-success/10 text-success" },
  rejected: { label: "Respinta", className: "bg-muted text-muted-foreground" },
  escalated: { label: "Escalata", className: "bg-destructive/10 text-destructive" },
};

export function DisputeDetail({ dispute, onResolve, onReject, onEscalate }: DisputeDetailProps) {
  const [adminNotes, setAdminNotes] = useState(dispute.adminNotes || "");
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveFor, setResolveFor] = useState<"reporter" | "reported">("reporter");

  const status = statusConfig[dispute.status] || statusConfig.open;
  const isOpen = dispute.status === "open" || dispute.status === "investigating";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-mono text-muted-foreground">
              {dispute.id.slice(0, 8).toUpperCase()}
            </span>
            <Badge variant="outline">{reasonLabels[dispute.reason] || dispute.reason}</Badge>
            <span className={cn("status-badge", status.className)}>{status.label}</span>
          </div>
          <h2 className="text-xl font-bold">Dettaglio Disputa</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {dispute.createdAt}
        </div>
      </div>

      {/* Parties */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-xs text-muted-foreground mb-2">SEGNALANTE</p>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={dispute.reporter.avatar} />
              <AvatarFallback>
                {dispute.reporter.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{dispute.reporter.name}</p>
              <Badge variant="secondary" className="text-xs">
                {dispute.reporter.type === "client" ? "Cliente" : "Professionista"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card">
          <p className="text-xs text-muted-foreground mb-2">SEGNALATO</p>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={dispute.reported.avatar} />
              <AvatarFallback>
                {dispute.reported.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{dispute.reported.name}</p>
              <Badge variant="secondary" className="text-xs">
                {dispute.reported.type === "client" ? "Cliente" : "Professionista"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 rounded-xl border bg-card">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Descrizione
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {dispute.description}
        </p>
      </div>

      {/* Evidence */}
      {dispute.evidence.length > 0 && (
        <div className="p-4 rounded-xl border bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Prove allegate ({dispute.evidence.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dispute.evidence.map((evidence) => (
              <a
                key={evidence.id}
                href={evidence.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:border-primary transition-colors"
              >
                {evidence.file_type === "image" ? (
                  <img
                    src={evidence.file_url}
                    alt={evidence.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-3">
                    <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-center text-muted-foreground truncate w-full">
                      {evidence.file_name}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Chat history button */}
      <Button variant="outline" className="w-full">
        <MessageSquare className="w-4 h-4 mr-2" />
        Visualizza cronologia chat
      </Button>

      <Separator />

      {/* Admin notes */}
      <div className="space-y-3">
        <h3 className="font-semibold">Note Admin</h3>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Aggiungi note interne sulla gestione del caso..."
          className="min-h-[100px]"
          disabled={!isOpen}
        />
      </div>

      {/* Actions */}
      {isOpen && (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setResolveFor("reporter");
              setShowResolveDialog(true);
            }}
            className="bg-success hover:bg-success/90"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Risolvi a favore segnalante
          </Button>
          <Button
            onClick={() => {
              setResolveFor("reported");
              setShowResolveDialog(true);
            }}
            variant="outline"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Risolvi a favore segnalato
          </Button>
          <Button variant="outline" onClick={() => onReject(adminNotes)}>
            <XCircle className="w-4 h-4 mr-2" />
            Respingi
          </Button>
          <Button variant="destructive" onClick={() => onEscalate(adminNotes)}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Escalation
          </Button>
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma risoluzione</DialogTitle>
            <DialogDescription>
              Stai risolvendo la disputa a favore del{" "}
              {resolveFor === "reporter" ? "segnalante" : "segnalato"}. Questa azione non può essere
              annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                onResolve(resolveFor, adminNotes);
                setShowResolveDialog(false);
              }}
            >
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
