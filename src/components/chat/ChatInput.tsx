import { useState, useRef } from "react";
import { Send, Paperclip, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { filterMessageContent, getBlockedMessage } from "@/lib/content-filter";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, imageFile?: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Scrivi un messaggio...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() && !imageFile) return;

    const filterResult = filterMessageContent(message);
    
    if (filterResult.isBlocked) {
      setWarning(getBlockedMessage(filterResult.blockedReasons));
      // Send sanitized version
      onSend(filterResult.sanitizedContent, imageFile || undefined);
    } else {
      onSend(message.trim(), imageFile || undefined);
    }

    setMessage("");
    setImagePreview(null);
    setImageFile(null);
    setTimeout(() => setWarning(null), 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setWarning("L'immagine non può superare 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-border/30 bg-card p-3 safe-area-pb">
      {warning && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-warning/10 text-warning text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="Anteprima"
            className="h-20 w-auto rounded-lg border border-border/30"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none rounded-2xl border-border/30 bg-muted/50 py-3 px-4"
          rows={1}
        />

        <Button
          size="icon"
          className="h-10 w-10 rounded-xl flex-shrink-0"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !imageFile)}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
