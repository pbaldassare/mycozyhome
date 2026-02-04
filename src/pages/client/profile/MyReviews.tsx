import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";

interface Review {
  id: string;
  date: string;
  rating: number;
  comment: string;
  professionalName: string;
  serviceType: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    date: "3 Feb 2026",
    rating: 5,
    comment: "Servizio eccellente! Maria è stata puntuale e molto professionale. Casa splendente!",
    professionalName: "Maria Rossi",
    serviceType: "Pulizia Casa",
  },
  {
    id: "2",
    date: "28 Gen 2026",
    rating: 4,
    comment: "Buon lavoro di stiratura, tempi rispettati.",
    professionalName: "Anna Verdi",
    serviceType: "Stiratura",
  },
  {
    id: "3",
    date: "15 Gen 2026",
    rating: 5,
    comment: "Fantastica con i bambini, molto affidabile. La chiameremo ancora!",
    professionalName: "Lucia Bianchi",
    serviceType: "Babysitter",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-warning fill-warning"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function MyReviews() {
  const navigate = useNavigate();

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
        {mockReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessuna recensione lasciata</p>
          </div>
        ) : (
          mockReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-2xl border border-border/30 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{review.professionalName}</p>
                  <p className="text-sm text-muted-foreground">{review.serviceType}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="text-sm text-foreground mb-2">{review.comment}</p>
              <p className="text-xs text-muted-foreground">{review.date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
