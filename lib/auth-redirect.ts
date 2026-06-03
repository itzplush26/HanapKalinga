export function parseSafeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export function getPostLoginPath(
  role: string | undefined | null,
  safeRedirect: string | null
): string {
  if (safeRedirect) return safeRedirect;
  if (role === "family") return "/dashboard/family";
  if (role === "nurse") return "/dashboard/nurse";
  if (role === "admin") return "/admin";
  return "/register";
}

export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

export function getAuthCallbackUrl(nextPath: string): string {
  const origin = getAppOrigin();
  const next = encodeURIComponent(nextPath);
  return `${origin}/auth/callback?next=${next}`;
}
