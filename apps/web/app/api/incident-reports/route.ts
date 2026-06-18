import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getAdminEmails } from "@/lib/email/user-email";
import { incidentReportReceivedEmail } from "@/lib/email/templates/incident-report-received";
import { containsProfanity, sanitizeText } from "@/lib/validation/sanitize";

const bodySchema = z.object({
  reportedUserId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  category: z.string().min(1),
  description: z.string().min(50),
  evidenceUrl: z.union([z.string().url(), z.literal("")]).optional()
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Description must be at least 50 characters." }, { status: 400 });
    }

    const { reportedUserId, bookingId, category, description, evidenceUrl } = parsed.data;
    const normalizedCategory = sanitizeText(category);
    const normalizedDescription = sanitizeText(description);

    if (containsProfanity(normalizedCategory) || containsProfanity(normalizedDescription)) {
      return NextResponse.json({ error: "Please keep your content appropriate." }, { status: 400 });
    }

    if (reportedUserId === auth.user.id) {
      return NextResponse.json({ error: "You cannot report yourself." }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: reportedProfile } = await service
      .from("profiles")
      .select("id")
      .eq("id", reportedUserId)
      .maybeSingle();

    if (!reportedProfile) {
      return NextResponse.json({ error: "Reported user not found." }, { status: 400 });
    }

    if (bookingId) {
      const { data: booking } = await service
        .from("bookings")
        .select("family_id, nurse_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (!booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 400 });
      }

      const reporterIsParty = booking.family_id === auth.user.id || booking.nurse_id === auth.user.id;
      const reportedIsParty =
        booking.family_id === reportedUserId || booking.nurse_id === reportedUserId;

      if (!reporterIsParty || !reportedIsParty) {
        return NextResponse.json({ error: "You can only report users from your own bookings." }, { status: 403 });
      }
    }

    const { data: report, error } = await service
      .from("incident_reports")
      .insert({
        reporter_id: auth.user.id,
        reported_user_id: reportedUserId,
        booking_id: bookingId ?? null,
        category: normalizedCategory,
        description: normalizedDescription,
        evidence_url: evidenceUrl?.trim() ? evidenceUrl : null
      })
      .select("id")
      .single();

    if (error || !report) {
      console.error("[incident-reports] insert failed:", error?.message ?? "unknown");
      const message =
        error?.message?.includes("incident_reports") && error.message.includes("does not exist")
          ? "Reporting is not available yet. Please contact support."
          : (error?.message ?? "Could not submit report. Please try again.");
      return NextResponse.json({ error: message }, { status: 500 });
    }

    try {
      const [{ data: reporter }, { data: reported }] = await Promise.all([
        service.from("profiles").select("full_name").eq("id", auth.user.id).maybeSingle(),
        service.from("profiles").select("full_name").eq("id", reportedUserId).maybeSingle()
      ]);

      const adminEmails = await getAdminEmails();
      const emailContent = incidentReportReceivedEmail({
        reporterName: reporter?.full_name?.trim() || "User",
        reportedUserName: reported?.full_name?.trim() || "User",
        category: normalizedCategory,
        description: normalizedDescription,
        reportId: report.id
      });

      for (const email of adminEmails) {
        sendEmailSafe({ to: email, subject: emailContent.subject, html: emailContent.html });
      }
    } catch (emailError) {
      console.error(
        "[incident-reports] admin notification failed:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (error) {
    console.error("[incident-reports] unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
