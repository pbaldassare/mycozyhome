import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatWalletError, isWalletSchemaMissingError } from "@/lib/wallet-errors";
import { useAuth } from "./useAuth";

export type ClientWalletState = {
  balance: number;
  schemaMissing?: boolean;
};

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  direction: "credit" | "debit";
  description: string | null;
  booking_id: string | null;
  created_at: string;
}

export function useClientWallet() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-wallet", user?.id],
    queryFn: async (): Promise<ClientWalletState> => {
      if (!user?.id) return { balance: 0 };

      const { data, error } = await supabase
        .from("client_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") return { balance: 0 };
        if (isWalletSchemaMissingError(error)) return { balance: 0, schemaMissing: true };
        throw error;
      }
      return { balance: Number(data?.balance ?? 0) };
    },
    enabled: !!user?.id,
  });
}

export function useProfessionalWallet(professionalId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["professional-wallet", professionalId],
    queryFn: async () => {
      if (!professionalId) return { balance: 0 };

      const { data, error } = await supabase
        .from("professional_wallets")
        .select("balance")
        .eq("professional_id", professionalId)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") return { balance: 0 };
        if (isWalletSchemaMissingError(error)) return { balance: 0 };
        throw error;
      }
      return { balance: Number(data?.balance ?? 0) };
    },
    enabled: !!professionalId && !!user?.id,
  });
}

export function useWalletTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        if (isWalletSchemaMissingError(error)) return [];
        throw error;
      }
      return (data ?? []) as WalletTransaction[];
    },
    enabled: !!user?.id,
  });
}

export function useSimulateTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase.rpc("simulate_wallet_top_up", {
        p_amount: amount,
      });
      if (error) {
        throw new Error(formatWalletError(error));
      }
      return Number(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
}

export function useResolveDisputePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      disputeId,
      favor,
    }: {
      disputeId: string;
      favor: "client" | "professional";
    }) => {
      const { data, error } = await supabase.rpc("resolve_dispute_payment", {
        p_dispute_id: disputeId,
        p_favor: favor,
      });
      if (error) throw error;
      if (!data) throw new Error("Impossibile risolvere il pagamento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["professional-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
}
