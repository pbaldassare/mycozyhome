import { Star, MapPin, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/client/FavoriteButton";
import { getProfessionalLevel } from "@/lib/professional-level";

interface ProfessionalCardProps {
  id?: string;
  name: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  distance?: string;
  services: string[];
  hourlyRate?: number;
  isVerified?: boolean;
  showFavorite?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProfessionalCard({
  id,
  name,
  avatarUrl,
  rating = 0,
  reviewCount = 0,
  yearsExperience = 0,
  distance,
  services,
  hourlyRate,
  isVerified = false,
  showFavorite = false,
  onClick,
  className,
}: ProfessionalCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const levelInfo = getProfessionalLevel(rating, yearsExperience, reviewCount);
  const LevelIcon = levelInfo.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "trust-card w-full text-left flex gap-4 hover:shadow-md",
        className
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-16 w-16 border-2 border-border/30">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {isVerified && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-card">
            <CheckCircle2 className="h-3 w-3 text-success-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", levelInfo.bgClass, levelInfo.colorClass)}>
            <LevelIcon className="h-3 w-3" />
            {levelInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}
          {distance && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">{distance}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {services.slice(0, 2).map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className="text-xs font-normal"
            >
              {service}
            </Badge>
          ))}
          {services.length > 2 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{services.length - 2}
            </Badge>
          )}
        </div>
      </div>

      {hourlyRate && (
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-primary">€{hourlyRate}</div>
          <div className="text-xs text-muted-foreground">/ora</div>
        </div>
      )}

      {showFavorite && id && (
        <FavoriteButton professionalId={id} size="sm" className="flex-shrink-0" />
      )}
    </button>
  );
}
