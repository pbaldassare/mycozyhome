import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  MessageSquareWarning,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/admin/StatCard";
import { ProfessionalCard, Professional } from "@/components/admin/ProfessionalCard";

// Mock data for pending professionals
const pendingProfessionals: Professional[] = [
  {
    id: "1",
    name: "Maria Rossi",
    email: "maria.rossi@email.com",
    services: ["cleaning", "ironing"],
    city: "Milano",
    status: "pending",
    documentsCount: 3,
    submittedAt: "3 Feb 2026",
  },
  {
    id: "2",
    name: "Giuseppe Verdi",
    email: "giuseppe.v@email.com",
    services: ["babysitter"],
    city: "Roma",
    status: "pending",
    documentsCount: 5,
    submittedAt: "2 Feb 2026",
  },
  {
    id: "3",
    name: "Anna Bianchi",
    email: "anna.bianchi@email.com",
    services: ["dog_sitter"],
    city: "Napoli",
    status: "pending",
    documentsCount: 4,
    submittedAt: "1 Feb 2026",
  },
];

// Mock recent activity
const recentActivity = [
  { id: 1, type: "booking", message: "Nuova prenotazione pulizia", time: "5 min fa" },
  { id: 2, type: "professional", message: "Mario Bianchi approvato", time: "15 min fa" },
  { id: 3, type: "dispute", message: "Nuova segnalazione #1234", time: "1 ora fa" },
  { id: 4, type: "payment", message: "Pagamento €85 completato", time: "2 ore fa" },
  { id: 5, type: "booking", message: "Prenotazione babysitter confermata", time: "3 ore fa" },
];

const activityIcons = {
  booking: Calendar,
  professional: UserCheck,
  dispute: AlertTriangle,
  payment: CreditCard,
};

export default function AdminDashboard() {
  const handleApprove = (id: string) => {
    console.log("Approved:", id);
  };

  const handleReject = (id: string) => {
    console.log("Rejected:", id);
  };

  const handleView = (id: string) => {
    console.log("View:", id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Benvenuto nel pannello di amministrazione HomeServ
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Professionisti Attivi"
          value={156}
          icon={UserCheck}
          variant="primary"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Clienti Registrati"
          value="2,847"
          icon={Users}
          variant="success"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Prenotazioni Mese"
          value={523}
          icon={Calendar}
          variant="warning"
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Segnalazioni Aperte"
          value={7}
          icon={MessageSquareWarning}
          variant="destructive"
          subtitle="3 urgenti"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Validations */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">In Attesa di Validazione</h2>
              <p className="text-sm text-muted-foreground">
                {pendingProfessionals.length} professionisti da verificare
              </p>
            </div>
            <a
              href="/admin/professionals"
              className="text-sm font-medium text-primary hover:underline"
            >
              Vedi tutti →
            </a>
          </div>

          <div className="grid gap-4">
            {pendingProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onApprove={handleApprove}
                onReject={handleReject}
                onView={handleView}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Quick Stats */}
          <div className="bg-card rounded-2xl border border-border/30 p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/15">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              Statistiche Rapide
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                <span className="text-sm text-muted-foreground">Entrate mensili</span>
                <span className="font-bold text-lg text-primary">€12,450</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-straw/10 hover:bg-straw/20 transition-colors">
                <span className="text-sm text-muted-foreground">Rating medio</span>
                <span className="font-bold text-lg text-straw-dark">4.8 ⭐</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-sage/10 hover:bg-sage/20 transition-colors">
                <span className="text-sm text-muted-foreground">Tasso completamento</span>
                <span className="font-bold text-lg text-sage-dark">94%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-blush/10 hover:bg-blush/15 transition-colors">
                <span className="text-sm text-muted-foreground">Tempo risposta medio</span>
                <span className="font-bold text-lg text-blush-dark">2.5h</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-2xl border border-border/30 p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sage/20">
                <Clock className="w-5 h-5 text-sage-dark" />
              </div>
              Attività Recente
            </h3>
            <div className="space-y-2">
              {recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type as keyof typeof activityIcons];
                const activityColors = {
                  booking: "bg-primary/15 text-primary",
                  professional: "bg-sage/20 text-sage-dark",
                  dispute: "bg-blush/20 text-blush-dark",
                  payment: "bg-straw/25 text-straw-dark",
                };
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("p-2 rounded-xl", activityColors[activity.type as keyof typeof activityColors])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
