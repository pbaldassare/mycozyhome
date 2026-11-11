import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TERMS_URL } from "@/lib/legal";

export interface Consent { adult: boolean; terms: boolean; clauses: boolean }

/** Clausole da approvare specificamente (artt. 1341-1342 c.c.): TU art. 22, TP art. 23. */
const CLAUSES = {
  client:
    "4.1 e 4.2 (natura del Professionista e tutele applicabili); 7.3, 7.4 e 7.5 (versamento automatico, check-in e regola automatica in caso di mancata presentazione, effetti delle segnalazioni); 7.8 (pagamenti tramite Piattaforma e chiusura definitiva degli account); 8.1, 8.2 e 8.3 (fase di preparazione, importo dovuto in caso di annullamento o recesso tardivo, penale per mancata apertura); 10.2, 10.3 e 10.5 (limiti dei controlli e della verifica della polizza); 12.2 e 12.3 (fatti di cui MyCozyHome non risponde); 14 (sospensione e chiusura dell'account); 19 (cessione del contratto).",
  professional:
    "3.2, 3.3 e 3.4 (obblighi sulla partita IVA, assenza di verifiche e manleva); 4.2, 4.3, 4.4, 4.5 e 4.6 (limiti dell'esame dei documenti, obblighi sulla polizza, facoltà di mettere offline il profilo, esclusione di responsabilità e manleva); 7.4 (importi dovuti in caso di annullamento e mancata apertura); 15 (assenza di rimborso del canone e autorizzazione ai rimborsi); 8 (commissione, canone, blocco e versamento automatico dei pagamenti, check-in e regola automatica in caso di mancata presentazione, chargeback e divieto di pagamenti fuori Piattaforma; obbligo di non aggiramento, quota di riscatto e penale); 9.3 (sospensione dei pagamenti); 12 (sospensione, cause di esclusione, clausola risolutiva espressa, compensazione e divieto di nuova iscrizione); 14 (modifiche ai Termini); 16 (limitazioni di responsabilità); 17 (manleva generale); 20 (cessione del contratto); 22 (foro competente).",
};

/** Dichiarazioni obbligatorie alla registrazione: TU 5.1, accettazione dei Termini, approvazione specifica. */
export function TermsConsent({ role, value, onChange, error }: { role: keyof typeof CLAUSES; value: Consent; onChange: (v: Consent) => void; error?: string }) {
  const row = (key: keyof Consent, text: ReactNode) => (
    <label className="flex items-start gap-3 text-sm leading-snug">
      <Checkbox checked={value[key]} onCheckedChange={(c) => onChange({ ...value, [key]: c === true })} className="mt-0.5" />
      <span>{text}</span>
    </label>
  );
  return (
    <div className="space-y-3">
      {row("adult", "Dichiaro di avere almeno 18 anni e che i dati inseriti sono veritieri.")}
      {row("terms", (
        <>
          Ho letto e accetto i{" "}
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
            Termini e condizioni, l'Informativa privacy e la Cookie policy
          </a>
          .
        </>
      ))}
      {row("clauses", (
        <>
          Ai sensi degli artt. 1341 e 1342 c.c. approvo specificamente le clausole dei Termini:{" "}
          <span className="text-muted-foreground">{CLAUSES[role]}</span>
        </>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
