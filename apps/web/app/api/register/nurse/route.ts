import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { completeNurseRegistrationSchema } from "@/lib/validations/register-nurse";
import { validateDocumentPathsForUser } from "@/lib/register/validate-document-paths";
import {
  resolveDailyRateBandValues,
  resolveHourlyRateBandValues,
  type DailyRateBandId,
  type HourlyRateBandId
} from "@/lib/rate-ranges";
import { isProviderRole, profileRoleForProviderType } from "@/lib/provider-role";
import { hasRequiredDocuments } from "@/lib/admin/verification-documents";
import { toTitleCase } from "@/lib/validation/format-name";

const isServiceRoleConfigured = Boolean(
  process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);
if (!isServiceRoleConfigured) {
  console.error(
    "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not configured. Nurse registration will fail until this is resolved. Check Vercel environment variables."
  );
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsed = completeNurseRegistrationSchema.safeParse(await request.json());
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid registration data.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const values = parsed.data;
    const userId = auth.user.id;
    const termsAcceptedAt = values.termsAcceptedAt ?? new Date().toISOString();

    if (!isServiceRoleConfigured) {
      return NextResponse.json(
        { error: "Registration could not be completed. Please try again or contact support." },
        { status: 503 }
      );
    }

    const pathError = validateDocumentPathsForUser(userId, {
      prc: values.prcDocumentPath,
      tesda: values.tesdaDocumentPath,
      nbi: values.nbiDocumentPath
    });

    if (pathError) {
      return NextResponse.json({ error: pathError }, { status: 400 });
    }

    const documentPayload = {
      provider_type: values.providerType,
      prc_document_url: values.providerType === "nurse" ? values.prcDocumentPath!.trim() : null,
      tesda_document_url: values.providerType === "caregiver" ? values.tesdaDocumentPath!.trim() : null,
      nbi_document_url: values.nbiDocumentPath.trim()
    };

    if (!hasRequiredDocuments(documentPayload)) {
      return NextResponse.json(
        { error: "All required verification documents must be uploaded before completing registration." },
        { status: 400 }
      );
    }

    const normalizedFirstName = toTitleCase(values.firstName);
    const normalizedMiddleName = toTitleCase(values.middleName);
    const normalizedLastName = toTitleCase(values.lastName);
    const fullName = [normalizedFirstName, normalizedMiddleName, normalizedLastName]
      .filter((part) => part?.trim())
      .join(" ");

    const hourlyRates = resolveHourlyRateBandValues(
      (values.hourlyRateRange || undefined) as HourlyRateBandId | undefined
    );
    const dailyRates = resolveDailyRateBandValues(
      (values.dailyRateRange || undefined) as DailyRateBandId | undefined
    );

    const service = createServiceClient();
    const submittedAt = new Date().toISOString();

    const profileRole = profileRoleForProviderType(values.providerType);

    const { error: profileError } = await service.from("profiles").upsert({
      id: userId,
      role: profileRole,
      full_name: fullName,
      first_name: normalizedFirstName,
      middle_name: normalizedMiddleName || null,
      last_name: normalizedLastName,
      phone: null,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: null,
      terms_accepted_at: termsAcceptedAt
    });

    if (profileError) {
      console.error("register.nurse.profiles.error", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: nurseError } = await service.from("nurses").upsert(
      {
        id: userId,
        provider_type: values.providerType,
        specializations: values.specializations,
        years_experience: 0,
        bio: values.bio?.trim() || null,
        hourly_rate: hourlyRates.min,
        hourly_rate_max: hourlyRates.max,
        hourly_rate_range: values.hourlyRateRange || null,
        daily_rate_12hr: dailyRates.min,
        daily_rate_12hr_max: dailyRates.max,
        daily_rate_range: values.dailyRateRange || null,
        prc_license_no: values.providerType === "nurse" ? values.prcLicenseNo?.trim() || null : null,
        prc_document_url: documentPayload.prc_document_url,
        tesda_document_url: documentPayload.tesda_document_url,
        tesda_certificate_no: values.tesdaCertificateNo?.trim() || null,
        nbi_document_url: documentPayload.nbi_document_url,
        verification_status: "pending",
        submitted_at: submittedAt
      },
      { onConflict: "id" }
    );

    if (nurseError) {
      console.error("register.nurse.nurses.error", nurseError);
      return NextResponse.json({ error: nurseError.message }, { status: 500 });
    }

    try {
      await service.auth.admin.updateUserById(userId, {
        user_metadata: { role: profileRole, provider_type: values.providerType }
      });
    } catch (metadataError) {
      console.error("register.nurse.auth_metadata.error", metadataError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("register.nurse.exception", error);
    return NextResponse.json(
      { error: "Registration could not be completed. Please try again or contact support." },
      { status: 500 }
    );
  }
}
