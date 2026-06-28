import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";
import { buildVerificationStatusEmailPayload } from "@/lib/email/verification-status-email";
import { getVerificationNotificationContent, type VerificationStatus } from "@/lib/verification";

const bodySchema = z.object({
  nurseId: z.string().uuid()
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

    const { nurseId } = parsed.data;
    const service = createServiceClient();
    const { data: nurse, error: nurseError } = await service
      .from("nurses")
      .select("id, verification_status, profiles!nurses_id_fkey(full_name)")
      .eq("id", nurseId)
      .maybeSingle();

    if (nurseError || !nurse) {
      return NextResponse.json({ error: "Applicant not found." }, { status: 404 });
    }

    const status = nurse.verification_status as VerificationStatus;
    if (status !== "verified" && status !== "under_review") {
      return NextResponse.json(
        { error: "Status email resend is only available for verified or under review applicants." },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const { data: authUser } = await service.auth.admin.getUserById(nurseId);
    const recipientEmail = authUser.user?.email ?? null;
    if (!recipientEmail) {
      const errorMessage = "No email address found for this applicant.";
      console.error("admin.verification.resend_email_failed", {
        action: status,
        timestamp,
        stage: "missing_recipient",
        nurseId,
        error: errorMessage
      });
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
    const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "there";
    const notification = getVerificationNotificationContent(status);

    let payload:
      | {
          subject: string;
          html: string;
          text: string;
        }
      | undefined;

    try {
      payload = buildVerificationStatusEmailPayload({
        status,
        firstName,
        notificationTitle: notification.title,
        notificationBody: notification.body
      });
    } catch (templateError) {
      const errorMessage =
        templateError instanceof Error
          ? templateError.message
          : "Failed to render verification email template.";
      console.error("admin.verification.resend_email_failed", {
        action: status,
        timestamp,
        stage: "template",
        nurseId,
        error: errorMessage
      });
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!payload) {
      return NextResponse.json({ error: "Failed to prepare verification email payload." }, { status: 500 });
    }

    try {
      const delivery = await sendEmail({
        to: recipientEmail,
        ...payload
      });

      if (!delivery.sent) {
        const errorMessage = delivery.error ?? "Unknown email provider error.";
        console.error("admin.verification.resend_email_failed", {
          action: status,
          timestamp,
          stage: "delivery",
          nurseId,
          error: errorMessage
        });
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    } catch (deliveryError) {
      const errorMessage =
        deliveryError instanceof Error ? deliveryError.message : "Failed to send verification status email.";
      console.error("admin.verification.resend_email_failed", {
        action: status,
        timestamp,
        stage: "delivery",
        nurseId,
        error: errorMessage
      });
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Verification status email resent successfully."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
