import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toUserMessage } from "@/lib/errors";

type UserType = "client" | "professional";

interface BlockParams {
  userType: UserType;
  id: string;
  reason?: string;
  action?: "suspend" | "exclude_30" | "ban";
}

export function useBlockUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userType, id, reason, action = "suspend" }: BlockParams) => {
      const table = userType === "client" ? "client_profiles" : "professionals";
      const { data, error: findError } = await supabase.from(table).select("user_id").eq("id", id).single();
      if (findError) throw findError;
      const { error } = await supabase.rpc("admin_sanction", {
        p_role: userType,
        p_user_id: data.user_id,
        p_action: action,
        p_reason: reason ?? "",
      });
      if (error) throw error;
    },
    onSuccess: (_, { userType }) => {
      queryClient.invalidateQueries({
        queryKey: [userType === "client" ? "admin-clients" : "admin-professionals"],
      });
      toast({
        title: "Utente bloccato",
        description: "L'utente non potrà più usare le funzioni della piattaforma, ma potrà ancora chattare con l'assistenza.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: toUserMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useUnblockUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userType, id }: Omit<BlockParams, "reason">) => {
      const table = userType === "client" ? "client_profiles" : "professionals";
      const { error } = await supabase
        .from(table)
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_reason: null,
          blocked_by: null,
          ...(userType === "professional" ? { exclusion_due_at: null } : {}),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { userType }) => {
      queryClient.invalidateQueries({
        queryKey: [userType === "client" ? "admin-clients" : "admin-professionals"],
      });
      toast({
        title: "Utente sbloccato",
        description: "Se era nella lista dei bannati, toglilo anche da lì.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile sbloccare l'utente.",
        variant: "destructive",
      });
    },
  });
}
