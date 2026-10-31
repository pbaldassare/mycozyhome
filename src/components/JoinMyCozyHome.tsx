import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { toast } from "sonner";

/**
 * Schermata per chi ha un account dell'autenticazione condivisa ma non è
 * registrato su MyCozyHome: può usarlo come cliente oppure uscire.
 */
export function JoinMyCozyHome() {
  const { user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);

  const join = async () => {
    setJoining(true);
    const { error } = await supabase.rpc("join_as_client");
    if (error) {
      toast.error(toUserMessage(error));
      setJoining(false);
      return;
    }
    await refreshProfile();
    setJoining(false);
    navigate("/client", { replace: true });
  };

  const leave = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <BrandMark className="w-14 h-14 mx-auto text-primary" heartColor="hsl(var(--blush-dark))" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Benvenuto su MyCozyHome</h1>
          <p className="text-muted-foreground">
            L'account <span className="font-medium text-foreground">{user?.email}</span> non è ancora
            registrato su MyCozyHome. Vuoi usarlo per prenotare servizi per la tua casa?
          </p>
        </div>
        <div className="space-y-3">
          <Button className="w-full h-12" onClick={join} disabled={joining}>
            Usa questo account come cliente
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={leave} disabled={joining}>
            Esci
          </Button>
        </div>
      </div>
    </main>
  );
}
