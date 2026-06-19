import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { careRequestSchema } from "@/lib/validations/care-request";

function validationError(error: z.ZodError) {
  const message = error.issues[0]?.message ?? "Invalid request.";
  return NextResponse.json({ error: message }, { status: 400 });
}

const closeSchema = z.object({
  action: z.literal("close")
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();

  const closeParsed = closeSchema.safeParse(body);
  if (closeParsed.success) {
    const { data: careRequest } = await supabase
      .from("care_requests")
      .select("id, status")
      .eq("id", params.id)
      .eq("family_id", auth.user.id)
      .maybeSingle();

    if (!careRequest) {
      return NextResponse.json({ error: "Care request not found." }, { status: 404 });
    }

    if (careRequest.status !== "open") {
      return NextResponse.json(
        { error: "Only open care requests can be closed." },
        { status: 400 }
      );
    }

    const { error: closeError } = await supabase
      .from("care_requests")
      .update({ status: "closed" })
      .eq("id", params.id);

    if (closeError) {
      return NextResponse.json({ error: closeError.message }, { status: 500 });
    }

    const { error: declineError } = await supabase
      .from("care_request_applications")
      .update({ status: "declined" })
      .eq("care_request_id", params.id)
      .eq("status", "pending");

    if (declineError) {
      return NextResponse.json({ error: declineError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, careRequestId: params.id, status: "closed" });
  }

  const parsed = careRequestSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { data: careRequest } = await supabase
    .from("care_requests")
    .select("id, status")
    .eq("id", params.id)
    .eq("family_id", auth.user.id)
    .maybeSingle();

  if (!careRequest) {
    return NextResponse.json({ error: "Care request not found." }, { status: 404 });
  }

  if (careRequest.status !== "open") {
    return NextResponse.json(
      { error: "Only open care requests can be edited." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("care_requests")
    .update({
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
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, careRequestId: params.id });
}
