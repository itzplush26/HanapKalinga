export const TERMS_ACCEPTED_USER_ID_KEY = "terms_accepted_user_id";
export const TERMS_ACCEPTED_AT_KEY = "terms_accepted_at";

export function hasAcceptedTermsForUser(userId: string | null | undefined): boolean {
  if (typeof window === "undefined" || !userId) return false;
  const acceptedUserId = window.sessionStorage.getItem(TERMS_ACCEPTED_USER_ID_KEY);
  return acceptedUserId === userId;
}

export function getTermsAcceptedAtForUser(userId: string | null | undefined): string | null {
  if (typeof window === "undefined" || !userId) return null;
  if (!hasAcceptedTermsForUser(userId)) return null;
  return window.sessionStorage.getItem(TERMS_ACCEPTED_AT_KEY);
}

export function recordTermsAcceptanceForUser(userId: string): string {
  const acceptedAt = new Date().toISOString();
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(TERMS_ACCEPTED_USER_ID_KEY, userId);
    window.sessionStorage.setItem(TERMS_ACCEPTED_AT_KEY, acceptedAt);
  }
  return acceptedAt;
}

export function clearTermsAcceptanceSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TERMS_ACCEPTED_USER_ID_KEY);
  window.sessionStorage.removeItem(TERMS_ACCEPTED_AT_KEY);
}
