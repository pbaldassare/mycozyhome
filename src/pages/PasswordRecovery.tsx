import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/BrandMark";
import { authErrorMessage } from "@/lib/errors";
import { SIGNUP_PASSWORD_HINT, signupPasswordSchema } from "@/lib/auth-schemas";

function RecoveryShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/login")}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Torna al login"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Wordmark onDark />
      </header>
      <main className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Richiesta del link per reimpostare la password. */
export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    // Stesso messaggio in ogni caso: non riveliamo se l'email è registrata.
    if (error && /rate limit|too many/i.test(error.message)) {
      toast.error(authErrorMessage(error));
      return;
    }
    setSent(true);
  };

  return (
    <RecoveryShell
      title="Password dimenticata"
      subtitle="Inserisci l'email del tuo account: ti invieremo un link per sceglierne una nuova."
    >
      {sent ? (
        <p className="text-center text-foreground bg-secondary rounded-xl p-4">
          Se l'email è registrata, a breve riceverai il link. Controlla anche lo spam.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={sending}>
            {sending ? "Invio in corso..." : "Invia il link"}
          </Button>
        </form>
      )}
    </RecoveryShell>
  );
}

/** Scelta della nuova password dal link ricevuto via email. */
export function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupPasswordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    if (password !== confirm) {
      setError("Le password non corrispondono");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      toast.error(authErrorMessage(updateError));
      return;
    }
    toast.success("Password aggiornata");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <RecoveryShell title="Nuova password" subtitle={SIGNUP_PASSWORD_HINT}>
      {!ready ? (
        <p className="text-center text-muted-foreground">
          Apri questa pagina dal link ricevuto via email. Se il link è scaduto,{" "}
          <button className="text-primary underline" onClick={() => navigate("/forgot-password")}>
            richiedine uno nuovo
          </button>
          .
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {[
            { id: "new-password", label: "Nuova password", value: password, set: setPassword },
            { id: "confirm-password", label: "Conferma password", value: confirm, set: setConfirm },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          ))}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? "Salvataggio..." : "Salva la nuova password"}
          </Button>
        </form>
      )}
    </RecoveryShell>
  );
}
