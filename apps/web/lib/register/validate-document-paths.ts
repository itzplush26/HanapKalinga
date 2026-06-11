/** Ensures uploaded document paths belong to the authenticated user. */
export function validateDocumentPathsForUser(
  userId: string,
  paths: { prc?: string | null; tesda?: string | null; nbi: string }
): string | null {
  const normalizedUserPrefix = `${userId}/`;

  for (const [label, path] of [
    ["PRC license", paths.prc],
    ["TESDA certificate", paths.tesda],
    ["NBI clearance", paths.nbi]
  ] as const) {
    if (!path?.trim()) continue;
    const normalized = path.trim().replace(/^\/+/, "");
    if (!normalized.startsWith(normalizedUserPrefix)) {
      return `${label} path is invalid for this account.`;
    }
  }

  return null;
}
