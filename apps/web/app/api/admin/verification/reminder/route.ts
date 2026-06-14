import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hasIncompleteDocuments } from "@/lib/admin/verification-documents";
import { sendMail } from "@/lib/email/send-mail";
import {
  buildVerificationDocumentReminderHtml,
  buildVerificationDocumentReminderText,
  VERIFICATION_DOCUMENT_REMINDER_SUBJECT
} from "@/lib/email/templates/verification-document-reminder";

const bodySchema = z.object({
  nurseIds: z.array(z.string().uuid()).min(1)
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: nurses, error } = await service
      .from("nurses")
      .select("id, provider_type, prc_document_url, tesda_document_url, nbi_document_url, profiles!nurses_id_fkey(full_name)")
      .in("id", parsed.data.nurseIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targets = (nurses ?? []).filter((nurse) => hasIncompleteDocuments(nurse));
    let sent = 0;
    const failures: string[] = [];

    for (const nurse of targets) {
      const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
      const { data: authUser } = await service.auth.admin.getUserById(nurse.id);
      const email = authUser.user?.email;
      if (!email) {
        failures.push(`${profile?.full_name ?? nurse.id}: no email on file`);
        continue;
      }

      const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "there";
      const mailResult = await sendMail({
        to: email,
        subject: VERIFICATION_DOCUMENT_REMINDER_SUBJECT,
        text: buildVerificationDocumentReminderText(firstName),
        html: buildVerificationDocumentReminderHtml(firstName)
      });

      if (mailResult.sent) {
        sent += 1;
      } else {
        failures.push(`${profile?.full_name ?? nurse.id}: ${mailResult.error ?? "send failed"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      skipped: parsed.data.nurseIds.length - targets.length,
      failures
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
