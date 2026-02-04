import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  clientName: string;
  clientAvatar: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
  ratings: {
    professionalism: number;
    punctuality: number;
    quality: number;
  };
}

const mockReviews: Review[] = [
  {
    id: "1",
    clientName: "Maria Rossi",
    clientAvatar: "",
    rating: 5,
    comment: "Servizio eccellente! Casa pulitissima, molto professionale e puntuale. Consiglio vivamente!",
    service: "Pulizia Casa",
    date: "2 giorni fa",
    ratings: { professionalism: 5, punctuality: 5, quality: 5 },
  },
  {
    id: "2",
    clientName: "Luigi Bianchi",
    clientAvatar: "",
    rating: 4,
    comment: "Ottimo lavoro di stiratura, vestiti perfetti. Tornerò sicuramente.",
    service: "Stiratura",
    date: "1 settimana fa",
    ratings: { professionalism: 4, punctuality: 5, quality: 4 },
  },
  {
    id: "3",
    clientName: "Anna Verdi",
    clientAvatar: "",
    rating: 5,
    comment: "Il mio cane adora questa dog sitter! Molto affidabile e attenta.",
    service: "Dog Sitter",
    date: "2 settimane fa",
    ratings: { professionalism: 5, punctuality: 5, quality: 5 },
  },
];

const ratingBreakdown = [
  { stars: 5, percentage: 70 },
  { stars: 4, percentage: 20 },
  { stars: 3, percentage: 5 },
  { stars: 2, percentage: 3 },
  { stars: 1, percentage: 2 },
];

export default function ProfessionalReviews() {
  const averageRating = 4.8;
  const totalReviews = 125;

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
                <p className="text-5xl font-bold">{averageRating}</p>
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

        {/* Category Ratings */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">4.9</p>
              <p className="text-xs text-muted-foreground mt-1">Professionalità</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">4.8</p>
              <p className="text-xs text-muted-foreground mt-1">Puntualità</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">4.7</p>
              <p className="text-xs text-muted-foreground mt-1">Qualità</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <section>
          <h2 className="text-base font-semibold mb-3">Recensioni Recenti</h2>
          <div className="space-y-4">
            {mockReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.clientAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {review.clientName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{review.clientName}</h3>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
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
                        <span className="text-xs text-muted-foreground">
                          • {review.service}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
