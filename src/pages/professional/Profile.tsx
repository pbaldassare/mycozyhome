import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Camera,
  Settings,
  LogOut,
  User,
  Bell,
  Wrench,
  FileText,
  HelpCircle,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { useUnreadSupportCount } from "@/hooks/useUnreadSupport";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  external?: boolean;
  badge?: number;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const ProfileMenuItem = ({ item, onClick }: { item: MenuItem; onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">{item.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {item.badge && item.badge > 0 ? (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            {item.badge}
          </span>
        ) : null}
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );
};

export default function ProfessionalProfile() {
  const navigate = useNavigate();
  const { data: professional, isLoading: loadingProfile } = useProfessionalProfile();
  const { data: unreadCount } = useUnreadSupportCount();

  const menuSections: MenuSection[] = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Dati personali", path: "/professional/profile/personal" },
        { icon: Settings, label: "Preferenze", path: "/professional/profile/preferences" },
        { icon: Bell, label: "Notifiche", path: "/professional/profile/preferences" },
      ],
    },
    {
      title: "Attività",
      items: [
        { icon: Wrench, label: "I miei servizi", path: "/professional/services" },
        { icon: Star, label: "Le mie recensioni", path: "/professional/reviews" },
        { icon: FileText, label: "Documenti", path: "/professional/onboarding/documents" },
      ],
    },
    {
      title: "Supporto",
      items: [
        { icon: HelpCircle, label: "Centro assistenza", path: "/professional/support", badge: unreadCount || 0 },
        { icon: Shield, label: "Privacy", path: "/professional/profile/settings" },
        { icon: Settings, label: "Impostazioni", path: "/professional/profile/settings" },
      ],
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/");
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!professional) return null;

  const initials = `${professional.first_name[0]}${professional.last_name[0]}`;
  const joinYear = new Date(professional.created_at).getFullYear();
  const averageRating = professional.average_rating ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold">Profilo</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/professional/profile/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="pb-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center p-6 border-b">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={professional.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold">
            {professional.first_name} {professional.last_name}
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <span>{professional.city}</span>
            {averageRating > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span>{Number(averageRating).toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Iscritto dal {joinYear}</p>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <section key={section.title} className="mt-6 px-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {section.title}
            </h2>
            <Card>
              <CardContent className="p-0 divide-y divide-border/50">
                {section.items.map((item) => (
                  <ProfileMenuItem
                    key={item.label}
                    item={item}
                    onClick={() => navigate(item.path)}
                  />
                ))}
              </CardContent>
            </Card>
          </section>
        ))}

        {/* Logout */}
        <div className="px-4 mt-6">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </div>
    </div>
  );
}
