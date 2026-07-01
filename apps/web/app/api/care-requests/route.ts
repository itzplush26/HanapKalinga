import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getUserEmail } from "@/lib/email/user-email";
import { careRequestPostedEmail } from "@/lib/email/templates/care-request-posted";
import { getDailyRateBand } from "@/lib/data/rates";
import { careRequestSchema } from "@/lib/validations/care-request";

function validationError(error: z.ZodError) {
  const message = error.issues[0]?.message ?? "Invalid request.";
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = careRequestSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const { data: careRequest, error } = await supabase
    .from("care_requests")
    .insert({
      family_id: auth.user.id,
      title: parsed.data.title,
      patient_condition: parsed.data.patientCondition,
      care_type: parsed.data.careType,
      required_specializations: parsed.data.requiredSpecializations,
      preferred_provider_type: parsed.data.preferredProviderType,
      region: parsed.data.region,
      city: parsed.data.city,
      barangay: parsed.data.barangay,
      budget_band: parsed.data.budgetBand,
      shift_preference: parsed.data.shiftPreference ?? null,
      start_date: parsed.data.startDate ?? null,
      duration_description: parsed.data.durationDescription
    })
    .select("id")
    .single();

  if (error || !careRequest) {
    return NextResponse.json({ error: error?.message ?? "Failed." }, { status: 500 });
  }

  void notifyMatchingNurses(careRequest.id, parsed.data);

  return NextResponse.json({ careRequestId: careRequest.id });
}

async function notifyMatchingNurses(
  careRequestId: string,
  data: z.infer<typeof careRequestSchema>
) {
  const service = createServiceClient();
  const { data: nurses } = await service
    .from("nurses")
    .select("id, specializations, profiles!nurses_id_fkey(full_name, region)")
    .in("verification_status", ["verified", "renewal_under_review"]);
  const budgetLabel = getDailyRateBand(data.budgetBand)?.label ?? "Open to discuss";

  for (const nurse of nurses ?? []) {
    const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
    if (data.region && profile?.region !== data.region) continue;

    const nurseSpecs = (nurse.specializations ?? []) as string[];
    if (!data.requiredSpecializations.some((s) => nurseSpecs.includes(s))) continue;

    const email = await getUserEmail(nurse.id as string);
    if (!email) continue;
    const { subject, html } = careRequestPostedEmail({
      nurseName: profile?.full_name?.trim() || "Nurse",
      title: data.title,
      city: [data.barangay, data.city].filter(Boolean).join(", ") || "your area",
      careType: data.careType.replace("_", " "),
      budgetLabel,
      careRequestId
    });
    sendEmailSafe({ to: email, subject, html });
  }
}
