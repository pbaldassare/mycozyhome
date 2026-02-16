import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientReviews } from "@/hooks/useReviews";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-warning fill-warning" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function MyReviews() {
  const navigate = useNavigate();
  const { data: reviews, isLoading } = useClientReviews();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border/30 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/client/profile")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Le Mie Recensioni</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/30 p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessuna recensione lasciata</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dopo aver completato un servizio potrai lasciare una recensione
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-2xl border border-border/30 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">
                    {review.professional?.first_name} {review.professional?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {review.booking?.service_type
                      ? serviceTypeLabels[review.booking.service_type] || review.booking.service_type
                      : "Servizio"}
                  </p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.comment && (
                <p className="text-sm text-foreground mb-2">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "d MMMM yyyy", { locale: it })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
