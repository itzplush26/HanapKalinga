import { checkRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

type SharedRateLimitRow = {
  allowed: boolean;
  remaining: number;
  retry_after_ms: number;
};

function normalizeRow(row: SharedRateLimitRow | null | undefined): RateLimitResult | null {
  if (!row || typeof row.allowed !== "boolean") return null;
  return {
    allowed: row.allowed,
    remaining: Number.isFinite(row.remaining) ? Math.max(Math.trunc(row.remaining), 0) : 0,
    retryAfterMs: Number.isFinite(row.retry_after_ms) ? Math.max(Math.trunc(row.retry_after_ms), 0) : 0
  };
}

/**
 * DB-backed limiter (shared across instances) with in-memory fallback.
 */
export async function checkSharedRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(Math.ceil(windowMs / 1000), 1);

  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc("check_rate_limit", {
      p_key: key,
      p_limit: Math.max(Math.trunc(limit), 1),
      p_window_seconds: windowSeconds
    });

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? normalizeRow(data[0] as SharedRateLimitRow) : null;
    if (!row) {
      throw new Error("Missing rate limit response.");
    }

    return row;
  } catch {
    return checkRateLimit(key, limit, windowMs);
  }
}
