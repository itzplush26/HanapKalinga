/** Client-safe profile photo URL resolver (supports full URLs and legacy R2 paths). */
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
