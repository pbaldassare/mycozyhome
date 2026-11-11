import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TERMS_URL } from "@/lib/legal";

export interface Consent { adult: boolean; terms: boolean }

/** Le due dichiarazioni obbligatorie alla registrazione (TU 5.1 e accettazione dei Termini). */
export function TermsConsent({ value, onChange, error }: { value: Consent; onChange: (v: Consent) => void; error?: string }) {
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
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
