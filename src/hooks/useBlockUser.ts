import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type UserType = "client" | "professional";

interface BlockParams {
  userType: UserType;
  id: string;
  reason?: string;
}

export function useBlockUser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userType, id, reason }: BlockParams) => {
      const table = userType === "client" ? "client_profiles" : "professionals";
      const { error } = await supabase
        .from(table)
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: reason?.trim() || null,
          blocked_by: user?.id || null,
        })
        .eq("id", id);

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
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile bloccare l'utente.",
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
        description: "L'utente ha ripristinato l'accesso completo alla piattaforma.",
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
