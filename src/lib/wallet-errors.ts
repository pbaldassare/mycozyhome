import type { PostgrestError } from "@supabase/supabase-js";

export const WALLET_NOT_ACTIVE_MESSAGE =
  "Sistema pagamenti non ancora attivo sul database. Contatta l'amministratore o esegui APPLY_WALLET.sql nell'editor SQL di Supabase.";

export function isWalletSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const e = error as PostgrestError;
  if (e.code === "PGRST202" || e.code === "PGRST205" || e.code === "42P01") {
    return true;
  }

  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("could not find the function") ||
    msg.includes("schema cache") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

export function formatWalletError(error: unknown): string {
  if (isWalletSchemaMissingError(error)) {
    return WALLET_NOT_ACTIVE_MESSAGE;
  }

  if (error && typeof error === "object") {
    const e = error as PostgrestError;
    if (e.message) {
      if (e.hint) return `${e.message} — ${e.hint}`;
      if (e.details) return `${e.message} (${e.details})`;
      return e.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Errore sconosciuto";
}
