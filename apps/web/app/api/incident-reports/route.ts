import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getAdminEmails } from "@/lib/email/user-email";
import { incidentReportReceivedEmail } from "@/lib/email/templates/incident-report-received";

const bodySchema = z.object({
  reportedUserId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  category: z.string().min(1),
  description: z.string().min(50),
  evidenceUrl: z.string().url().optional()
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Description must be at least 50 characters." }, { status: 400 });
  }

  const { data: report, error } = await supabase
    .from("incident_reports")
    .insert({
      reporter_id: auth.user.id,
      reported_user_id: parsed.data.reportedUserId,
      booking_id: parsed.data.bookingId ?? null,
      category: parsed.data.category,
      description: parsed.data.description,
      evidence_url: parsed.data.evidenceUrl ?? null
    })
    .select("id")
    .single();

  if (error || !report) return NextResponse.json({ error: error?.message ?? "Failed." }, { status: 500 });

  const service = createServiceClient();
  const [{ data: reporter }, { data: reported }] = await Promise.all([
    service.from("profiles").select("full_name").eq("id", auth.user.id).single(),
    service.from("profiles").select("full_name").eq("id", parsed.data.reportedUserId).single()
  ]);

  const adminEmails = await getAdminEmails();
  const emailContent = incidentReportReceivedEmail({
    reporterName: reporter?.full_name?.trim() || "User",
    reportedUserName: reported?.full_name?.trim() || "User",
    category: parsed.data.category,
    description: parsed.data.description,
    reportId: report.id
  });

  for (const email of adminEmails) {
    sendEmailSafe({ to: email, subject: emailContent.subject, html: emailContent.html });
  }

  return NextResponse.json({ ok: true, reportId: report.id });
}
