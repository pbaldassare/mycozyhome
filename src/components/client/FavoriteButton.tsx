import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  professionalId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FavoriteButton({ professionalId, size = "md", className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const favorite = isFavorite(professionalId);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        "rounded-full transition-all duration-200",
        favorite 
          ? "bg-blush/20 hover:bg-blush/30 text-blush-dark" 
          : "bg-card/80 hover:bg-card text-muted-foreground hover:text-blush-dark",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(professionalId);
      }}
      disabled={isToggling}
    >
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          favorite && "fill-current"
        )}
      />
    </Button>
  );
}
