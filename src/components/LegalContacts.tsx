import { LEGAL_PEC, TERMS_ARCHIVE } from "@/lib/legal";

/** Contatti legali visibili a tutti: assistenza, PEC e punto di contatto DSA. */
export function LegalContacts({ supportPath }: { supportPath?: string }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground space-y-1">
      <p className="font-semibold text-foreground">Contatti</p>
      {supportPath && (
        <p>Assistenza: <a href={supportPath} className="font-medium text-primary">modulo di assistenza</a></p>
      )}
      <p>PEC: <a href={`mailto:${LEGAL_PEC}`} className="font-medium text-primary">{LEGAL_PEC}</a></p>
      <p>Punto di contatto unico per autorità e utenti (Reg. UE 2022/2065, DSA): {LEGAL_PEC}</p>
      <p>MyCozyHome è un servizio di Ri.Sco.</p>
      <p className="font-semibold text-foreground pt-2">Condizioni e policy</p>
      {TERMS_ARCHIVE.map((t, i) => (
        <p key={t.version}>
          <a href={t.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary">
            {t.label}
          </a>
          {i === 0 && " (attuale)"}
        </p>
      ))}
    </section>
  );
}
