import { Check, X, Eye, FileText, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Professional {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  services: string[];
  city: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "suspended";
  documentsCount: number;
  rating?: number;
  reviewsCount?: number;
  submittedAt: string;
}

interface ProfessionalCardProps {
  professional: Professional;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "bg-straw/30 text-straw-dark border border-straw/50" },
  in_review: { label: "In revisione", className: "bg-primary/15 text-primary border border-primary/30" },
  approved: { label: "Approvato", className: "bg-sage/20 text-sage-dark border border-sage/50" },
  rejected: { label: "Rifiutato", className: "bg-blush/20 text-blush-dark border border-blush/50" },
  suspended: { label: "Sospeso", className: "bg-muted text-muted-foreground" },
};

const serviceLabels: Record<string, string> = {
  cleaning: "Pulizia Casa",
  office_cleaning: "Pulizia Uffici",
  ironing: "Stiratura",
  sanitization: "Sanificazione",
  dog_sitter: "Dog Sitter",
};

export function ProfessionalCard({
  professional,
  onApprove,
  onReject,
  onView,
}: ProfessionalCardProps) {
  const status = statusConfig[professional.status] || statusConfig.pending;

  return (
    <div className="bg-card rounded-2xl border border-border/30 p-5 transition-all duration-200 hover:shadow-lg hover:border-border/50 animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 border border-primary/10">
          {professional.avatar ? (
            <img
              src={professional.avatar}
              alt={professional.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            professional.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground truncate text-base">
                {professional.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {professional.email}
              </p>
            </div>
            <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium flex-shrink-0", status.className)}>
              {status.label}
            </span>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {professional.services.map((service) => (
              <Badge key={service} variant="secondary" className="text-xs rounded-lg bg-muted/50">
                {serviceLabels[service] || service}
              </Badge>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {professional.city}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {professional.documentsCount} doc
            </span>
            {professional.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">{professional.rating}</span>
                <span className="text-muted-foreground">({professional.reviewsCount})</span>
              </span>
            )}
          </div>

          {/* Submitted date */}
          <p className="text-xs text-muted-foreground mt-2.5">
            Inviato il {professional.submittedAt}
          </p>
        </div>
      </div>

      {/* Actions */}
      {(professional.status === "pending" || professional.status === "in_review") && (
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl border-border/50"
            onClick={() => onView?.(professional.id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizza
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onReject?.(professional.id)}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-success hover:bg-success/90"
            onClick={() => onApprove?.(professional.id)}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}

      {professional.status !== "pending" && professional.status !== "in_review" && (
        <div className="mt-5 pt-4 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-border/50"
            onClick={() => onView?.(professional.id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizza Dettagli
          </Button>
        </div>
      )}
    </div>
  );
}
