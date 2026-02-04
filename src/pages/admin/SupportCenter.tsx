import { useState, useEffect } from "react";
import {
  HelpCircle,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface SupportTicket {
  id: string;
  user_id: string;
  user_type: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  technical: "Tecnico",
  billing: "Pagamenti",
  service: "Servizio",
  report: "Segnalazione",
  other: "Altro",
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  open: { label: "Aperto", className: "bg-warning/10 text-warning", icon: Clock },
  in_progress: { label: "In corso", className: "bg-primary/10 text-primary", icon: MessageSquare },
  resolved: { label: "Risolto", className: "bg-success/10 text-success", icon: CheckCircle },
  closed: { label: "Chiuso", className: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Bassa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normale", className: "bg-primary/10 text-primary" },
  high: { label: "Alta", className: "bg-warning/10 text-warning" },
  urgent: { label: "Urgente", className: "bg-destructive/10 text-destructive" },
};

export default function SupportCenter() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setIsLoading(false);
  }

  async function updateTicketStatus(ticketId: string, newStatus: string) {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: newStatus })
      .eq("id", ticketId);

    if (!error) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      toast({ title: "Stato aggiornato" });
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    
    setIsReplying(true);
    
    const { error } = await supabase.from("ticket_responses").insert({
      ticket_id: selectedTicket.id,
      responder_id: "admin", // In produzione, usa l'ID admin reale
      responder_type: "admin",
      content: replyText.trim(),
    });

    if (!error) {
      // Update ticket to in_progress if it was open
      if (selectedTicket.status === "open") {
        await updateTicketStatus(selectedTicket.id, "in_progress");
      }
      toast({ title: "Risposta inviata" });
      setReplyText("");
    }
    
    setIsReplying(false);
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "open") return matchesSearch && ticket.status === "open";
    if (activeTab === "in_progress") return matchesSearch && ticket.status === "in_progress";
    if (activeTab === "resolved") return matchesSearch && (ticket.status === "resolved" || ticket.status === "closed");
    return matchesSearch;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Centro Assistenza</h1>
        <p className="text-muted-foreground mt-1">
          Gestisci le richieste di supporto da professionisti e clienti
        </p>
      </div>

      {/* Urgent tickets alert */}
      {tickets.some((t) => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed") && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Ticket urgenti in attesa</p>
            <p className="text-sm text-muted-foreground">
              {tickets.filter((t) => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed").length}{" "}
              ticket richiedono attenzione immediata
            </p>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca ticket..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tutti ({counts.all})</TabsTrigger>
          <TabsTrigger value="open" className="gap-2">
            Aperti
            <span className="bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
              {counts.open}
            </span>
          </TabsTrigger>
          <TabsTrigger value="in_progress">In corso ({counts.in_progress})</TabsTrigger>
          <TabsTrigger value="resolved">Risolti ({counts.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">Nessun ticket</p>
              <p className="text-sm text-muted-foreground">Non ci sono ticket in questa categoria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                const priority = priorityConfig[ticket.priority] || priorityConfig.normal;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={ticket.id}
                    className={cn(
                      "p-4 rounded-xl border bg-card cursor-pointer hover:border-primary/50 transition-colors",
                      ticket.priority === "urgent" && ticket.status !== "resolved" && ticket.status !== "closed"
                        ? "border-destructive/50"
                        : ""
                    )}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            ticket.priority === "urgent"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{categoryLabels[ticket.category] || ticket.category}</Badge>
                            <span className={cn("status-badge text-xs", priority.className)}>
                              {priority.label}
                            </span>
                          </div>
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.user_type === "client" ? "Cliente" : "Professionista"}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(ticket.created_at), {
                                addSuffix: true,
                                locale: it,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={cn("status-badge", status.className)}>{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {categoryLabels[selectedTicket.category] || selectedTicket.category}
                  </Badge>
                  <span
                    className={cn(
                      "status-badge",
                      statusConfig[selectedTicket.status]?.className
                    )}
                  >
                    {statusConfig[selectedTicket.status]?.label}
                  </span>
                </div>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedTicket.user_type === "client" ? "Cliente" : "Professionista"}
                  </span>
                  <span>
                    Creato {formatDistanceToNow(new Date(selectedTicket.created_at), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </span>
                </div>

                {/* Reply section */}
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <div className="space-y-3 pt-4 border-t">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Scrivi una risposta..."
                      className="min-h-[100px]"
                    />
                    <div className="flex items-center justify-between">
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => {
                          updateTicketStatus(selectedTicket.id, value);
                          setSelectedTicket({ ...selectedTicket, status: value });
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aperto</SelectItem>
                          <SelectItem value="in_progress">In corso</SelectItem>
                          <SelectItem value="resolved">Risolto</SelectItem>
                          <SelectItem value="closed">Chiuso</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={sendReply} disabled={!replyText.trim() || isReplying}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Invia risposta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
