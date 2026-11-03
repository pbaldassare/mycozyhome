import { Star, MapPin, BadgeCheck, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/client/FavoriteButton";
import { getProfessionalLevel } from "@/lib/professional-level";
import { serviceColor } from "@/lib/service-icons";

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

/** Card stile app di delivery: foto grande, nome intero, prezzo in evidenza, servizi colorati. */
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
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const levelInfo = getProfessionalLevel(rating, yearsExperience, reviewCount);
  const LevelIcon = levelInfo.icon;
  const showDistance = distance && distance !== "N/A";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={cn(
        "relative w-full text-left rounded-3xl bg-card border border-border/60 shadow-soft p-3 flex gap-3 cursor-pointer transition-all hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-20 w-20 rounded-2xl">
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          <AvatarFallback className="rounded-2xl bg-primary-light text-primary font-bold text-lg">{initials}</AvatarFallback>
        </Avatar>
        {rating > 0 && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded-full bg-card px-2 py-0.5 text-xs font-bold shadow-md">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-7">
        <div className="flex items-center gap-1">
          <h3 className="font-bold text-foreground leading-tight line-clamp-1">{name}</h3>
          {isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" aria-label="Verificato" />}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", levelInfo.colorClass)}>
            <LevelIcon className="h-3 w-3" />
            {levelInfo.label}
          </span>
          {reviewCount > 0 && <span>· {reviewCount} recensioni</span>}
          {showDistance && (
            <span className="inline-flex items-center gap-0.5">
              · <MapPin className="h-3 w-3 text-rose-400" /> {distance}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {services.slice(0, 2).map((service) => (
            <span key={service} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", serviceColor(service))}>
              {service}
            </span>
          ))}
          {services.length > 2 && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-muted text-muted-foreground">
              +{services.length - 2}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {yearsExperience > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {yearsExperience} anni di esperienza
            </span>
          ) : <span />}
          {hourlyRate ? (
            <span className="rounded-full bg-brand-gradient px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/30">
              da €{hourlyRate}/h
            </span>
          ) : null}
        </div>
      </div>

      {showFavorite && id && (
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton professionalId={id} size="sm" />
        </div>
      )}
    </div>
  );
}
