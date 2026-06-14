/**
 * Cleanup E2E test data from Supabase.
 *
 * Deletes all records created by seed-e2e.mjs (email prefix: e2e-test-*).
 * Deletion order respects foreign key constraints.
 *
 * Usage:
 *   node scripts/cleanup-e2e.mjs
 *
 * Required env vars:
 *   SUPABASE_URL        — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (admin)
 *   TEST_EMAIL_PREFIX   — prefix to match (default: e2e-test)
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_PREFIX = process.env.TEST_EMAIL_PREFIX || "e2e-test";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "Prefer": "return=minimal",
};

async function rest(path, method = "GET", body = undefined) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...HEADERS,
      "Prefer": method === "DELETE" ? "return=minimal" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Supabase REST error (${res.status}): ${JSON.stringify(data)}`);
  }
  return res;
}

async function deleteRecords(table, filter) {
  const filterStr = Object.entries(filter)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  await rest(`/${table}?${filterStr}`, "DELETE");
  console.log(`  Deleted from ${table}`);
}

async function getIds(table, column, filter) {
  const filterStr = Object.entries(filter)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${column}&${filterStr}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((r) => r[column]);
}

async function main() {
  console.log(`Cleaning up E2E test data (prefix: ${EMAIL_PREFIX})...`);

  // Find all E2E test profile IDs
  const ids = await getIds("profiles", "id", {
    "full_name": `like.E2E %`,
  });

  if (ids.length === 0) {
    console.log("  No E2E test profiles found. Nothing to clean up.");
    return;
  }

  console.log(`  Found ${ids.length} test profiles to clean up.`);

  // Delete in dependency-safe order
  await deleteRecords("care_request_applications", { "nurse_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("care_requests", { "family_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("incident_reports", { "reporter_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("user_blocks", { "blocker_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("reviews", { "reviewer_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("messages", { "sender_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("availability_date_exceptions", { "nurse_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("nurse_weekly_availability", { "nurse_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("availability", { "nurse_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("bookings", { "family_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("verification_audit_logs", { "admin_id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });

  // Delete nurse and family records
  await deleteRecords("nurses", { "id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });
  await deleteRecords("families", { "id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });

  // Delete profiles
  await deleteRecords("profiles", { "id": `in.(${ids.map((id) => `"${id}"`).join(",")})` });

  // Delete auth users via Admin API
  for (const id of ids) {
    try {
      const url = `${SUPABASE_URL}/auth/v1/admin/users/${id}`;
      await fetch(url, { method: "DELETE", headers: HEADERS });
      console.log(`  Deleted auth user: ${id}`);
    } catch (err) {
      console.warn(`  Warning: Could not delete auth user ${id}: ${err.message}`);
    }
  }

  console.log("Cleanup complete.");
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
