import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useProfessionalProfile, useProfessionalReviews } from "@/hooks/useProfessionalData";


import { SERVICE_LABELS as serviceTypeLabels } from "@/lib/services";

const SUB_RATINGS = [
  { key: "rating_punctuality", label: "Puntualità" },
  { key: "rating_quality", label: "Qualità" },
  { key: "rating_kindness", label: "Cordialità" },
] as const;

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

  // Medie dei voti di dettaglio (solo le recensioni che li hanno).
  const subAverages = SUB_RATINGS.map(({ key, label }) => {
    const values = (reviews ?? []).map((r) => r[key]).filter((v): v is number => v != null);
    return { key, label, avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null };
  }).filter((s) => s.avg != null);

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
            {subAverages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-5">
                {subAverages.map((s) => (
                  <div key={s.key} className="rounded-2xl bg-primary-light p-3 text-center">
                    <p className="text-lg font-bold text-primary">{s.avg!.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
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
              reviews.map((review) => (
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
                        {SUB_RATINGS.some(({ key }) => review[key] != null) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {SUB_RATINGS.filter(({ key }) => review[key] != null).map(({ key, label }) => (
                              <span key={key} className="text-xs rounded-full bg-muted px-2 py-0.5">
                                {label} {review[key]}/5
                              </span>
                            ))}
                          </div>
                        )}
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                        <ReviewReply reviewId={review.id} reply={review.professional_reply} />
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

/** Risposta pubblica del professionista a una recensione (TP 12.2). */
function ReviewReply({ reviewId, reply }: { reviewId: string; reply: string | null }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(reply ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("reply_to_review", { p_review_id: reviewId, p_reply: text });
    setSaving(false);
    if (error) return toast.error(toUserMessage(error, "Risposta non salvata. Riprova."));
    toast.success("Risposta pubblicata");
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["professional-own-reviews"] });
  };

  if (!editing) {
    return (
      <div className="mt-2">
        {reply && (
          <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-sm">
            <span className="block text-xs font-semibold text-primary">La tua risposta</span>
            {reply}
          </p>
        )}
        <button onClick={() => setEditing(true)} className="mt-1 text-xs font-semibold text-primary">
          {reply ? "Modifica risposta" : "Rispondi"}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Scrivi una risposta pubblica" />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Annulla</Button>
        <Button size="sm" onClick={save} disabled={saving || text.trim().length < 2}>Pubblica</Button>
      </div>
    </div>
  );
}
