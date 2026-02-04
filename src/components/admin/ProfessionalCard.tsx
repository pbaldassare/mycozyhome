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
  pending: { label: "In attesa", className: "status-pending" },
  in_review: { label: "In revisione", className: "bg-info/10 text-info" },
  approved: { label: "Approvato", className: "status-approved" },
  rejected: { label: "Rifiutato", className: "status-rejected" },
  suspended: { label: "Sospeso", className: "bg-muted text-muted-foreground" },
};

const serviceLabels: Record<string, string> = {
  cleaning: "Pulizia Casa",
  office_cleaning: "Pulizia Uffici",
  ironing: "Stiratura",
  sanitization: "Sanificazione",
  babysitter: "Babysitter",
  dog_sitter: "Dog Sitter",
};

export function ProfessionalCard({
  professional,
  onApprove,
  onReject,
  onView,
}: ProfessionalCardProps) {
  const status = statusConfig[professional.status];

  return (
    <div className="bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
          {professional.avatar ? (
            <img
              src={professional.avatar}
              alt={professional.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            professional.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {professional.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {professional.email}
              </p>
            </div>
            <span className={cn("status-badge flex-shrink-0", status.className)}>
              {status.label}
            </span>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {professional.services.map((service) => (
              <Badge key={service} variant="secondary" className="text-xs">
                {serviceLabels[service] || service}
              </Badge>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {professional.city}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {professional.documentsCount} documenti
            </span>
            {professional.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                {professional.rating} ({professional.reviewsCount})
              </span>
            )}
          </div>

          {/* Submitted date */}
          <p className="text-xs text-muted-foreground mt-2">
            Inviato il {professional.submittedAt}
          </p>
        </div>
      </div>

      {/* Actions */}
      {(professional.status === "pending" || professional.status === "in_review") && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView?.(professional.id)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Visualizza
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReject?.(professional.id)}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="bg-success hover:bg-success/90"
            onClick={() => onApprove?.(professional.id)}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}

      {professional.status !== "pending" && professional.status !== "in_review" && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onView?.(professional.id)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Visualizza Dettagli
          </Button>
        </div>
      )}
    </div>
  );
}
