import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getUserEmail } from "@/lib/email/user-email";
import { licenseExpiryWarningEmail } from "@/lib/email/templates/license-expiry-warning";
import { careRequestExpiredEmail } from "@/lib/email/templates/care-request-expired";
import { getDocumentExpiryItems } from "@/lib/license-expiry";
import { appUrl } from "@/lib/email/templates/layout";

export async function GET(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const service = createServiceClient();
  const { data: nurses } = await service
    .from("nurses")
    .select("id, provider_type, prc_license_expiry, tesda_cert_expiry, nbi_expiry, license_expiry_notified_at, profiles!nurses_id_fkey(full_name)");

  const notifyCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let notified = 0;

  for (const nurse of nurses ?? []) {
    const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
    const nurseName = profile?.full_name?.trim() || "Nurse";
    const items = getDocumentExpiryItems(nurse);
    const urgent = items.filter((item) => item.status === "expired" || item.status === "expiring_soon");

    if (!urgent.length) continue;

    if (nurse.license_expiry_notified_at && nurse.license_expiry_notified_at > notifyCutoff) {
      continue;
    }

    const target = urgent.find((item) => item.status === "expired") ?? urgent[0];
    const isExpired = target.status === "expired";

    const email = await getUserEmail(nurse.id as string);
    if (email) {
      const { subject, html } = licenseExpiryWarningEmail({
        nurseName,
        documentLabel: target.label,
        expiryDate: target.date!,
        isExpired
      });
      sendEmailSafe({ to: email, subject, html });
    }

    await service.from("notifications").insert({
      user_id: nurse.id,
      type: isExpired ? "license_expired" : "license_expiring",
      title: isExpired ? "Document expired — action required" : "Document expiring soon",
      body: isExpired
        ? `Your ${target.label} has expired. Upload a renewed document on your profile to restore access.`
        : `Your ${target.label} expires on ${target.date}. Upload a renewed document before it expires.`,
      metadata: {
        document: target.label,
        expiry_date: target.date,
        link: appUrl("/dashboard/nurse/profile#documents")
      }
    });

    await service
      .from("nurses")
      .update({ license_expiry_notified_at: new Date().toISOString() })
      .eq("id", nurse.id);

    notified += 1;
  }

  const nowIso = new Date().toISOString();
  const { data: expiredCareRequests } = await service
    .from("care_requests")
    .select("id, family_id, title, city")
    .eq("status", "open")
    .lte("expires_at", nowIso);

  let expiredCareRequestCount = 0;
  for (const careRequest of expiredCareRequests ?? []) {
    const { error: closeError } = await service
      .from("care_requests")
      .update({ status: "closed" })
      .eq("id", careRequest.id)
      .eq("status", "open");

    if (closeError) continue;

    expiredCareRequestCount += 1;
    await service.from("notifications").insert({
      user_id: careRequest.family_id,
      type: "care_request_expired",
      title: "Care request expired",
      body: "Your care request has expired. You can post a new one from your dashboard.",
      metadata: {
        care_request_id: careRequest.id,
        link: appUrl("/dashboard/family/care-requests/new")
      }
    });

    const [{ data: profile }, familyEmail] = await Promise.all([
      service.from("profiles").select("full_name").eq("id", careRequest.family_id).maybeSingle(),
      getUserEmail(careRequest.family_id)
    ]);

    if (familyEmail) {
      const { subject, html } = careRequestExpiredEmail({
        familyName: profile?.full_name?.trim() || "there",
        title: careRequest.title,
        city: careRequest.city
      });
      sendEmailSafe({ to: familyEmail, subject, html });
    }
  }

  console.info("[cron/check-expiry] care requests expired:", expiredCareRequestCount);

  return NextResponse.json({ ok: true, notified, expiredCareRequestCount });
}
