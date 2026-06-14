import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getUserEmail } from "@/lib/email/user-email";
import { careRequestPostedEmail } from "@/lib/email/templates/care-request-posted";
import { getDailyRateBand } from "@/lib/data/rates";

const bodySchema = z.object({
  title: z.string().min(5),
  patientCondition: z.string().min(5),
  careType: z.enum(["full_time", "part_time", "live_in", "per_shift"]),
  requiredSpecializations: z.array(z.string()).min(1),
  preferredProviderType: z.enum(["nurse", "caregiver", "both"]),
  region: z.string().optional(),
  city: z.string().optional(),
  budgetBand: z.string().optional(),
  shiftPreference: z.string().optional(),
  startDate: z.string().optional(),
  durationDescription: z.string().optional()
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { data: careRequest, error } = await supabase
    .from("care_requests")
    .insert({
      family_id: auth.user.id,
      title: parsed.data.title,
      patient_condition: parsed.data.patientCondition,
      care_type: parsed.data.careType,
      required_specializations: parsed.data.requiredSpecializations,
      preferred_provider_type: parsed.data.preferredProviderType,
      region: parsed.data.region ?? null,
      city: parsed.data.city ?? null,
      budget_band: parsed.data.budgetBand ?? null,
      shift_preference: parsed.data.shiftPreference ?? null,
      start_date: parsed.data.startDate ?? null,
      duration_description: parsed.data.durationDescription ?? null
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
  data: z.infer<typeof bodySchema>
) {
  const service = createServiceClient();
  const { data: nurses } = await service
    .from("nurses")
    .select("id, specializations, profiles!nurses_id_fkey(full_name, region)")
    .eq("verification_status", "verified");
  const budgetLabel = getDailyRateBand(data.budgetBand ?? "")?.label ?? "Open to discuss";

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
      city: data.city ?? "your area",
      careType: data.careType.replace("_", " "),
      budgetLabel,
      careRequestId
    });
    sendEmailSafe({ to: email, subject, html });
  }
}
