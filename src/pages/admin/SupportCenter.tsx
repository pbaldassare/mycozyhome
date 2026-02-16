import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  AlertTriangle,
  Send,
  Paperclip,
  X,
  Loader2,
  ArrowLeft,
  Plus,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTicketResponses, useSendTicketResponse } from "@/hooks/useSupportTickets";

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
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Bassa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normale", className: "bg-primary/10 text-primary" },
  high: { label: "Alta", className: "bg-warning/10 text-warning" },
  urgent: { label: "Urgente", className: "bg-destructive/10 text-destructive" },
};

interface UserOption {
  id: string;
  user_id: string;
  label: string;
  subtitle: string;
}

export default function SupportCenter() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [chatStep, setChatStep] = useState<"type" | "user" | "details">("type");
  const [chatUserType, setChatUserType] = useState<"client" | "professional">("client");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [newChat, setNewChat] = useState({ subject: "", description: "", category: "other", priority: "normal" });
  const [isCreating, setIsCreating] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

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
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      toast({ title: "Stato aggiornato" });
    }
  }

  async function loadUsers(type: "client" | "professional") {
    setIsLoadingUsers(true);
    if (type === "client") {
      const { data } = await supabase.from("client_profiles").select("id, user_id, first_name, last_name, email");
      setUserOptions(
        (data || []).map((u) => ({
          id: u.id,
          user_id: u.user_id,
          label: [u.first_name, u.last_name].filter(Boolean).join(" ") || "Cliente senza nome",
          subtitle: u.email || u.user_id,
        }))
      );
    } else {
      const { data } = await supabase.from("professionals").select("id, user_id, first_name, last_name, email");
      setUserOptions(
        (data || []).map((u) => ({
          id: u.id,
          user_id: u.user_id,
          label: `${u.first_name} ${u.last_name}`,
          subtitle: u.email || u.user_id,
        }))
      );
    }
    setIsLoadingUsers(false);
  }

  function handleSelectUserType(type: "client" | "professional") {
    setChatUserType(type);
    setChatStep("user");
    loadUsers(type);
  }

  function handleSelectUser(u: UserOption) {
    setSelectedUser(u);
    setChatStep("details");
  }

  function resetChatDialog() {
    setChatStep("type");
    setSelectedUser(null);
    setUserSearch("");
    setNewChat({ subject: "", description: "", category: "other", priority: "normal" });
    setShowNewChatDialog(false);
  }

  async function handleCreateChat() {
    if (!selectedUser || !newChat.subject.trim() || !newChat.description.trim()) {
      toast({ title: "Errore", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: selectedUser.user_id,
      user_type: chatUserType,
      category: newChat.category,
      subject: newChat.subject.trim(),
      description: newChat.description.trim(),
      priority: newChat.priority,
    });
    if (error) {
      toast({ title: "Errore", description: "Impossibile creare la chat", variant: "destructive" });
    } else {
      toast({ title: "Chat creata" });
      resetChatDialog();
      loadTickets();
    }
    setIsCreating(false);
  }

  const filteredUsers = userOptions.filter(
    (u) =>
      u.label.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.subtitle.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "open") return matchesSearch && ticket.status === "open";
    if (activeTab === "in_progress") return matchesSearch && ticket.status === "in_progress";
    if (activeTab === "resolved") return matchesSearch && ticket.status === "resolved";
    return matchesSearch;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  // Show chat view when ticket is selected
  if (selectedTicket && user) {
    return (
      <AdminTicketChat
        ticket={selectedTicket}
        adminId={user.id}
        onBack={() => {
          setSelectedTicket(null);
          loadTickets();
        }}
        onStatusChange={(status) => updateTicketStatus(selectedTicket.id, status)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Segnalazioni</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci le richieste di supporto e le segnalazioni da professionisti e clienti
          </p>
        </div>
        <Dialog open={showNewChatDialog} onOpenChange={(open) => { if (!open) resetChatDialog(); else setShowNewChatDialog(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuova chat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {chatStep === "type" && "Seleziona tipo utente"}
                {chatStep === "user" && (chatUserType === "client" ? "Seleziona cliente" : "Seleziona professionista")}
                {chatStep === "details" && `Chat con ${selectedUser?.label}`}
              </DialogTitle>
            </DialogHeader>

            {chatStep === "type" && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleSelectUserType("client")}
                >
                  <User className="w-8 h-8 text-primary" />
                  <span className="font-semibold">Cliente</span>
                </button>
                <button
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleSelectUserType("professional")}
                >
                  <HelpCircle className="w-8 h-8 text-primary" />
                  <span className="font-semibold">Professionista</span>
                </button>
              </div>
            )}

            {chatStep === "user" && (
              <div className="space-y-3 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cerca per nome o email..."
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {isLoadingUsers ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Caricamento...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nessun utente trovato</div>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        onClick={() => handleSelectUser(u)}
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {u.label.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.subtitle}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setChatStep("type")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
                </Button>
              </div>
            )}

            {chatStep === "details" && (
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Oggetto *</label>
                  <Input
                    value={newChat.subject}
                    onChange={(e) => setNewChat((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Breve descrizione"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Messaggio *</label>
                  <Textarea
                    value={newChat.description}
                    onChange={(e) => setNewChat((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Scrivi il primo messaggio..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Categoria</label>
                    <Select value={newChat.category} onValueChange={(v) => setNewChat((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Tecnico</SelectItem>
                        <SelectItem value="billing">Pagamenti</SelectItem>
                        <SelectItem value="service">Servizio</SelectItem>
                        <SelectItem value="report">Segnalazione</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priorità</label>
                    <Select value={newChat.priority} onValueChange={(v) => setNewChat((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Bassa</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setChatStep("user")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
                  </Button>
                  <Button onClick={handleCreateChat} disabled={isCreating} className="flex-1">
                    {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    Avvia chat
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {tickets.some((t) => t.priority === "urgent" && t.status !== "resolved") && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Ticket urgenti in attesa</p>
            <p className="text-sm text-muted-foreground">
              {tickets.filter((t) => t.priority === "urgent" && t.status !== "resolved").length}{" "}
              ticket richiedono attenzione immediata
            </p>
          </div>
        </div>
      )}

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
                      ticket.priority === "urgent" && ticket.status !== "resolved"
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
    </div>
  );
}

function AdminTicketChat({
  ticket,
  adminId,
  onBack,
  onStatusChange,
}: {
  ticket: SupportTicket;
  adminId: string;
  onBack: () => void;
  onStatusChange: (status: string) => void;
}) {
  const { data: responses } = useTicketResponses(ticket.id);
  const sendResponse = useSendTicketResponse();
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  const handleSend = async () => {
    if (!message.trim() && !attachment) return;

    try {
      await sendResponse.mutateAsync({
        ticketId: ticket.id,
        responderId: adminId,
        responderType: "admin",
        content: message.trim() || (attachment ? `Allegato: ${attachment.name}` : ""),
        attachmentFile: attachment || undefined,
      });
      setMessage("");
      setAttachment(null);

      if (ticket.status === "open") {
        onStatusChange("in_progress");
      }
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile inviare il messaggio",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {categoryLabels[ticket.category] || ticket.category}
            </Badge>
            <Badge variant="outline">
              {ticket.user_type === "client" ? "Cliente" : "Professionista"}
            </Badge>
            <Badge className={cn(priorityConfig[ticket.priority]?.className)}>
              {priorityConfig[ticket.priority]?.label}
            </Badge>
          </div>
        </div>
        <Select value={ticket.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Aperto</SelectItem>
            <SelectItem value="in_progress">In corso</SelectItem>
            <SelectItem value="resolved">Risolto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chat area */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-4 space-y-3">
          {/* Original message */}
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {ticket.user_type === "client" ? "Cliente" : "Professionista"}
              </p>
              <p className="text-sm">{ticket.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(ticket.created_at), "d MMM yyyy, HH:mm", { locale: it })}
              </p>
            </div>
          </div>

          {/* Responses */}
          {responses?.map((resp) => {
            const isAdmin = resp.responder_type === "admin";
            return (
              <div key={resp.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3",
                    isAdmin
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}
                >
                  <p className={cn("text-xs font-semibold mb-1", isAdmin ? "opacity-70" : "text-muted-foreground")}>
                    {isAdmin ? "Admin" : ticket.user_type === "client" ? "Cliente" : "Professionista"}
                  </p>
                  <p className="text-sm">{resp.content}</p>
                  {resp.attachment_url && (
                    <a
                      href={resp.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-xs mt-2 underline",
                        isAdmin ? "text-primary-foreground/80" : "text-primary"
                      )}
                    >
                      <Paperclip className="h-3 w-3" />
                      {resp.attachment_name || "Allegato"}
                    </a>
                  )}
                  <p className={cn("text-xs mt-1", isAdmin ? "opacity-70" : "text-muted-foreground")}>
                    {format(new Date(resp.created_at), "d MMM, HH:mm", { locale: it })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3">
          {attachment && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-muted rounded-lg text-sm">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="truncate flex-1">{attachment.name}</span>
              <button onClick={() => setAttachment(null)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 10 * 1024 * 1024) {
                    toast({ title: "File troppo grande", description: "Max 10MB", variant: "destructive" });
                    return;
                  }
                  setAttachment(file);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Rispondi al ticket..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <Button
              size="icon"
              className="shrink-0"
              disabled={(!message.trim() && !attachment) || sendResponse.isPending}
              onClick={handleSend}
            >
              {sendResponse.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
