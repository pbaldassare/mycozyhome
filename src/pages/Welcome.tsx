import { useNavigate } from "react-router-dom";
import { AnimatedLogo } from "@/components/BrandMark";
import { ArrowRight, CalendarCheck, Clock, CreditCard, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalContacts } from "@/components/LegalContacts";

const TRUST = [
  { icon: ShieldCheck, label: "Professionisti verificati" },
  { icon: CreditCard, label: "Pagamenti sicuri" },
  { icon: Star, label: "Recensioni reali" },
];

const STEPS = [
  { icon: Search, title: "Cerca", text: "Descrivi ciò di cui hai bisogno e scopri professionisti vicino a te." },
  { icon: CalendarCheck, title: "Prenota", text: "Scegli data e orario, conferma in pochi tap. Pagamento sicuro incluso." },
  { icon: Sparkles, title: "Rilassati", text: "Un professionista verificato si prende cura della tua casa. Tu goditi il tempo." },
];

const SERVICES = [
  { img: "/illustrations/service-cleaning.jpg", label: "Pulizie" },
  { img: "/illustrations/service-ironing.jpg", label: "Stiratura" },
  { img: "/illustrations/service-petsitter.jpg", label: "Pet sitting" },
];

/** Pagina d'ingresso: stessa grafica della landing mycozyhome.it. */
export default function Welcome() {
  const navigate = useNavigate();
  const start = () => navigate("/client/welcome");

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary via-background to-background">
      <div className="mx-auto max-w-md px-5 pb-10 safe-area-pt">
        <header className="flex justify-end pt-4">
          <button onClick={() => navigate("/login")} className="font-semibold text-primary">Accedi</button>
        </header>
        <div className="pb-6 pt-2">
          <AnimatedLogo showTagline={false} />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft">
          <span className="flex text-blush">{"★★★★★"}</span> 4,9/5 · migliaia di famiglie felici
        </div>

        <div className="relative mt-4 rounded-[2rem] bg-secondary p-3 shadow-soft">
          <img src="/illustrations/welcome.jpg" alt="Professionista che si prende cura della casa" className="aspect-square w-full rounded-3xl object-cover" />
          <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-2xl bg-card px-3 py-2 shadow-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blush-light text-blush-dark"><Clock className="h-4 w-4" /></span>
            <span className="text-xs leading-tight"><strong className="block">Prenoti in 2 minuti</strong><span className="text-muted-foreground">senza stress</span></span>
          </div>
        </div>

        <h1 className="mt-8 text-center text-4xl font-extrabold leading-tight tracking-tight">
          La tua casa,<br /><span className="text-primary">in ottime mani.</span>
        </h1>
        <p className="mt-3 text-center text-muted-foreground">
          MyCozyHome connette chi vuole godersi i propri spazi con professionisti affidabili per{" "}
          <strong className="text-foreground">pulizie, stiratura, pet sitting</strong> e altri lavori domestici.
        </p>

        <div className="mt-6 space-y-3">
          <Button size="lg" className="h-14 w-full text-base" onClick={start}>
            Trova un professionista <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-14 w-full text-base" onClick={() => navigate("/professional/welcome")}>
            Lavora con noi come Professionista
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {TRUST.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card px-2 py-3 text-center shadow-soft">
              <t.icon className="h-5 w-5 text-primary" />
              <span className="text-[11px] leading-tight text-muted-foreground">{t.label}</span>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-center text-2xl font-bold">Come funziona</h2>
          <p className="text-center text-sm text-muted-foreground">Tre passi. Zero pensieri.</p>
          <div className="mt-5 space-y-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-4 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <s.icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>
                </span>
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-center text-2xl font-bold">Servizi per ogni esigenza</h2>
          <p className="text-center text-sm text-muted-foreground">E molto altro, sempre a portata di tap.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {SERVICES.map((s) => (
              <button key={s.label} onClick={start} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
                <img src={s.img} alt={s.label} className="aspect-square w-full object-cover" />
                <span className="block py-2 text-sm font-semibold">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] bg-brand-gradient p-6 text-white shadow-soft">
          <ShieldCheck className="h-8 w-8" />
          <h2 className="mt-4 text-2xl font-bold leading-tight">Rilassati. Al resto pensiamo noi.</h2>
          <p className="mt-2 text-sm text-white/90">
            Professionisti selezionati e verificati, pagamenti protetti e assistenza dedicata. Riprenditi il tuo tempo libero: la tua casa è in ottime mani.
          </p>
          <button onClick={start} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-primary">
            Inizia ora — è gratis <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <button onClick={() => navigate("/login")} className="font-semibold text-primary">Accedi</button>
        </p>

        <div className="mt-8"><LegalContacts /></div>
      </div>
    </div>
  );
}
