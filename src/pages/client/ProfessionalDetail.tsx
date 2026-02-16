import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Star, MapPin, CheckCircle2, Clock, Calendar, MessageCircle, 
  Shield, Award, Briefcase 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProfessionalLevel } from "@/lib/professional-level";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/client/AppHeader";
import { FavoriteButton } from "@/components/client/FavoriteButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateConversation } from "@/hooks/useConversations";

const serviceTypeLabels: Record<string, string> = {
  cleaning: "Pulizie casa",
  office_cleaning: "Pulizie ufficio",
  ironing: "Stiro",
  sanitization: "Sanificazione",
  dog_sitter: "Dog sitter",
};

export default function ProfessionalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createConversation } = useCreateConversation();

  const handleStartChat = async () => {
    if (!id) return;
    const conversationId = await createConversation(id);
    if (conversationId) {
      navigate(`/client/chat/${conversationId}`);
    }
  };

  const { data: professional, isLoading: loadingProfessional } = useQuery({
    queryKey: ["professional", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["professional-services", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", id)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["professional-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_id", id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (loadingProfessional || loadingServices) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Non trovato" showBack />
        <div className="p-4 text-center text-muted-foreground">
          Professionista non trovato
        </div>
      </div>
    );
  }

  const initials = `${professional.first_name?.[0] || ""}${professional.last_name?.[0] || ""}`.toUpperCase();
  const minHourlyRate = services?.length 
    ? Math.min(...services.map(s => s.hourly_rate)) 
    : null;
  const levelInfo = getProfessionalLevel(
    professional.average_rating || 0,
    professional.years_experience || 0,
    professional.review_count || 0
  );
  const LevelIcon = levelInfo.icon;

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader 
        showBack 
        rightAction={id ? <FavoriteButton professionalId={id} size="md" /> : undefined}
      />
      
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex gap-4">
          <div className="relative flex-shrink-0">
            <Avatar className="h-20 w-20 border-2 border-border/30">
              <AvatarImage src={professional.avatar_url || ""} alt={professional.first_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            {professional.status === "approved" && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center border-2 border-card">
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {professional.first_name} {professional.last_name}
            </h1>
            
            <div className="flex items-center gap-3 mt-1">
              {(professional.average_rating ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="font-medium">{Number(professional.average_rating).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({professional.review_count} recensioni)
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{professional.city}</span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <Badge variant="secondary" className={cn("flex items-center gap-1 whitespace-nowrap", levelInfo.bgClass, levelInfo.colorClass, "border-0")}>
            <LevelIcon className="h-3 w-3" />
            {levelInfo.label}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
            <Shield className="h-3 w-3" />
            Verificato
          </Badge>
          {(professional.years_experience ?? 0) > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
              <Award className="h-3 w-3" />
              {professional.years_experience} anni exp.
            </Badge>
          )}
          <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
            <Briefcase className="h-3 w-3" />
            {services?.length || 0} servizi
          </Badge>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="services" className="px-4">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="services">Servizi</TabsTrigger>
          <TabsTrigger value="about">Info</TabsTrigger>
          <TabsTrigger value="reviews">Recensioni</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-3">
          {services?.map((service) => (
            <div
              key={service.id}
              className="trust-card flex justify-between items-center cursor-pointer"
              onClick={() => navigate(`/client/booking/new?professional=${id}&service=${service.service_type}`)}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {serviceTypeLabels[service.service_type] || service.service_type}
                </h3>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Min. {service.min_hours || 1}h
                  </span>
                  {(service.years_experience ?? 0) > 0 && (
                    <span>{service.years_experience} anni exp.</span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-primary">€{service.hourly_rate}</div>
                <div className="text-xs text-muted-foreground">/ora</div>
              </div>
            </div>
          ))}
          
          {(!services || services.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Nessun servizio disponibile
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          {professional.bio && (
            <div className="trust-card">
              <h3 className="font-semibold text-foreground mb-2">Chi sono</h3>
              <p className="text-sm text-muted-foreground">{professional.bio}</p>
            </div>
          )}
          
          <div className="trust-card">
            <h3 className="font-semibold text-foreground mb-2">Zona di servizio</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{professional.city}</span>
              {professional.max_radius_km && (
                <span>• Entro {professional.max_radius_km} km</span>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-3">
          {reviews?.map((review) => (
            <div key={review.id} className="trust-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "text-warning fill-warning"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("it-IT")}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
          
          {(!reviews || reviews.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna recensione ancora
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border/30 safe-area-pb">
        <div className="flex items-center justify-between mb-3">
          {minHourlyRate && (
            <div>
              <span className="text-sm text-muted-foreground">A partire da</span>
              <div className="text-xl font-bold text-primary">€{minHourlyRate}/ora</div>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleStartChat}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
        <Button
          className="btn-trust-primary"
          onClick={() => navigate(`/client/booking/new?professional=${id}`)}
        >
          <Calendar className="h-5 w-5 mr-2" />
          Prenota ora
        </Button>
      </div>
    </div>
  );
}
