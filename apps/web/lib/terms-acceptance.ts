const SESSION_KEY = "terms_accepted";
const STORAGE_KEY = "terms_accepted_at";
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export function hasAcceptedTermsInSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.sessionStorage.getItem(SESSION_KEY));
}

export function hasValidTermsAcceptance(): boolean {
  if (typeof window === "undefined") return false;
  if (window.sessionStorage.getItem(SESSION_KEY)) return true;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  const acceptedAt = Number(stored);
  if (!Number.isFinite(acceptedAt)) return false;

  return Date.now() - acceptedAt < TWELVE_MONTHS_MS;
}

export function recordTermsAcceptance(): void {
  if (typeof window === "undefined") return;
  const now = String(Date.now());
  window.sessionStorage.setItem(SESSION_KEY, now);
  window.localStorage.setItem(STORAGE_KEY, now);
}
