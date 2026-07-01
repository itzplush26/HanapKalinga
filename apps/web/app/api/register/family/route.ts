import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateServerRegistrationNames } from "@/lib/validation/name";
import { buildFormattedFullName, toTitleCase } from "@/lib/validation/format-name";
import { completeFamilyRegistrationSchema } from "@/lib/validations/register-family";
import { getSignupCapacity, getSignupLimitClient, signupCapacityMessage } from "@/lib/register/signup-limits";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const nameCheck = validateServerRegistrationNames({
      firstName: body.firstName,
      middleName: body.middleName,
      lastName: body.lastName,
      patientName: body.patientName
    });

    if (!nameCheck.ok) {
      return NextResponse.json({ error: nameCheck.message }, { status: 400 });
    }

    const parsed = completeFamilyRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid registration data.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const values = parsed.data;
    const userId = auth.user.id;
    const termsAcceptedAt = values.termsAcceptedAt ?? new Date().toISOString();
    const limitClient = getSignupLimitClient(supabase);

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfileError) {
      console.error("register.family.existing.error", existingProfileError);
      return NextResponse.json({ error: "Could not verify your registration state." }, { status: 500 });
    }

    if (existingProfile?.role !== "family") {
      try {
        const capacity = await getSignupCapacity(limitClient, "family");
        if (!capacity.available) {
          return NextResponse.json({ error: signupCapacityMessage("family") }, { status: 409 });
        }
      } catch (familyCountError) {
        console.error("register.family.limit_count.error", familyCountError);
        return NextResponse.json(
          { error: "We could not verify signup capacity right now. Please try again shortly." },
          { status: 500 }
        );
      }
    }

    const normalizedFirstName = toTitleCase(values.firstName);
    const normalizedMiddleName = toTitleCase(values.middleName);
    const normalizedLastName = toTitleCase(values.lastName);
    const normalizedNameSuffix = values.nameSuffix?.trim() || null;
    const normalizedPatientName = values.patientName ? toTitleCase(values.patientName) : null;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      role: "family",
      full_name: buildFormattedFullName({
        firstName: normalizedFirstName,
        middleName: normalizedMiddleName,
        lastName: normalizedLastName,
        suffix: normalizedNameSuffix
      }),
      first_name: normalizedFirstName,
      middle_name: normalizedMiddleName || null,
      last_name: normalizedLastName,
      name_suffix: normalizedNameSuffix,
      phone: values.phone?.trim() || null,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address,
      terms_accepted_at: termsAcceptedAt
    });

    if (profileError) {
      console.error("register.family.profiles.error", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: familyError } = await supabase.from("families").upsert({
      id: userId,
      address: values.address,
      patient_name: normalizedPatientName
    });

    if (familyError) {
      console.error("register.family.families.error", familyError);
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("register.family.exception", error);
    return NextResponse.json(
      { error: "Registration could not be completed. Please try again or contact support." },
      { status: 500 }
    );
  }
}
