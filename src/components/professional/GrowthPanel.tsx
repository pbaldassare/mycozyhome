import { useNavigate } from "react-router-dom";
import { Briefcase, CalendarClock, Camera, CheckCircle2, ChevronRight, Package, PenLine, Sparkles, Wallet, ClipboardList, CalendarHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServicePackages } from "@/hooks/useProfessionalData";

interface Props {
  professional: { id: string; avatar_url: string | null; bio: string | null };
}

/** Azioni rapide colorate: le pagine che il professionista apre più spesso. */
export function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: "Richieste in zona", icon: ClipboardList, to: "/professional/service-board", color: "bg-amber-100 text-amber-600" },
    { label: "Servizi e pacchetti", icon: Briefcase, to: "/professional/services", color: "bg-sky-100 text-sky-600" },
    { label: "Disponibilità", icon: CalendarClock, to: "/professional/availability", color: "bg-emerald-100 text-emerald-600" },
    { label: "Guadagni", icon: Wallet, to: "/professional/earnings", color: "bg-violet-100 text-violet-600" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <button key={a.to} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 text-center">
          <span className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-soft", a.color)}>
            <a.icon className="h-6 w-6" />
          </span>
          <span className="text-[11px] font-semibold leading-tight">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Agenda vuota: invece di un riquadro grigio, un invito a riempirla. */
export function EmptyAgenda() {
  const navigate = useNavigate();
  return (
    <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-border/60 p-5 flex items-center gap-4 shadow-soft">
      <span className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-white flex items-center justify-center shadow-md">
        <CalendarHeart className="h-7 w-7" />
      </span>
      <div className="flex-1">
        <p className="font-bold">Giornata libera ✨</p>
        <p className="text-sm text-muted-foreground">Più orari apri, più prenotazioni ricevi.</p>
        <button onClick={() => navigate("/professional/availability")} className="mt-1 text-sm font-semibold text-primary">
          Apri nuovi orari →
        </button>
      </div>
    </div>
  );
}

/** Checklist per completare il profilo e ricevere più richieste. */
export function ProfileChecklist({ professional }: Props) {
  const navigate = useNavigate();
  const { data: packages } = useServicePackages(professional.id);
  const steps = [
    { done: !!professional.avatar_url, label: "Aggiungi una foto profilo", hint: "I profili con foto ricevono più richieste", icon: Camera, to: "/professional/profile/personal", color: "bg-rose-100 text-rose-500" },
    { done: (professional.bio?.trim().length ?? 0) >= 40, label: "Scrivi una presentazione", hint: "Racconta come lavori in 2-3 frasi", icon: PenLine, to: "/professional/profile/personal", color: "bg-amber-100 text-amber-600" },
    { done: (packages?.length ?? 0) > 0, label: "Crea un pacchetto a prezzo fisso", hint: "Es. \"Pulizia bilocale · 3h · €45\"", icon: Package, to: "/professional/services", color: "bg-sky-100 text-sky-600" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <section className="rounded-3xl bg-card border border-border/60 shadow-soft p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <h2 className="font-bold">Fai crescere il tuo profilo</h2>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">{doneCount}/{steps.length}</span>
      </div>
      <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <div className="mt-3 space-y-1">
        {steps.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.to)}
            disabled={s.done}
            className="w-full flex items-center gap-3 rounded-2xl p-2 text-left hover:bg-muted/60 disabled:opacity-60"
          >
            <span className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center", s.done ? "bg-emerald-100 text-emerald-600" : s.color)}>
              {s.done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className={cn("block text-sm font-semibold", s.done && "line-through")}>{s.label}</span>
              <span className="block text-xs text-muted-foreground truncate">{s.hint}</span>
            </span>
            {!s.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        ))}
      </div>
    </section>
  );
}
