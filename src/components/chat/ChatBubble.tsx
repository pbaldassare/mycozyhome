import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Check, CheckCheck, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  content: string;
  timestamp: Date;
  isSent: boolean;
  isRead?: boolean;
  isBlocked?: boolean;
  imageUrl?: string;
  senderName?: string;
  showAvatar?: boolean;
}

export function ChatBubble({
  content,
  timestamp,
  isSent,
  isRead = false,
  isBlocked = false,
  imageUrl,
  senderName,
  showAvatar = false,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] relative",
          isSent ? "items-end" : "items-start"
        )}
      >
        {!isSent && senderName && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 block ml-1">
            {senderName}
          </span>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
            isBlocked && "border-2 border-warning/50"
          )}
        >
          {isBlocked && (
            <div className="flex items-center gap-1 text-xs mb-1 opacity-80">
              <AlertTriangle className="h-3 w-3" />
              <span>Contenuto filtrato</span>
            </div>
          )}
          
          {imageUrl && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Immagine allegata"
                className="max-w-full h-auto rounded-lg"
                loading="lazy"
              />
            </div>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              isSent ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isSent ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {format(timestamp, "HH:mm", { locale: it })}
            </span>
            {isSent && (
              isRead ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
              ) : (
                <Check className="h-3 w-3 text-primary-foreground/70" />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
