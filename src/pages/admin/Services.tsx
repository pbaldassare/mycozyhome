import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_CATALOG } from "@/lib/services";

/** Catalogo dei servizi con professionisti attivi e prezzo medio, dai dati reali. */
export default function Services() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-service-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_services")
        .select("service_type, hourly_rate, professional:professionals!inner(status)")
        .eq("is_active", true)
        .eq("professional.status", "approved");
      if (error) throw error;
      const stats: Record<string, { count: number; total: number }> = {};
      for (const row of data ?? []) {
        const entry = (stats[row.service_type] ??= { count: 0, total: 0 });
        entry.count += 1;
        entry.total += Number(row.hourly_rate);
      }
      return stats;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Servizi</h1>
        <p className="text-muted-foreground mt-1">
          Il catalogo è lo stesso per clienti e professionisti. Qui vedi quanti professionisti approvati offrono ogni
          servizio e la tariffa media.
        </p>
      </div>

      {isError ? (
        <p>Impossibile caricare i dati dei servizi.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SERVICE_CATALOG.map((service) => {
            const stat = data?.[service.id];
            return (
              <div key={service.id} className="bg-card rounded-2xl border border-border/30 p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{service.label}</h2>
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                    {service.group === "animali" ? "ANIMALI" : "CASA"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-40" />
                ) : (
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">{stat?.count ?? 0}</span> professionisti
                    {stat && stat.count > 0 && (
                      <>
                        {" · "}media{" "}
                        <span className="font-semibold tabular-nums">
                          {(stat.total / stat.count).toLocaleString("it-IT", { maximumFractionDigits: 2 })} €/ora
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
