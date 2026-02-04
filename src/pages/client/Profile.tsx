import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  Star,
  User,
  Bell,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AppHeader } from "@/components/client/AppHeader";
import { TrustIndicator } from "@/components/client/TrustIndicator";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const mockUser = {
  name: "Marco Belli",
  email: "marco.belli@email.com",
  avatar: "",
  isVerified: true,
};

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  rightContent?: React.ReactNode;
  variant?: "default" | "destructive";
}

function MenuItem({
  icon: Icon,
  label,
  description,
  onClick,
  rightContent,
  variant = "default",
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-xl"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          variant === "destructive" ? "bg-destructive/10" : "bg-muted"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            variant === "destructive" ? "text-destructive" : "text-foreground"
          )}
        />
      </div>
      <div className="flex-1 text-left">
        <p
          className={cn(
            "font-medium",
            variant === "destructive" ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {rightContent || <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </button>
  );
}

export default function ClientProfile() {
  const navigate = useNavigate();
  const initials = mockUser.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Errore durante il logout");
      return;
    }
    toast.success("Logout effettuato");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Profilo" />

      <div className="px-4 py-6 space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-border/30">
            <AvatarImage src={mockUser.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{mockUser.name}</h2>
            <p className="text-muted-foreground">{mockUser.email}</p>
          </div>
        </div>

        {/* Verification Status */}
        <TrustIndicator
          type="verified"
          title="Account verificato"
          description="Il tuo profilo è completo e verificato"
        />

        {/* Menu Sections */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Account
          </h3>
          <div className="trust-card p-0 overflow-hidden">
            <MenuItem
              icon={User}
              label="Dati personali"
              onClick={() => navigate("/client/profile/personal")}
            />
            <Separator />
            <MenuItem
              icon={CreditCard}
              label="Metodi di pagamento"
              onClick={() => navigate("/client/profile/payments")}
            />
            <Separator />
            <MenuItem
              icon={Bell}
              label="Notifiche"
              onClick={() => navigate("/client/profile/notifications")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Storico
          </h3>
          <div className="trust-card p-0 overflow-hidden">
            <MenuItem
              icon={FileText}
              label="Storico pagamenti"
              onClick={() => navigate("/client/profile/payment-history")}
            />
            <Separator />
            <MenuItem
              icon={Star}
              label="Le mie recensioni"
              onClick={() => navigate("/client/profile/reviews")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Supporto
          </h3>
          <div className="trust-card p-0 overflow-hidden">
            <MenuItem
              icon={HelpCircle}
              label="Centro assistenza"
              onClick={() => navigate("/client/support")}
            />
            <Separator />
            <MenuItem
              icon={Shield}
              label="Privacy e sicurezza"
              onClick={() => navigate("/client/profile/privacy")}
            />
            <Separator />
            <MenuItem
              icon={Settings}
              label="Impostazioni"
              onClick={() => navigate("/client/profile/settings")}
            />
          </div>
        </div>

        <div className="trust-card p-0 overflow-hidden">
          <MenuItem
            icon={LogOut}
            label="Esci"
            variant="destructive"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}
