import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  User,
  Briefcase,
  FileText,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  profile_completed: boolean;
  documents_submitted: boolean;
  avatar_url: string | null;
}

interface CompletionData {
  hasServices: boolean;
  hasAvailability: boolean;
}

const statusConfig = {
  pending: { label: "In attesa", color: "text-warning", bgColor: "bg-warning/10", icon: Clock },
  in_review: { label: "In verifica", color: "text-primary", bgColor: "bg-primary/10", icon: Clock },
  approved: { label: "Approvato", color: "text-success", bgColor: "bg-success/10", icon: CheckCircle },
  rejected: { label: "Rifiutato", color: "text-destructive", bgColor: "bg-destructive/10", icon: AlertCircle },
  suspended: { label: "Sospeso", color: "text-destructive", bgColor: "bg-destructive/10", icon: AlertCircle },
};

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [completionData, setCompletionData] = useState<CompletionData>({
    hasServices: false,
    hasAvailability: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/professional/auth");
        return;
      }

      setUser(session.user);

      // Check if professional profile exists
      const { data: prof } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (prof) {
        setProfessional(prof as Professional);

        // Check if services are configured
        const { data: services } = await supabase
          .from("professional_services")
          .select("id")
          .eq("professional_id", prof.id)
          .limit(1);

        // Check if availability is configured
        const { data: availability } = await supabase
          .from("professional_availability")
          .select("id")
          .eq("professional_id", prof.id)
          .limit(1);

        setCompletionData({
          hasServices: (services && services.length > 0) ?? false,
          hasAvailability: (availability && availability.length > 0) ?? false,
        });
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/professional/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/professional/auth");
  };

  const completionItems = [
    {
      id: "profile",
      label: "Profilo Personale",
      description: "Completa i tuoi dati personali",
      completed: professional?.profile_completed ?? false,
      path: "/professional/onboarding/personal",
    },
    {
      id: "services",
      label: "Servizi e Prezzi",
      description: "Configura servizi e tariffe",
      completed: completionData.hasServices,
      path: "/professional/onboarding/services",
    },
    {
      id: "availability",
      label: "Disponibilità",
      description: "Imposta i tuoi orari",
      completed: completionData.hasAvailability,
      path: "/professional/onboarding/availability",
    },
    {
      id: "documents",
      label: "Documenti",
      description: "Carica i documenti richiesti",
      completed: professional?.documents_submitted ?? false,
      path: "/professional/onboarding/documents",
    },
  ];

  const completedCount = completionItems.filter((item) => item.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If no professional profile yet, redirect to onboarding
  if (!professional) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-6 pb-20 relative">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold">HomeServ Pro</span>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 -mt-14">
          <div className="bg-card rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">Benvenuto!</h1>
            <p className="text-muted-foreground mb-6">
              Completa la registrazione per diventare un professionista verificato
            </p>
            <Button
              onClick={() => navigate("/professional/onboarding/personal")}
              className="w-full"
              size="lg"
            >
              Inizia la Registrazione
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[professional.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Profile */}
      <header className="bg-primary text-primary-foreground p-6 pb-24 relative">
        <div className="flex items-center justify-between mb-6">
          <span className="font-display font-semibold">HomeServ Pro</span>
          <button className="p-2 hover:bg-white/10 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="absolute left-4 right-4 -bottom-16">
          <div className="bg-card rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
                {professional.avatar_url ? (
                  <img
                    src={professional.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  professional.first_name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg text-foreground truncate">
                  {professional.first_name} {professional.last_name}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {professional.city}
                </p>
                <div className={cn("inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium", status.bgColor, status.color)}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 pt-20 pb-6 space-y-6">
        {/* Status Alert */}
        {professional.status === "pending" && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Profilo in attesa</p>
                <p className="text-sm text-muted-foreground">
                  Completa tutti i passaggi per inviare il profilo alla verifica
                </p>
              </div>
            </div>
          </div>
        )}

        {professional.status === "in_review" && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary">In verifica</p>
                <p className="text-sm text-muted-foreground">
                  Il tuo profilo è in fase di revisione. Ti contatteremo presto!
                </p>
              </div>
            </div>
          </div>
        )}

        {professional.status === "approved" && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success">Profilo approvato!</p>
                <p className="text-sm text-muted-foreground">
                  Sei visibile ai clienti e puoi ricevere prenotazioni
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Progress */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Completamento Profilo</h2>
            <span className="text-sm font-medium text-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Completion Checklist */}
        <div className="space-y-2">
          {completionItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-all"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  item.completed ? "bg-success/10" : "bg-muted"
                )}
              >
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Submit for Review Button */}
        {completionPercentage === 100 && professional.status === "pending" && (
          <Button className="w-full" size="lg">
            Invia per Verifica
          </Button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-destructive py-3"
        >
          <LogOut className="w-4 h-4" />
          <span>Esci</span>
        </button>
      </div>
    </div>
  );
}
