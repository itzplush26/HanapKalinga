import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailSafe } from "@/lib/email/send-safe";
import { getUserEmail } from "@/lib/email/user-email";
import { licenseExpiryWarningEmail } from "@/lib/email/templates/license-expiry-warning";
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

  await service
    .from("care_requests")
    .update({ status: "closed" })
    .eq("status", "open")
    .lt("expires_at", new Date().toISOString());

  return NextResponse.json({ ok: true, notified });
}
