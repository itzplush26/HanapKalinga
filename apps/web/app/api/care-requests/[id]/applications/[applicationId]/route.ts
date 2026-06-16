import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  action: z.enum(["accept", "decline"])
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; applicationId: string } }
) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const { data: careRequest } = await supabase
    .from("care_requests")
    .select("id, family_id, status")
    .eq("id", params.id)
    .eq("family_id", auth.user.id)
    .maybeSingle();

  if (!careRequest) {
    return NextResponse.json({ error: "Care request not found." }, { status: 404 });
  }

  const { data: application } = await supabase
    .from("care_request_applications")
    .select("id, status, care_request_id")
    .eq("id", params.applicationId)
    .eq("care_request_id", params.id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending applications can be updated." },
      { status: 400 }
    );
  }

  if (parsed.data.action === "decline") {
    const { error } = await supabase
      .from("care_request_applications")
      .update({ status: "declined" })
      .eq("id", params.applicationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "declined" });
  }

  if (careRequest.status === "filled") {
    return NextResponse.json(
      { error: "This care request has already been filled." },
      { status: 400 }
    );
  }

  const { error: acceptError } = await supabase
    .from("care_request_applications")
    .update({ status: "accepted" })
    .eq("id", params.applicationId);

  if (acceptError) {
    return NextResponse.json({ error: acceptError.message }, { status: 500 });
  }

  const { error: declineOthersError } = await supabase
    .from("care_request_applications")
    .update({ status: "declined" })
    .eq("care_request_id", params.id)
    .eq("status", "pending")
    .neq("id", params.applicationId);

  if (declineOthersError) {
    return NextResponse.json({ error: declineOthersError.message }, { status: 500 });
  }

  const { error: fillError } = await supabase
    .from("care_requests")
    .update({ status: "filled" })
    .eq("id", params.id);

  if (fillError) {
    return NextResponse.json({ error: fillError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "accepted" });
}
