export const PLATFORM_BLOCKED_MESSAGE =
  "Il tuo account è bloccato. Puoi ancora contattare l'assistenza tramite chat o ticket.";

export function assertNotPlatformBlocked(isBlocked: boolean) {
  if (isBlocked) {
    throw new Error(PLATFORM_BLOCKED_MESSAGE);
  }
}
