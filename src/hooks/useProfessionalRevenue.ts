import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const REVENUE_LIMIT = 5000;

export interface ProfessionalRevenueInfo {
  annualRevenue: number;
  limit: number;
  percentage: number;
  hasVat: boolean;
  vatNumber: string | null;
  blocked: boolean;
  /** true se senza P.IVA e fatturato >= limite */
  exceededWithoutVat: boolean;
}

/**
 * Restituisce fatturato annuo del professionista (anno solare corrente)
 * e stato P.IVA / blocco.
 */
export function useProfessionalRevenue(professionalId?: string) {
  return useQuery<ProfessionalRevenueInfo | null>({
    queryKey: ["professional-revenue", professionalId],
    enabled: !!professionalId,
    queryFn: async () => {
      if (!professionalId) return null;

      const [{ data: prof, error: profErr }, { data: revData, error: revErr }] =
        await Promise.all([
          supabase
            .from("professionals")
            .select("has_vat_number, vat_number, revenue_blocked")
            .eq("id", professionalId)
            .maybeSingle(),
          supabase.rpc("get_professional_annual_revenue", {
            _prof_id: professionalId,
          }),
        ]);

      if (profErr) throw profErr;
      if (revErr) throw revErr;

      const annualRevenue = Number(revData ?? 0);
      const hasVat = !!prof?.has_vat_number;
      const blocked = !!prof?.revenue_blocked;
      const percentage = Math.min(
        100,
        Math.round((annualRevenue / REVENUE_LIMIT) * 100)
      );

      return {
        annualRevenue,
        limit: REVENUE_LIMIT,
        percentage,
        hasVat,
        vatNumber: prof?.vat_number ?? null,
        blocked,
        exceededWithoutVat: !hasVat && annualRevenue >= REVENUE_LIMIT,
      };
    },
  });
}
