import { useNavigate } from "react-router-dom";
import { AlertTriangle, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProfessionalRevenue } from "@/hooks/useProfessionalRevenue";

interface Props {
  professionalId?: string;
  className?: string;
}

/**
 * Banner che mostra l'avanzamento del fatturato annuo del professionista
 * rispetto al limite dei 5.000€/anno per chi opera senza P.IVA.
 * Soglie: 60% giallo, 80% arancio, 100% rosso bloccante.
 */
export function RevenueLimitBanner({ professionalId, className }: Props) {
  const navigate = useNavigate();
  const { data } = useProfessionalRevenue(professionalId);

  if (!data) return null;
  // Se ha già P.IVA, nessun banner.
  if (data.hasVat) return null;
  // Sotto il 60% non mostriamo nulla per non disturbare.
  if (data.percentage < 60 && !data.blocked) return null;

  const blocked = data.blocked || data.exceededWithoutVat;
  const warning = !blocked && data.percentage >= 80;
  const info = !blocked && !warning;

  const tone = blocked
    ? {
        wrap: "bg-destructive/10 border-destructive/40 text-destructive",
        icon: Lock,
        title: "Account bloccato: limite 5.000€/anno superato",
        body: "Per continuare a ricevere prenotazioni devi registrare la Partita IVA.",
      }
    : warning
    ? {
        wrap: "bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-400",
        icon: AlertTriangle,
        title: "Stai per raggiungere il limite senza P.IVA",
        body: "Considera di registrare la Partita IVA per evitare il blocco automatico.",
      }
    : {
        wrap: "bg-warning/10 border-warning/40 text-warning-foreground",
        icon: Info,
        title: "Avviso fatturato annuo",
        body: "Senza P.IVA puoi fatturare al massimo 5.000€ all'anno tramite la piattaforma.",
      };

  const Icon = tone.icon;

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", tone.wrap, className)}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{tone.title}</p>
          <p className="text-xs opacity-90 mt-0.5">{tone.body}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>
            €{data.annualRevenue.toLocaleString("it-IT", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            / €{data.limit.toLocaleString("it-IT")}
          </span>
          <span>{data.percentage}%</span>
        </div>
        <Progress value={data.percentage} className="h-2" />
      </div>

      {blocked && (
        <div className="rounded-lg bg-background/60 border border-current/20 p-3 space-y-2 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wide opacity-80">Motivo del blocco</p>
            <p className="mt-0.5">
              <code className="px-1.5 py-0.5 rounded bg-current/10 text-[11px]">revenue_blocked = true</code>
              {" "}— hai raggiunto €{data.annualRevenue.toLocaleString("it-IT")} di fatturato annuo
              sulla piattaforma senza Partita IVA (limite: €{data.limit.toLocaleString("it-IT")}/anno).
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide opacity-80">Come sbloccare l'account</p>
            <ol className="mt-1 ml-4 list-decimal space-y-0.5">
              <li>Apri la Partita IVA presso l'Agenzia delle Entrate (regime forfettario consigliato).</li>
              <li>Vai su <strong>Profilo → Dati Fiscali</strong> e inserisci il numero di P.IVA.</li>
              <li>L'account si sblocca automaticamente al salvataggio: potrai riprendere ad accettare prenotazioni e inviare offerte.</li>
            </ol>
          </div>
        </div>
      )}

      <Button
        size="sm"
        variant={blocked ? "default" : "outline"}
        className="w-full"
        onClick={() => navigate("/professional/profile/fiscal")}
      >
        {blocked ? "Registra Partita IVA ora" : "Gestisci dati fiscali"}
      </Button>
    </div>
  );
}

