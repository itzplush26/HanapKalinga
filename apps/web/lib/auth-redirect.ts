export function parseSafeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export type AuthRole = "family" | "nurse" | "caregiver" | "admin";

function isProviderAuthRole(role: AuthRole): boolean {
  return role === "nurse" || role === "caregiver";
}

export function getPostLoginPath(role: AuthRole, safeRedirect: string | null): string {
  if (safeRedirect) {
    if (safeRedirect.startsWith("/admin") && role !== "admin") {
      return role === "family" ? "/dashboard/family" : "/dashboard/nurse";
    }
    if (safeRedirect.startsWith("/dashboard/family") && role !== "family") {
      if (role === "admin") return "/admin";
      return "/dashboard/nurse";
    }
    if (safeRedirect.startsWith("/dashboard/nurse") && !isProviderAuthRole(role)) {
      if (role === "admin") return "/admin";
      return "/dashboard/family";
    }
    return safeRedirect;
  }
  if (role === "family") return "/dashboard/family";
  if (isProviderAuthRole(role)) return "/dashboard/nurse";
  return "/admin";
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
