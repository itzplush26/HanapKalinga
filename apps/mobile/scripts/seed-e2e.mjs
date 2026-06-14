/**
 * Seed E2E test data into Supabase.
 *
 * Creates deterministic test accounts and sample data needed by Maestro flows.
 * Uses the Supabase Admin API (service_role key) — NOT the anon key.
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

async function api(path, body) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
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
  const { id } = await api("/auth/v1/admin/users", {
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });

  // Create profile
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
  await rest("/nurses", "POST", {
    id,
    provider_type: "nurse",
    prc_license_no: `PRC-${TIMESTAMP}`,
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
  });
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

  // 4. Create pending nurse test account
  const pendingNurseEmail = `${EMAIL_PREFIX}-nurse-pending-${TIMESTAMP}@example.com`;
  const pendingNurseId = await createUser(pendingNurseEmail, "nurse", "E2E Pending Nurse");
  await createNurse(pendingNurseId, { verification_status: "pending" });
  console.log(`  Created pending nurse: ${pendingNurseEmail} (${pendingNurseId})`);

  // 5. Create sample data: a pending booking from family to verified nurse
  const booking = await createBooking(familyId, nurseId, "pending", {
    notes: "E2E test - pending booking for acceptance flow",
  });
  console.log(`  Created sample booking: ${booking.id}`);

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
  console.log(`PENDING_NURSE_EMAIL=${pendingNurseEmail}`);
  console.log(`PASSWORD=${PASSWORD}`);
  console.log(`BOOKING_ID=${booking.id}`);
  console.log(`COMPLETED_BOOKING_ID=${completedBooking.id}`);
  console.log("--- End ---");
  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
