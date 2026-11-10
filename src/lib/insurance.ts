/** Scadenza della polizza RC approvata più recente (specifiche §2). */
export function insuranceExpiry(docs: { type: string; status: string; expiresOn?: string | null }[]): string | null {
  const dates = docs.filter((d) => d.type === "insurance" && d.status === "approved" && d.expiresOn).map((d) => d.expiresOn!);
  return dates.length ? dates.sort().at(-1)! : null;
}

/** Badge per l'admin: scaduta, oppure in scadenza entro 30 giorni. */
export function insuranceBadge(expiresOn: string | null | undefined): { label: string; expired: boolean } | null {
  if (!expiresOn) return null;
  const days = Math.ceil((new Date(expiresOn + "T23:59:59").getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Polizza scaduta", expired: true };
  if (days <= 30) return { label: `Polizza scade tra ${days} gg`, expired: false };
  return null;
}
