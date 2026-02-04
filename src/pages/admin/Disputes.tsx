import { useState, useEffect } from "react";
import {
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { DisputeDetail } from "@/components/admin/DisputeDetail";

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: string;
  reporter_id: string;
  reporter_type: string;
  reported_id: string;
  reported_type: string;
  booking_id?: string;
  conversation_id?: string;
  admin_notes?: string;
  created_at: string;
}

interface DisputeEvidence {
  id: string;
  file_type: string;
  file_url: string;
  file_name: string;
  description?: string;
  created_at: string;
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

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [evidence, setEvidence] = useState<Record<string, DisputeEvidence[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDisputes(data);
      
      // Load evidence for all disputes
      const evidencePromises = data.map(async (dispute) => {
        const { data: evidenceData } = await supabase
          .from("dispute_evidence")
          .select("*")
          .eq("dispute_id", dispute.id);
        return { disputeId: dispute.id, evidence: evidenceData || [] };
      });
      
      const evidenceResults = await Promise.all(evidencePromises);
      const evidenceMap: Record<string, DisputeEvidence[]> = {};
      evidenceResults.forEach(({ disputeId, evidence }) => {
        evidenceMap[disputeId] = evidence;
      });
      setEvidence(evidenceMap);
    }
    setIsLoading(false);
  }

  async function handleResolve(disputeId: string, resolution: "reporter" | "reported", notes: string) {
    const { error } = await supabase
      .from("disputes")
      .update({
        status: resolution === "reporter" ? "resolved_reporter" : "resolved_reported",
        admin_notes: notes,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", disputeId);

    if (!error) {
      toast({ title: "Disputa risolta" });
      loadDisputes();
      setSelectedDispute(null);
    }
  }

  async function handleReject(disputeId: string, notes: string) {
    const { error } = await supabase
      .from("disputes")
      .update({
        status: "rejected",
        admin_notes: notes,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", disputeId);

    if (!error) {
      toast({ title: "Disputa respinta" });
      loadDisputes();
      setSelectedDispute(null);
    }
  }

  async function handleEscalate(disputeId: string, notes: string) {
    const { error } = await supabase
      .from("disputes")
      .update({
        status: "escalated",
        admin_notes: notes,
      })
      .eq("id", disputeId);

    if (!error) {
      toast({ title: "Disputa escalata", variant: "destructive" });
      loadDisputes();
      setSelectedDispute(null);
    }
  }

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch = dispute.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && (dispute.status === "open" || dispute.status === "investigating");
    if (activeTab === "resolved") return matchesSearch && (dispute.status.startsWith("resolved") || dispute.status === "rejected");
    if (activeTab === "escalated") return matchesSearch && dispute.status === "escalated";
    return matchesSearch;
  });

  const counts = {
    all: disputes.length,
    active: disputes.filter((d) => d.status === "open" || d.status === "investigating").length,
    resolved: disputes.filter((d) => d.status.startsWith("resolved") || d.status === "rejected").length,
    escalated: disputes.filter((d) => d.status === "escalated").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Segnalazioni e Dispute</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci reclami, segnalazioni e richieste di intervento
        </p>
      </div>

      {/* Urgent Alert */}
      {disputes.some((d) => d.status === "escalated") && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Dispute escalate</p>
            <p className="text-sm text-muted-foreground">
              {counts.escalated} casi richiedono intervento urgente
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca dispute..."
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tutte ({counts.all})</TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Attive
            <span className="bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
              {counts.active}
            </span>
          </TabsTrigger>
          <TabsTrigger value="escalated" className="gap-2">
            Escalate
            {counts.escalated > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {counts.escalated}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Risolte ({counts.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">Nessuna disputa</p>
              <p className="text-sm text-muted-foreground">Non ci sono dispute in questa categoria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map((dispute) => {
                const status = statusConfig[dispute.status] || statusConfig.open;
                const disputeEvidence = evidence[dispute.id] || [];

                return (
                  <div
                    key={dispute.id}
                    className={cn(
                      "bg-card rounded-xl border p-5 transition-all cursor-pointer hover:border-primary/50",
                      dispute.status === "escalated" ? "border-destructive/50" : "border-border"
                    )}
                    onClick={() => setSelectedDispute(dispute)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-2.5 rounded-xl",
                            dispute.status === "escalated"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">
                              {dispute.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge variant="outline">
                              {reasonLabels[dispute.reason] || dispute.reason}
                            </Badge>
                            {disputeEvidence.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {disputeEvidence.length} prove
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {dispute.description}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-muted-foreground">
                              <strong>Da:</strong>{" "}
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {dispute.reporter_type === "client" ? "Cliente" : "Professionista"}
                              </Badge>
                            </span>
                            <span className="text-muted-foreground">
                              <strong>Contro:</strong>{" "}
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {dispute.reported_type === "client" ? "Cliente" : "Professionista"}
                              </Badge>
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(dispute.created_at), {
                                addSuffix: true,
                                locale: it,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={cn("status-badge", status.className)}>{status.label}</span>
                        {(dispute.status === "open" || dispute.status === "investigating") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDispute(dispute);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Gestisci
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dispute Detail Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDispute && (
            <DisputeDetail
              dispute={{
                id: selectedDispute.id,
                reason: selectedDispute.reason,
                description: selectedDispute.description,
                status: selectedDispute.status,
                reporter: {
                  id: selectedDispute.reporter_id,
                  name: "Utente Segnalante",
                  type: selectedDispute.reporter_type as "professional" | "client",
                },
                reported: {
                  id: selectedDispute.reported_id,
                  name: "Utente Segnalato",
                  type: selectedDispute.reported_type as "professional" | "client",
                },
                evidence: (evidence[selectedDispute.id] || []).map((e) => ({
                  ...e,
                  file_type: e.file_type as "image" | "document" | "chat_export",
                })),
                createdAt: formatDistanceToNow(new Date(selectedDispute.created_at), {
                  addSuffix: true,
                  locale: it,
                }),
                bookingId: selectedDispute.booking_id,
                adminNotes: selectedDispute.admin_notes,
              }}
              onResolve={(resolution, notes) => handleResolve(selectedDispute.id, resolution, notes)}
              onReject={(notes) => handleReject(selectedDispute.id, notes)}
              onEscalate={(notes) => handleEscalate(selectedDispute.id, notes)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
