import type { PostgrestError } from "@supabase/supabase-js";
import { toUserMessage } from "@/lib/errors";

export const WALLET_NOT_ACTIVE_MESSAGE =
  "Il sistema dei crediti non è disponibile in questo momento. Riprova più tardi.";

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
  return toUserMessage(error);
}
