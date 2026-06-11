const R2_ENV_KEYS = [
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
] as const;

export function getMissingR2EnvVars(): string[] {
  return R2_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

export function getR2ConfigError(): string | null {
  const missing = getMissingR2EnvVars();
  if (!missing.length) return null;
  return `Document storage is not configured. Missing: ${missing.join(", ")}.`;
}
