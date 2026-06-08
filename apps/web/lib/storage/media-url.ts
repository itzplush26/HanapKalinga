/** Client-safe profile photo URL resolver (uses NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL). */
export function resolveProfilePhotoUrl(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;

  const value = stored.trim();
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }

  const base = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) return null;

  return `${base}/${value.replace(/^\/+/, "")}`;
}
