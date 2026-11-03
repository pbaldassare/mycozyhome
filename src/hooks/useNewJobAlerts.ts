import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import { serviceLabel } from "@/lib/services";

/**
 * Avvisa il professionista di una nuova prenotazione mentre l'app è aperta:
 * toast, vibrazione e notifica del browser (se autorizzata).
 * ponytail: niente web push ad app chiusa — serve un server VAPID + service worker push.
 */
export function useNewJobAlerts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalProfile();
  const professionalId = professional?.id;

  useEffect(() => {
    if (!professionalId) return;
    const channel = supabase
      .channel(`new-jobs-${professionalId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "mycozyhome", table: "bookings", filter: `professional_id=eq.${professionalId}` },
        (payload) => {
          const b = payload.new as { service_type: string; scheduled_date: string; scheduled_time_start: string };
          const text = `${serviceLabel(b.service_type)} · ${b.scheduled_date.split("-").reverse().join("/")} alle ${b.scheduled_time_start.slice(0, 5)}`;
          queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["professional-all-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["professional-stats"] });
          navigator.vibrate?.([200, 100, 200]);
          toast.success("Nuova prenotazione!", {
            description: text,
            action: { label: "Vedi", onClick: () => navigate("/professional/bookings") },
            duration: 10_000,
          });
          if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
            new Notification("Nuova prenotazione su MyCozyHome", { body: text, icon: "/pwa-192x192.png" });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [professionalId, navigate, queryClient]);
}
