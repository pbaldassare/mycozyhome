import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  MessageSquareWarning,
  TrendingUp,
  Landmark,
  HelpCircle,
  ClipboardCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  clients: number;
  professionals_approved: number;
  professionals_to_review: number;
  bookings_month: number;
  bookings_open: number;
  revenue_month: number;
  disputes_open: number;
  tickets_open: number;
  payouts_pending: number;
}

const euro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default function AdminDashboard() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_stats");
      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    staleTime: 60_000,
  });

  const todo = stats
    ? [
        { count: stats.professionals_to_review, label: "professionisti da verificare", to: "/admin/professionals", icon: ClipboardCheck },
        { count: stats.disputes_open, label: "contestazioni aperte", to: "/admin/disputes", icon: MessageSquareWarning },
        { count: stats.payouts_pending, label: "prelievi da pagare", to: "/admin/payments", icon: Landmark },
        { count: stats.tickets_open, label: "ticket di assistenza aperti", to: "/admin/support", icon: HelpCircle },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Andamento di MyCozyHome e cose da fare</p>
      </div>

      {isError ? (
        <div className="bg-card rounded-2xl border border-border/30 p-6 space-y-3">
          <p>Impossibile caricare i dati della dashboard.</p>
          <Button variant="outline" onClick={() => refetch()}>Riprova</Button>
        </div>
      ) : isLoading || !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Professionisti attivi" value={stats.professionals_approved} icon={UserCheck} variant="primary" />
            <StatCard title="Clienti registrati" value={stats.clients} icon={Users} variant="success" />
            <StatCard
              title="Prenotazioni del mese"
              value={stats.bookings_month}
              subtitle={`${stats.bookings_open} in corso`}
              icon={Calendar}
              variant="warning"
            />
            <StatCard title="Servizi completati nel mese" value={euro(stats.revenue_month)} icon={TrendingUp} variant="default" />
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Da fare</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {todo.map(({ count, label, to, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-4 bg-card rounded-2xl border border-border/30 p-5 hover:border-primary transition-colors"
                  >
                    <Icon className="w-6 h-6 text-primary shrink-0" />
                    <span className="text-2xl font-bold tabular-nums">{count}</span>
                    <span className="text-muted-foreground">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            I pagamenti sono crediti interni: i bonifici ai professionisti si gestiscono da Pagamenti.
          </p>
        </>
      )}
    </div>
  );
}
