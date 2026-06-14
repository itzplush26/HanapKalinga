import { sendEmailSafe } from "@/lib/email/send-safe";
import { getAdminEmails, getUserEmail } from "@/lib/email/user-email";
import { bookingRequestReceivedEmail } from "@/lib/email/templates/booking-request-received";
import { bookingAcceptedEmail } from "@/lib/email/templates/booking-accepted";
import { bookingDeclinedEmail } from "@/lib/email/templates/booking-declined";
import { bookingCompletionRequestedEmail } from "@/lib/email/templates/booking-completion-requested";
import { bookingCompletedEmail } from "@/lib/email/templates/booking-completed";
import { bookingCancelledEmail } from "@/lib/email/templates/booking-cancelled";
import {
  formatBudgetRange,
  formatPatientCondition,
  formatShiftLabel,
  parseBookingNotes
} from "@/lib/booking-notes";
import { createServiceClient } from "@/lib/supabase/service";

type BookingRow = {
  id: string;
  family_id: string;
  nurse_id: string;
  requested_date: string;
  shift: string;
  notes: string | null;
};

async function loadBookingContext(bookingId: string) {
  const service = createServiceClient();
  const { data: booking } = await service
    .from("bookings")
    .select("id, family_id, nurse_id, requested_date, shift, notes")
    .eq("id", bookingId)
    .single();

  if (!booking) return null;

  const [{ data: family }, { data: nurse }] = await Promise.all([
    service.from("families").select("patient_name, profiles(full_name)").eq("id", booking.family_id).single(),
    service.from("nurses").select("provider_type, profiles!nurses_id_fkey(full_name)").eq("id", booking.nurse_id).single()
  ]);

  const familyProfile = Array.isArray(family?.profiles) ? family?.profiles[0] : family?.profiles;
  const nurseProfile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;
  const parsed = parseBookingNotes(booking.notes);

  return {
    booking: booking as BookingRow,
    familyName: familyProfile?.full_name?.trim() || "Family",
    patientName: family?.patient_name?.trim() || "Patient",
    nurseName: nurseProfile?.full_name?.trim() || "Nurse",
    providerType: nurse?.provider_type ?? "nurse",
    parsed,
    shiftLabel: formatShiftLabel(booking.shift, booking.notes)
  };
}

export async function sendBookingRequestReceivedEmail(bookingId: string) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const nurseEmail = await getUserEmail(ctx.booking.nurse_id);
  if (!nurseEmail) return;

  const { subject, html } = bookingRequestReceivedEmail({
    nurseName: ctx.nurseName,
    familyContactName: ctx.familyName,
    patientName: ctx.patientName,
    requestedDate: ctx.booking.requested_date,
    shiftLabel: ctx.shiftLabel,
    patientCondition: formatPatientCondition(ctx.parsed?.patientCondition) ?? "Not specified",
    skills: ctx.parsed?.requiredSkills ?? [],
    budgetLabel: formatBudgetRange(ctx.parsed?.budgetRange) ?? "Not specified",
    bookingId
  });

  sendEmailSafe({ to: nurseEmail, subject, html });
}

export async function sendBookingAcceptedEmail(bookingId: string) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const familyEmail = await getUserEmail(ctx.booking.family_id);
  if (!familyEmail) return;

  const { subject, html } = bookingAcceptedEmail({
    familyName: ctx.familyName,
    nurseName: ctx.nurseName,
    providerType: ctx.providerType,
    requestedDate: ctx.booking.requested_date,
    shiftLabel: ctx.shiftLabel,
    bookingId
  });

  sendEmailSafe({ to: familyEmail, subject, html });
}

export async function sendBookingDeclinedEmail(bookingId: string, reason?: string | null) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const familyEmail = await getUserEmail(ctx.booking.family_id);
  if (!familyEmail) return;

  const { subject, html } = bookingDeclinedEmail({
    familyName: ctx.familyName,
    nurseName: ctx.nurseName,
    reason
  });

  sendEmailSafe({ to: familyEmail, subject, html });
}

export async function sendBookingCompletionRequestedEmail(bookingId: string) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const familyEmail = await getUserEmail(ctx.booking.family_id);
  if (!familyEmail) return;

  const { subject, html } = bookingCompletionRequestedEmail({
    familyName: ctx.familyName,
    nurseName: ctx.nurseName,
    requestedDate: ctx.booking.requested_date,
    shiftLabel: ctx.shiftLabel,
    bookingId
  });

  sendEmailSafe({ to: familyEmail, subject, html });
}

export async function sendBookingCompletedEmails(bookingId: string) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const [familyEmail, nurseEmail] = await Promise.all([
    getUserEmail(ctx.booking.family_id),
    getUserEmail(ctx.booking.nurse_id)
  ]);

  if (familyEmail) {
    const { subject, html } = bookingCompletedEmail({
      recipientName: ctx.familyName,
      nurseName: ctx.nurseName,
      requestedDate: ctx.booking.requested_date,
      shiftLabel: ctx.shiftLabel,
      bookingId,
      isFamily: true
    });
    sendEmailSafe({ to: familyEmail, subject, html });
  }

  if (nurseEmail) {
    const { subject, html } = bookingCompletedEmail({
      recipientName: ctx.nurseName,
      nurseName: ctx.nurseName,
      requestedDate: ctx.booking.requested_date,
      shiftLabel: ctx.shiftLabel,
      bookingId,
      isFamily: false
    });
    sendEmailSafe({ to: nurseEmail, subject, html });
  }
}

export async function sendBookingCancelledEmail(
  bookingId: string,
  cancelledBy: "family" | "nurse",
  reason: string
) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const recipientId = cancelledBy === "family" ? ctx.booking.nurse_id : ctx.booking.family_id;
  const recipientEmail = await getUserEmail(recipientId);
  if (!recipientEmail) return;

  const { subject, html } = bookingCancelledEmail({
    recipientName: cancelledBy === "family" ? ctx.nurseName : ctx.familyName,
    cancelledByLabel: cancelledBy === "family" ? "the family" : "the nurse",
    requestedDate: ctx.booking.requested_date,
    reason,
    isNurseRecipient: cancelledBy === "family"
  });

  sendEmailSafe({ to: recipientEmail, subject, html });
}

export async function sendDisputeAdminEmail(bookingId: string, description: string) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return;

  const adminEmails = await getAdminEmails();
  for (const email of adminEmails) {
    sendEmailSafe({
      to: email,
      subject: "[Admin] Booking dispute on HanapKalinga",
      html: `<p>Booking ${bookingId} disputed by ${ctx.familyName}.</p><p>${description}</p>`
    });
  }
}
