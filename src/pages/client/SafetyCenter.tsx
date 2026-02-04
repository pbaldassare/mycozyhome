import {
  Shield,
  MessageCircle,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/client/AppHeader";
import { TrustIndicator } from "@/components/client/TrustIndicator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const rules = [
  {
    icon: MessageCircle,
    title: "Usa solo la chat interna",
    description:
      "Tutte le comunicazioni devono avvenire tramite la chat della piattaforma. Questo garantisce tracciabilità e sicurezza.",
    allowed: true,
  },
  {
    icon: Lock,
    title: "Non condividere dati personali",
    description:
      "Non scambiare numeri di telefono, email o altri contatti diretti. La piattaforma protegge la tua privacy.",
    allowed: false,
  },
  {
    icon: AlertTriangle,
    title: "Niente link esterni",
    description:
      "Non cliccare su link condivisi in chat e non condividerne. Potrebbero essere tentativi di truffa.",
    allowed: false,
  },
  {
    icon: Users,
    title: "Rispetta gli altri utenti",
    description:
      "Mantieni un comportamento professionale e rispettoso. Linguaggio offensivo o discriminatorio non è tollerato.",
    allowed: true,
  },
];

const faqs = [
  {
    question: "Come vengono verificati i professionisti?",
    answer:
      "Ogni professionista deve caricare un documento d'identità valido che viene verificato manualmente dal nostro team. Solo dopo l'approvazione il professionista diventa visibile sulla piattaforma.",
  },
  {
    question: "Cosa succede se ho un problema con un servizio?",
    answer:
      "Puoi aprire una segnalazione dalla sezione 'Prenotazioni' entro 7 giorni dal servizio. Il nostro team esaminerà il caso e ti contatterà per trovare una soluzione.",
  },
  {
    question: "I miei dati sono al sicuro?",
    answer:
      "Sì, utilizziamo crittografia avanzata per proteggere tutti i tuoi dati. Le tue informazioni personali non vengono mai condivise con terzi senza il tuo consenso.",
  },
  {
    question: "Come funzionano le recensioni?",
    answer:
      "Puoi lasciare una recensione solo dopo aver completato un servizio. Le recensioni sono pubbliche e aiutano altri utenti a scegliere. Non è possibile modificare o eliminare una recensione.",
  },
  {
    question: "Posso contattare un professionista fuori dalla piattaforma?",
    answer:
      "No, per la tua sicurezza tutte le comunicazioni devono avvenire tramite la chat interna. I messaggi che contengono numeri di telefono o email vengono automaticamente filtrati.",
  },
  {
    question: "Cosa succede se un professionista si comporta in modo inappropriato?",
    answer:
      "Segnala immediatamente il comportamento tramite l'apposito pulsante in chat o nella sezione prenotazioni. Il nostro team interverrà tempestivamente e, se necessario, sospenderà il professionista.",
  },
];

export default function SafetyCenter() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Centro sicurezza" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-10 w-10 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">La tua sicurezza è la nostra priorità</h1>
            <p className="text-muted-foreground mt-2">
              Scopri come proteggiamo te e i tuoi dati sulla piattaforma
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="space-y-3">
          <TrustIndicator
            type="verified"
            title="Professionisti verificati"
            description="Tutti i documenti vengono controllati manualmente"
          />
          <TrustIndicator
            type="secure"
            title="Pagamenti sicuri"
            description="Transazioni protette e tracciate"
          />
          <TrustIndicator
            type="protected"
            title="Chat protetta"
            description="Comunicazioni monitorate e filtrate"
          />
        </div>

        {/* Rules Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Regole della piattaforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    rule.allowed ? "bg-success/10" : "bg-destructive/10"
                  }`}
                >
                  {rule.allowed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{rule.title}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Domande frequenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center">
            <h3 className="font-semibold">Hai bisogno di aiuto?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Il nostro team di supporto è disponibile 7 giorni su 7
            </p>
            <button className="mt-4 text-primary font-medium text-sm">
              Contatta l'assistenza →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
