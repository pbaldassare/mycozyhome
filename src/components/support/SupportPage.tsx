import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, Paperclip, ArrowLeft, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppHeader } from "@/components/client/AppHeader";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { useAuth } from "@/hooks/useAuth";
import { useUserTickets, useTicketResponses, useSendTicketResponse } from "@/hooks/useSupportTickets";
import { useTicketHasUnread, markTicketAsRead } from "@/hooks/useUnreadSupport";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  open: "Aperto",
  in_progress: "In corso",
  resolved: "Risolto",
  closed: "Chiuso",
};

const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

function TicketCard({ ticket, onClick }: { ticket: any; onClick: () => void }) {
  const { data: hasUnread } = useTicketHasUnread(ticket.id, ticket.last_read_at);

  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-colors",
        hasUnread && "border-primary/30 bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {hasUnread && (
                <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />
              )}
              <h3 className="font-semibold truncate">{ticket.subject}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {ticket.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(ticket.created_at), "d MMM yyyy, HH:mm", { locale: it })}
            </p>
          </div>
          <Badge className={cn("shrink-0", statusColors[ticket.status])}>
            {statusLabels[ticket.status] || ticket.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface SupportPageProps {
  userType: "client" | "professional";
  backPath: string;
}

export function SupportPage({ userType, backPath }: SupportPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tickets, isLoading, refetch } = useUserTickets();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const handleOpenTicket = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    await markTicketAsRead(ticketId);
    queryClient.invalidateQueries({ queryKey: ["unread-support-count"] });
    queryClient.invalidateQueries({ queryKey: ["ticket-unread", ticketId] });
  };

  const selectedTicket = tickets?.find((t) => t.id === selectedTicketId);

  if (showNewTicket && user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title="Nuova richiesta" showBack onBack={() => setShowNewTicket(false)} />
        <div className="px-4 py-6">
          <SupportTicketForm
            userId={user.id}
            userType={userType}
            onSuccess={() => {
              setShowNewTicket(false);
              refetch();
            }}
          />
        </div>
      </div>
    );
  }

  if (selectedTicket && user) {
    return (
      <TicketChatView
        ticket={selectedTicket}
        userId={user.id}
        userType={userType}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Assistenza" showBack onBack={() => navigate(backPath)} />

      <div className="px-4 py-6 space-y-4">
        <Button className="w-full" onClick={() => setShowNewTicket(true)}>
          <Send className="h-4 w-4 mr-2" />
          Nuova richiesta di supporto
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Nessuna richiesta</p>
            <p className="text-sm text-muted-foreground">
              Le tue richieste di supporto appariranno qui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => handleOpenTicket(ticket.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketChatView({
  ticket,
  userId,
  userType,
  onBack,
}: {
  ticket: any;
  userId: string;
  userType: string;
  onBack: () => void;
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
        responderId: userId,
        responderType: userType === "client" ? "user" : "user",
        content: message.trim() || (attachment ? `Allegato: ${attachment.name}` : ""),
        attachmentFile: attachment || undefined,
      });
      setMessage("");
      setAttachment(null);
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile inviare il messaggio",
        variant: "destructive",
      });
    }
  };

  const isClosed = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        title={ticket.subject}
        showBack
        onBack={onBack}
        rightAction={
          <Badge className={cn(statusColors[ticket.status])}>
            {statusLabels[ticket.status]}
          </Badge>
        }
      />

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Original ticket message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm">{ticket.description}</p>
            <p className="text-xs opacity-70 mt-1">
              {format(new Date(ticket.created_at), "d MMM, HH:mm", { locale: it })}
            </p>
          </div>
        </div>

        {/* Responses */}
        {responses?.map((resp) => {
          const isUser = resp.responder_type === "user";
          return (
            <div key={resp.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {!isUser && (
                  <p className="text-xs font-semibold mb-1 opacity-70">Supporto</p>
                )}
                <p className="text-sm">{resp.content}</p>
                {resp.attachment_url && (
                  <a
                    href={resp.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 text-xs mt-2 underline",
                      isUser ? "text-primary-foreground/80" : "text-primary"
                    )}
                  >
                    <Paperclip className="h-3 w-3" />
                    {resp.attachment_name || "Allegato"}
                  </a>
                )}
                <p className={cn("text-xs mt-1", isUser ? "opacity-70" : "text-muted-foreground")}>
                  {format(new Date(resp.created_at), "d MMM, HH:mm", { locale: it })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <div className="border-t bg-background p-3">
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
              accept="image/*,.pdf,.doc,.docx"
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
              placeholder="Scrivi un messaggio..."
              className="rounded-full"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <Button
              size="icon"
              className="shrink-0 rounded-full"
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
      ) : (
        <div className="border-t bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Questa richiesta è stata chiusa
        </div>
      )}
    </div>
  );
}
