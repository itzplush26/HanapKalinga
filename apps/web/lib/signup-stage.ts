const SIGNUP_STAGE_KEYS = {
  step: "hanapkalinga.signup.step",
  userId: "hanapkalinga.signup.userId",
  role: "hanapkalinga.signup.role",
  email: "hanapkalinga.signup.email",
  family: "hanapkalinga.signup.family",
  nurse: "hanapkalinga.signup.nurse",
  auth: "hanapkalinga.signup.auth"
} as const;

const LEGACY_SIGNUP_KEYS = [
  "nurselink.signup.step",
  "nurselink.signup.role",
  "nurselink.signup.email",
  "nurselink.signup.family",
  "nurselink.signup.nurse",
  "nurselink.signup.auth"
] as const;

export const SIGNUP_TOTAL_STEPS = 4;

export function getSignupStageKeys() {
  return SIGNUP_STAGE_KEYS;
}

export function clearSignupStage(): void {
  if (typeof window === "undefined") return;
  Object.values(SIGNUP_STAGE_KEYS).forEach((key) => window.sessionStorage.removeItem(key));
  LEGACY_SIGNUP_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
}

export function saveSignupUserId(userId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.userId, userId);
}

export function readSignupUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.userId);
}

export function isSignupStageOwnedBy(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return readSignupUserId() === userId;
}

/** Clear cached wizard state when it belongs to another signed-in user. */
export function clearSignupStageIfStale(currentUserId: string | null): void {
  const storedUserId = readSignupUserId();
  if (!storedUserId) return;
  if (!currentUserId || storedUserId !== currentUserId) {
    clearSignupStage();
  }
}
