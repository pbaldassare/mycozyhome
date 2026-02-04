import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  professionalName: string;
  serviceName: string;
}

export function ReviewForm({
  isOpen,
  onClose,
  onSubmit,
  professionalName,
  serviceName,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Valutazione richiesta",
        description: "Seleziona almeno una stella per inviare la recensione.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      toast({
        title: "Recensione inviata",
        description: "Grazie per il tuo feedback!",
      });
      onClose();
      setRating(0);
      setComment("");
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile inviare la recensione. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = [
    "",
    "Pessimo",
    "Scarso",
    "Nella media",
    "Buono",
    "Eccellente",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lascia una recensione</DialogTitle>
          <DialogDescription>
            Come è andato il servizio di <strong>{serviceName}</strong> con{" "}
            <strong>{professionalName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label>La tua valutazione</Label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoverRating || rating) >= star
                        ? "text-warning fill-warning"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {(rating > 0 || hoverRating > 0) && (
              <p className="text-center text-sm text-muted-foreground">
                {ratingLabels[hoverRating || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Il tuo commento (opzionale)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Racconta la tua esperienza..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Invio..." : "Invia recensione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
