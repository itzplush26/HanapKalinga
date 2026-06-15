const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkEmailLookupRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function resetEmailLookupRateLimit(ip: string) {
  buckets.delete(ip);
}
