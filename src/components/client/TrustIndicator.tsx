import { CheckCircle2, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustIndicatorProps {
  type?: "verified" | "secure" | "protected";
  title: string;
  description?: string;
  className?: string;
}

const icons = {
  verified: CheckCircle2,
  secure: Shield,
  protected: Lock,
};

export function TrustIndicator({
  type = "verified",
  title,
  description,
  className,
}: TrustIndicatorProps) {
  const Icon = icons[type];

  return (
    <div className={cn("trust-indicator", className)}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
