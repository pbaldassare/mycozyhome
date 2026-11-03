import { useState } from "react";
import { Star, Camera, X } from "lucide-react";
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

const MAX_PHOTOS = 3;

export interface ReviewInput {
  rating: number;
  comment: string;
  punctuality: number;
  quality: number;
  kindness: number;
  photos: File[];
}

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: ReviewInput) => Promise<void>;
  professionalName: string;
  serviceName: string;
}

const ratingLabels = ["", "Pessimo", "Scarso", "Nella media", "Buono", "Eccellente"];

function Stars({ value, onChange, size = "h-8 w-8", label }: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} stelle`}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star className={cn(size, value >= star ? "text-warning fill-warning" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ isOpen, onClose, onSubmit, professionalName, serviceName }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [quality, setQuality] = useState(0);
  const [kindness, setKindness] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setRating(0); setPunctuality(0); setQuality(0); setKindness(0); setComment(""); setPhotos([]);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Valutazione richiesta", description: "Seleziona almeno una stella.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment, punctuality, quality, kindness, photos: photos.map((p) => p.file) });
      toast({ title: "Recensione inviata", description: "Grazie per il tuo feedback!" });
      reset();
      onClose();
    } catch {
      // L'errore lo mostra già chi salva la recensione.
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    setPhotos((prev) =>
      [...prev, ...images.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS));
  };

  const details = [
    { label: "Puntualità", value: punctuality, set: setPunctuality },
    { label: "Qualità del lavoro", value: quality, set: setQuality },
    { label: "Cordialità", value: kindness, set: setKindness },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lascia una recensione</DialogTitle>
          <DialogDescription>
            Come è andato il servizio di <strong>{serviceName}</strong> con <strong>{professionalName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2 flex flex-col items-center">
            <Label>Valutazione complessiva</Label>
            <Stars value={rating} onChange={setRating} label="Valutazione complessiva" />
            {rating > 0 && <p className="text-sm text-muted-foreground">{ratingLabels[rating]}</p>}
          </div>

          <div className="rounded-2xl bg-secondary p-4 space-y-3">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{d.label}</span>
                <Stars value={d.value} onChange={d.set} size="h-5 w-5" label={d.label} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Il tuo commento (opzionale)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Racconta la tua esperienza..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label>Foto del risultato (max {MAX_PHOTOS})</Label>
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo, i) => (
                <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted">
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Rimuovi foto"
                    onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="h-20 w-20 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center text-primary cursor-pointer hover:bg-primary-light">
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] mt-1">Aggiungi</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Invio..." : "Invia recensione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
