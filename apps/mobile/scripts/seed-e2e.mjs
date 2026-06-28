/**
 * Seed E2E test data into Supabase.
 *
 * Creates deterministic test accounts and sample data needed by Maestro flows.
 * Uses the Supabase Admin API (service_role key) — NOT the anon key.
 * Uses only native fetch (no npm imports) so it can run without npm install.
 *
 * Usage:
 *   node scripts/seed-e2e.mjs
 *
 * Required env vars:
 *   SUPABASE_URL        — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (admin)
 *   TEST_EMAIL_PREFIX   — prefix for test emails (default: e2e-test)
 *   TEST_PASSWORD       — shared password for all test accounts (default: TestPass123!)
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_PREFIX = process.env.TEST_EMAIL_PREFIX || "e2e-test";
const PASSWORD = process.env.TEST_PASSWORD || "TestPass123!";
const TIMESTAMP = Date.now();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
};

async function api(path, body, method = "POST") {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase API error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function rest(path, method = "GET", body = undefined) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...HEADERS,
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase REST error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function createUser(email, role, fullName) {
  // Create auth user via Supabase Admin API
  const user = await api("/auth/v1/admin/users", {
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });
  const id = user.id;

  // Confirm email via PUT (more reliable than email_confirm in POST alone,
  // which can be ignored when "Confirm email" is enabled in Supabase Dashboard)
  try {
    await api(`/auth/v1/admin/users/${id}`, {
      email_confirm: true,
    }, "PUT");
  } catch (err) {
    console.warn(`  Warning: Could not confirm email for ${email} via PUT: ${err.message}`);
  }

  // Create profile (uses public schema REST API)
  await rest("/profiles", "POST", {
    id,
    role,
    full_name: fullName,
    first_name: fullName.split(" ")[0],
    last_name: fullName.split(" ").slice(1).join(" "),
    city: "Metro Manila",
    region: "NCR",
  });

  return id;
}

async function createNurse(id, overrides = {}) {
  // Use POST (upsert) instead of PATCH so the record is created if it doesn't exist.
  // Supabase REST API upserts when sending POST with Prefer: resolution=merge-duplicates.
  const url = `${SUPABASE_URL}/rest/v1/nurses`;
  const body = {
    id,
    provider_type: "nurse",
    prc_license_no: `PRC-${TIMESTAMP}`,
    prc_document_url: `https://example.com/prc-${TIMESTAMP}.pdf`,
    nbi_document_url: `https://example.com/nbi-${TIMESTAMP}.pdf`,
    specializations: overrides.specializations || ["General Care"],
    years_experience: 5,
    bio: "Experienced nurse for E2E testing.",
    hourly_rate: 150,
    daily_rate_12hr: 1200,
    verification_status: overrides.verification_status || "verified",
    hourly_rate_max: 250,
    daily_rate_12hr_max: 2000,
    profile_slug: `e2e-nurse-${TIMESTAMP}`,
    submitted_at: new Date().toISOString(),
    ...overrides,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Prefer": "return=representation, resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase REST upsert error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function createFamily(id) {
  await rest("/families", "POST", {
    id,
    patient_name: "E2E Test Patient",
    patient_age: 65,
    patient_condition: "General Care",
    care_needed: "Daily assistance",
  });
}

async function createBooking(familyId, nurseId, status, overrides = {}) {
  const [data] = await rest("/bookings", "POST", {
    family_id: familyId,
    nurse_id: nurseId,
    requested_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    shift: "morning",
    status,
    notes: `E2E test booking (${status})`,
    ...overrides,
  });
  return data;
}

async function createAvailability(nurseId, dayOfWeek, shift) {
  await rest("/nurse_weekly_availability", "POST", {
    nurse_id: nurseId,
    day_of_week: dayOfWeek,
    shift,
    is_open: true,
  }).catch(() => {
    // Ignore duplicate key errors
  });
}

async function main() {
  console.log(`Seeding E2E test data (timestamp: ${TIMESTAMP})...`);

  // 1. Create admin test account
  const adminEmail = `${EMAIL_PREFIX}-admin-${TIMESTAMP}@example.com`;
  const adminId = await createUser(adminEmail, "admin", "E2E Admin");
  console.log(`  Created admin: ${adminEmail} (${adminId})`);

  // 2. Create family test account
  const familyEmail = `${EMAIL_PREFIX}-family-${TIMESTAMP}@example.com`;
  const familyId = await createUser(familyEmail, "family", "E2E Family User");
  await createFamily(familyId);
  console.log(`  Created family: ${familyEmail} (${familyId})`);

  // 3. Create verified nurse test account
  const nurseEmail = `${EMAIL_PREFIX}-nurse-${TIMESTAMP}@example.com`;
  const nurseId = await createUser(nurseEmail, "nurse", "E2E Nurse User");
  await createNurse(nurseId, { verification_status: "verified" });
  console.log(`  Created verified nurse: ${nurseEmail} (${nurseId})`);

  // 4. Create pending nurse test accounts (one per admin verification action)
  //     Each admin flow (approve, reject, detail) needs its own pending nurse
  //     because they run sequentially and actions (approve/reject) mutate the status.
  const pendingApproveEmail = `${EMAIL_PREFIX}-nurse-pending-approve-${TIMESTAMP}@example.com`;
  const pendingApproveId = await createUser(pendingApproveEmail, "nurse", "E2E Pending Approve Nurse");
  await createNurse(pendingApproveId, { verification_status: "pending", profile_slug: `e2e-nurse-pending-approve-${TIMESTAMP}` });
  console.log(`  Created pending nurse (approve): ${pendingApproveEmail} (${pendingApproveId})`);

  const pendingRejectEmail = `${EMAIL_PREFIX}-nurse-pending-reject-${TIMESTAMP}@example.com`;
  const pendingRejectId = await createUser(pendingRejectEmail, "nurse", "E2E Pending Reject Nurse");
  await createNurse(pendingRejectId, { verification_status: "pending", profile_slug: `e2e-nurse-pending-reject-${TIMESTAMP}` });
  console.log(`  Created pending nurse (reject): ${pendingRejectEmail} (${pendingRejectId})`);

  const pendingDetailEmail = `${EMAIL_PREFIX}-nurse-pending-detail-${TIMESTAMP}@example.com`;
  const pendingDetailId = await createUser(pendingDetailEmail, "nurse", "E2E Pending Detail Nurse");
  await createNurse(pendingDetailId, { verification_status: "pending", profile_slug: `e2e-nurse-pending-detail-${TIMESTAMP}` });
  console.log(`  Created pending nurse (detail): ${pendingDetailEmail} (${pendingDetailId})`);

  // 5. Create sample data: a pending booking from family to verified nurse
  const booking = await createBooking(familyId, nurseId, "pending", {
    notes: "E2E test - pending booking for acceptance flow",
  });
  console.log(`  Created sample booking: ${booking.id}`);

  // 5b. Create a second pending booking for the decline flow.
  //      Must be a separate booking so both accept-booking and decline-booking
  //      can act on a pending booking (they share a shard and run sequentially).
  const declineBooking = await createBooking(familyId, nurseId, "pending", {
    notes: "E2E test - pending booking for decline flow",
    requested_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
  });
  console.log(`  Created decline booking: ${declineBooking.id}`);

  // 6. Create sample availability for the verified nurse
  for (let day = 1; day <= 7; day++) {
    await createAvailability(nurseId, day, "morning");
    await createAvailability(nurseId, day, "afternoon");
  }
  console.log("  Created sample availability (Mon-Sun: morning, afternoon)");

  // 7. Create a completed booking with a review field available
  const completedBooking = await createBooking(familyId, nurseId, "completed", {
    requested_date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    notes: "E2E test - completed booking",
    nurse_marked_complete: true,
    family_marked_complete: true,
  });
  console.log(`  Created completed booking: ${completedBooking.id}`);

  // Output account details for test flows to use
  console.log("\n--- E2E Test Accounts ---");
  console.log(`ADMIN_EMAIL=${adminEmail}`);
  console.log(`FAMILY_EMAIL=${familyEmail}`);
  console.log(`NURSE_EMAIL=${nurseEmail}`);
  console.log(`PENDING_NURSE_EMAIL=${pendingApproveEmail}`);
  console.log(`PASSWORD=${PASSWORD}`);
  console.log(`NURSE_ID=${nurseId}`);
  console.log(`VERIFICATION_ID=${pendingApproveId}`);
  console.log(`VERIFICATION_ID_APPROVE=${pendingApproveId}`);
  console.log(`VERIFICATION_ID_REJECT=${pendingRejectId}`);
  console.log(`VERIFICATION_ID_DETAIL=${pendingDetailId}`);
  console.log(`BOOKING_ID=${booking.id}`);
  console.log(`DECLINE_BOOKING_ID=${declineBooking.id}`);
  console.log(`COMPLETED_BOOKING_ID=${completedBooking.id}`);
  console.log("--- End ---");

  // Verify that seeded users exist and are email-confirmed (fail fast if they don't).
  // We use the Admin API (service_role key) instead of the password grant endpoint
  // because the password grant endpoint enforces captcha protection, which the seed
  // script cannot solve. The Admin API bypasses captcha.
  console.log("\nVerifying seeded users via Admin API...");
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${familyId}`, {
    method: "GET",
    headers: HEADERS,
  });
  if (!verifyRes.ok) {
    const verifyErr = await verifyRes.json().catch(() => ({}));
    console.error(`❌ VERIFICATION FAILED: Seeded user not found via Admin API!`);
    console.error(`   Lookup for ${familyEmail} (id: ${familyId}) returned: ${JSON.stringify(verifyErr)}`);
    console.error(`   This means the seed did not create the user correctly.`);
    process.exit(1);
  }
  const verifyUser = await verifyRes.json();
  if (!verifyUser.email_confirmed_at) {
    console.error(`❌ VERIFICATION FAILED: Seeded user email is not confirmed!`);
    console.error(`   User ${familyEmail} has email_confirmed_at: null`);
    console.error(`   Check Supabase Dashboard → Authentication → Settings → "Confirm email" settings.`);
    process.exit(1);
  }
  console.log("  ✅ Seeded user verified (exists, email confirmed).");

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
