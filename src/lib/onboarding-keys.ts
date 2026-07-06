export const CLIENT_STORY_SEEN_KEY = "client_story_seen";
export const PROFESSIONAL_STORY_SEEN_KEY = "professional_story_seen";

export function isClientStorySeen(): boolean {
  return localStorage.getItem(CLIENT_STORY_SEEN_KEY) === "true";
}

export function isProfessionalStorySeen(): boolean {
  return localStorage.getItem(PROFESSIONAL_STORY_SEEN_KEY) === "true";
}

export function markClientStorySeen(): void {
  localStorage.setItem(CLIENT_STORY_SEEN_KEY, "true");
}

export function markProfessionalStorySeen(): void {
  localStorage.setItem(PROFESSIONAL_STORY_SEEN_KEY, "true");
}
