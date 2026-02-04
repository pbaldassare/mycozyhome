import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  price?: string;
  onClick?: () => void;
  className?: string;
  iconColor?: string;
}

export function ServiceCard({
  icon: Icon,
  title,
  description,
  price,
  onClick,
  className,
  iconColor = "text-primary",
}: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "service-card w-full text-left flex items-center gap-4 group",
        className
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10",
          iconColor === "text-accent" && "bg-accent/10"
        )}
      >
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {price && (
        <div className="text-right">
          <span className="font-semibold text-foreground">{price}</span>
          <span className="text-xs text-muted-foreground">/ora</span>
        </div>
      )}
    </button>
  );
}
