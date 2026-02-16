import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useProfessionalProfile, useProfessionalReviews } from "@/hooks/useProfessionalData";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

export default function ProfessionalReviews() {
  const { data: professional } = useProfessionalProfile();
  const { data: reviews, isLoading } = useProfessionalReviews(professional?.id);

  const averageRating = professional?.average_rating ?? 0;
  const totalReviews = professional?.review_count ?? 0;

  // Calculate rating breakdown
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews?.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    percentage: totalReviews > 0 ? Math.round((ratingCounts[stars - 1] / totalReviews) * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-lg font-semibold">Le Mie Recensioni</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Rating Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <p className="text-5xl font-bold">{Number(averageRating).toFixed(1)}</p>
                <div className="flex items-center justify-center gap-0.5 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-5 w-5",
                        star <= Math.round(averageRating)
                          ? "fill-warning text-warning"
                          : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{totalReviews} recensioni</p>
              </div>

              {/* Rating Breakdown */}
              <div className="flex-1 space-y-2">
                {ratingBreakdown.map((item) => (
                  <div key={item.stars} className="flex items-center gap-2">
                    <span className="text-sm w-3">{item.stars}</span>
                    <Progress value={item.percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <section>
          <h2 className="text-base font-semibold mb-3">Recensioni Recenti</h2>
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : !reviews || reviews.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nessuna recensione ancora</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Le recensioni dei clienti appariranno qui
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          C
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Cliente</h3>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), "d MMM yyyy", { locale: it })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  star <= review.rating
                                    ? "fill-warning text-warning"
                                    : "fill-muted text-muted"
                                )}
                              />
                            ))}
                          </div>
                          {review.booking?.service_type && (
                            <span className="text-xs text-muted-foreground">
                              • {serviceTypeLabels[review.booking.service_type] || review.booking.service_type}
                            </span>
                          )}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
