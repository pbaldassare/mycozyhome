import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MessageSquare, Star, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toUserMessage } from "@/lib/errors";
import type { Json } from "@/integrations/supabase/types";

type PrefKey = "bookings" | "messages" | "reviews" | "marketing";

const OPTIONS: { key: PrefKey; icon: typeof Calendar; title: string; description: string; default: boolean }[] = [
  { key: "bookings", icon: Calendar, title: "Prenotazioni", description: "Conferme, annullamenti e promemoria", default: true },
  { key: "messages", icon: MessageSquare, title: "Messaggi", description: "Nuovi messaggi in chat", default: true },
  { key: "reviews", icon: Star, title: "Recensioni", description: "Richieste di recensione dopo il servizio", default: true },
  { key: "marketing", icon: Megaphone, title: "Promozioni", description: "Offerte e novità di MyCozyHome", default: false },
];

/** Preferenze di notifica salvate nel profilo (client_profiles o professionals). */
export function NotificationPreferences({ table }: { table: "client_profiles" | "professionals" }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["preferences", table, user?.id];

  const { data: preferences, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } =
        table === "professionals"
          ? await supabase.from("professional_private").select("preferences").eq("user_id", user!.id).maybeSingle()
          : await supabase.from("client_profiles").select("preferences").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return (data?.preferences ?? {}) as Record<string, Json>;
    },
    enabled: !!user?.id,
  });

  const notifications = (preferences?.notifications ?? {}) as Partial<Record<PrefKey, boolean>>;

  const save = useMutation({
    mutationFn: async (next: Partial<Record<PrefKey, boolean>>) => {
      const value = { ...(preferences ?? {}), notifications: next } as Json;
      const { error } =
        table === "professionals"
          ? await supabase.from("professionals").update({ preferences: value }).eq("user_id", user!.id)
          : await supabase.from("client_profiles").update({ preferences: value }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Preferenze salvate");
    },
    onError: (error) => toast.error(toUserMessage(error)),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <section className="space-y-3">
      <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/30">
        {OPTIONS.map(({ key, icon: Icon, title, description, default: fallback }) => {
          const checked = notifications[key] ?? fallback;
          return (
            <div key={key} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <label htmlFor={`pref-${key}`} className="font-medium">{title}</label>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                id={`pref-${key}`}
                checked={checked}
                disabled={save.isPending}
                onCheckedChange={(value) => save.mutate({ ...notifications, [key]: value })}
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground px-1">
        Le notifiche via email sono in arrivo: quando saranno attive rispetteranno queste scelte.
      </p>
    </section>
  );
}
