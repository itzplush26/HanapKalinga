import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendMail } from "@/lib/email/send-mail";
import {
  buildVerificationApprovedEmailHtml,
  buildVerificationApprovedEmailText,
  VERIFICATION_APPROVED_SUBJECT
} from "@/lib/email/verification-approved-email";
import { hasRequiredDocuments } from "@/lib/admin/verification-documents";
import { isProviderRole } from "@/lib/provider-role";
import { revalidatePublicNursePages } from "@/lib/nurses/revalidate-public";
import { ensureNurseProfileSlug } from "@/lib/nurse/ensure-profile-slug";
import {
  buildVerificationRejectedEmailHtml,
  buildVerificationRejectedEmailText,
  VERIFICATION_REJECTED_SUBJECT
} from "@/lib/email/templates/verification-rejected";
import {
  actionToStatus,
  getVerificationNotificationContent,
  type VerificationAction
} from "@/lib/verification";

const bodySchema = z.object({
  nurseId: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_resubmission", "mark_under_review"]),
  rejectionReason: z.string().optional(),
  reviewNotes: z.string().optional(),
  prcLicenseExpiry: z.string().optional(),
  tesdaCertExpiry: z.string().optional(),
  nbiExpiry: z.string().optional()
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
      .select("role, full_name")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { nurseId, action, rejectionReason, reviewNotes, prcLicenseExpiry, tesdaCertExpiry, nbiExpiry } =
      parsed.data;

    if (
      (action === "reject" || action === "request_resubmission") &&
      (!rejectionReason || rejectionReason.trim().length < 5)
    ) {
      return NextResponse.json(
        { error: "A rejection or resubmission reason of at least 5 characters is required." },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    const { data: nurse, error: nurseError } = await service
      .from("nurses")
      .select(
        "id, profile_slug, verification_status, provider_type, prc_document_url, tesda_document_url, nbi_document_url, profiles!nurses_id_fkey(full_name, role)"
      )
      .eq("id", nurseId)
      .maybeSingle();

    if (nurseError || !nurse) {
      return NextResponse.json({ error: "Applicant not found." }, { status: 404 });
    }

    const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
    if (!profile?.role || !isProviderRole(profile.role)) {
      return NextResponse.json({ error: "Invalid applicant." }, { status: 400 });
    }

    if (action === "approve") {
      if (!hasRequiredDocuments(nurse)) {
        return NextResponse.json(
          { error: "Cannot verify this nurse until all required documents are uploaded." },
          { status: 400 }
        );
      }
      if (!nbiExpiry) {
        return NextResponse.json({ error: "NBI expiry date is required before approval." }, { status: 400 });
      }
      if (nurse.provider_type === "nurse" && !prcLicenseExpiry) {
        return NextResponse.json({ error: "PRC license expiry is required for nurses." }, { status: 400 });
      }
      if (nurse.provider_type === "caregiver" && !tesdaCertExpiry) {
        return NextResponse.json({ error: "TESDA certificate expiry is required for caregivers." }, { status: 400 });
      }
    }

    const previousStatus = nurse.verification_status;
    const newStatus = actionToStatus(action as VerificationAction);
    const trimmedReason = rejectionReason?.trim() || null;
    const trimmedNotes = reviewNotes?.trim() || null;

    const updatePayload: Record<string, string | null> = {
      verification_status: newStatus
    };

    if (action === "approve") {
      updatePayload.verified_at = new Date().toISOString();
      updatePayload.verified_by = auth.user.id;
      updatePayload.verification_notes = trimmedNotes;
      updatePayload.rejection_reason = null;
      updatePayload.rejection_notes = null;
      updatePayload.prc_license_expiry = prcLicenseExpiry ?? null;
      updatePayload.tesda_cert_expiry = tesdaCertExpiry ?? null;
      updatePayload.nbi_expiry = nbiExpiry ?? null;
    } else if (action === "reject" || action === "request_resubmission") {
      updatePayload.rejection_reason = trimmedReason;
      updatePayload.rejection_notes = trimmedNotes;
      updatePayload.verified_at = null;
      updatePayload.verified_by = null;
      updatePayload.verification_notes = null;
    } else if (action === "mark_under_review") {
      updatePayload.rejection_reason = null;
      updatePayload.rejection_notes = null;
    }

    const { error: updateError } = await service.from("nurses").update(updatePayload).eq("id", nurseId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: auditError } = await service.from("verification_audit_logs").insert({
      nurse_id: nurseId,
      admin_id: auth.user.id,
      action,
      previous_status: previousStatus,
      new_status: newStatus,
      rejection_reason: trimmedReason,
      review_notes: trimmedNotes
    });

    if (auditError) {
      return NextResponse.json({ error: auditError.message }, { status: 500 });
    }

    const rejectionSummary =
      action === "reject" && trimmedReason
        ? trimmedNotes
          ? `${trimmedReason}. ${trimmedNotes}`
          : trimmedReason
        : trimmedReason;

    const notification = getVerificationNotificationContent(newStatus, rejectionSummary);
    const { error: notificationError } = await service.from("notifications").insert({
      user_id: nurseId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      metadata: {
        nurse_id: nurseId,
        previous_status: previousStatus,
        new_status: newStatus,
        rejection_reason: rejectionSummary,
        profile_url: "/dashboard/nurse/profile#documents"
      }
    });

    if (notificationError) {
      return NextResponse.json({ error: notificationError.message }, { status: 500 });
    }

    if (action === "approve") {
      const slug = await ensureNurseProfileSlug(service, nurseId, profile?.full_name);
      revalidatePublicNursePages(slug ?? nurse.profile_slug, nurseId);
    }

    const { data: authUser } = await service.auth.admin.getUserById(nurseId);
    const recipientEmail = authUser.user?.email;

    let emailSent = false;
    let emailError: string | undefined;

    if (recipientEmail) {
      const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "there";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";

      const mailResult =
        newStatus === "verified"
          ? await sendMail({
              to: recipientEmail,
              subject: VERIFICATION_APPROVED_SUBJECT,
              text: buildVerificationApprovedEmailText(firstName),
              html: buildVerificationApprovedEmailHtml(firstName)
            })
          : action === "reject" && trimmedReason
            ? await sendMail({
                to: recipientEmail,
                subject: VERIFICATION_REJECTED_SUBJECT,
                text: buildVerificationRejectedEmailText({
                  firstName,
                  reason: trimmedReason,
                  details: trimmedNotes
                }),
                html: buildVerificationRejectedEmailHtml({
                  firstName,
                  reason: trimmedReason,
                  details: trimmedNotes
                })
              })
            : await sendMail({
                to: recipientEmail,
                subject: `[HanapKalinga] ${notification.title}`,
                text: `${notification.body}\n\nSign in to view your dashboard: ${appUrl}`
              });
      emailSent = mailResult.sent;
      emailError = mailResult.error;
    }

    return NextResponse.json({
      ok: true,
      newStatus,
      emailSent,
      emailError
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
