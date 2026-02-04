import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Phone, MoreVertical, Flag, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppHeader } from "@/components/client/AppHeader";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { filterMessageContent } from "@/lib/content-filter";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: string;
  created_at: string;
  is_read: boolean;
  is_blocked: boolean;
  file_url: string | null;
  message_type: string;
}

interface Conversation {
  id: string;
  professional_id: string;
  client_id: string;
  professional?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// Mock data for demo
const mockConversation: Conversation = {
  id: "conv-1",
  professional_id: "prof-1",
  client_id: "client-1",
  professional: {
    first_name: "Maria",
    last_name: "Rossi",
    avatar_url: null,
  },
};

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Ciao! Ho visto il tuo profilo e vorrei prenotare un servizio di pulizie per sabato.",
    sender_id: "client-1",
    sender_type: "client",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    is_read: true,
    is_blocked: false,
    file_url: null,
    message_type: "text",
  },
  {
    id: "2",
    content: "Ciao! Certo, sabato sono disponibile. A che ora ti farebbe comodo?",
    sender_id: "prof-1",
    sender_type: "professional",
    created_at: new Date(Date.now() - 3600000 * 23).toISOString(),
    is_read: true,
    is_blocked: false,
    file_url: null,
    message_type: "text",
  },
  {
    id: "3",
    content: "Perfetto! Alle 9 di mattina andrebbe bene. L'appartamento è di circa 80mq.",
    sender_id: "client-1",
    sender_type: "client",
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    is_read: true,
    is_blocked: false,
    file_url: null,
    message_type: "text",
  },
  {
    id: "4",
    content: "Va benissimo! Per un appartamento di quelle dimensioni ci vorranno circa 3 ore. Vuoi procedere con la prenotazione?",
    sender_id: "prof-1",
    sender_type: "professional",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_read: true,
    is_blocked: false,
    file_url: null,
    message_type: "text",
  },
];

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Oggi";
  if (isYesterday(date)) return "Ieri";
  return format(date, "d MMMM yyyy", { locale: it });
}

function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();
  
  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.created_at), "yyyy-MM-dd");
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  });

  return groups;
}

export default function ClientChat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [conversation, setConversation] = useState<Conversation | null>(mockConversation);
  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = "client-1"; // Mock current user

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, imageFile?: File) => {
    if (!conversation) return;

    const filterResult = filterMessageContent(content);
    
    // Create optimistic message
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      content: filterResult.isBlocked ? filterResult.sanitizedContent : content,
      sender_id: currentUserId,
      sender_type: "client",
      created_at: new Date().toISOString(),
      is_read: false,
      is_blocked: filterResult.isBlocked,
      file_url: null,
      message_type: imageFile ? "image" : "text",
    };

    setMessages((prev) => [...prev, newMessage]);

    // In production, save to database
    // const { error } = await supabase.from("messages").insert({
    //   conversation_id: conversation.id,
    //   content: filterResult.sanitizedContent,
    //   sender_id: currentUserId,
    //   sender_type: "client",
    //   is_blocked: filterResult.isBlocked,
    //   original_content: filterResult.isBlocked ? content : null,
    // });
  };

  const handleReport = () => {
    navigate(`/client/report?conversation=${conversationId}`);
    toast({
      title: "Segnalazione",
      description: "Puoi segnalare questa conversazione se ritieni ci siano violazioni.",
    });
  };

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Conversazione non trovata</p>
      </div>
    );
  }

  const professional = conversation.professional;
  const initials = professional
    ? `${professional.first_name[0]}${professional.last_name[0]}`
    : "??";
  const fullName = professional
    ? `${professional.first_name} ${professional.last_name}`
    : "Professionista";

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center gap-3 h-14 px-4">
          <AppHeader showBack className="flex-none bg-transparent border-none" />
          
          <button
            onClick={() => navigate(`/client/professional/${conversation.professional_id}`)}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={professional?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0">
              <h1 className="font-semibold truncate">{fullName}</h1>
              <p className="text-xs text-success">Online</p>
            </div>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(`/client/professional/${conversation.professional_id}`)}>
                <Info className="h-4 w-4 mr-2" />
                Vedi profilo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                Segnala
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Safety Banner */}
      <div className="bg-info/10 text-info text-xs px-4 py-2 text-center">
        🔒 Per la tua sicurezza, comunica solo tramite questa chat. Non condividere dati personali.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {Array.from(groupedMessages.entries()).map(([dateKey, msgs]) => (
          <div key={dateKey}>
            {/* Date Header */}
            <div className="flex justify-center my-4">
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {formatDateHeader(msgs[0].created_at)}
              </span>
            </div>
            
            {/* Messages for this date */}
            {msgs.map((msg) => (
              <ChatBubble
                key={msg.id}
                content={msg.content}
                timestamp={new Date(msg.created_at)}
                isSent={msg.sender_id === currentUserId}
                isRead={msg.is_read}
                isBlocked={msg.is_blocked}
                imageUrl={msg.file_url || undefined}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
