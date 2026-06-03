"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { bookingRequestSchema } from "@/lib/validations/booking";
import { SHIFT_LABELS } from "@/lib/booking-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const REQUIRED_SKILLS = [
  "IV Therapy",
  "Wound Care",
  "Medication Management",
  "Post-Op Care",
  "Mobility Assistance",
  "Palliative Care"
];

type BookingRequestValues = z.infer<typeof bookingRequestSchema>;

type SuccessState = {
  bookingId: string;
  nurseName: string;
  requestedDate: string;
  shift: string;
};

function formatBookingDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

function BookingForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const defaultNurse = searchParams.get("nurse") ?? "";
  const [submitted, setSubmitted] = useState<SuccessState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BookingRequestValues>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      nurseId: defaultNurse,
      requestedDate: "",
      shift: "morning",
      patientCondition: "mobile",
      requiredSkills: [],
      budgetRange: "1000_2000",
      additionalInstructions: ""
    }
  });

  function toggleSkill(skill: string) {
    const current = form.getValues("requiredSkills");
    if (current.includes(skill)) {
      form.setValue(
        "requiredSkills",
        current.filter((item) => item !== skill),
        { shouldValidate: true }
      );
      return;
    }
    form.setValue("requiredSkills", [...current, skill], { shouldValidate: true });
  }

  async function handleSubmit(values: BookingRequestValues) {
    setSubmitError(null);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const structuredRequest = {
      patientCondition: values.patientCondition,
      requiredSkills: values.requiredSkills,
      budgetRange: values.budgetRange,
      additionalInstructions: values.additionalInstructions ?? ""
    };

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        family_id: user.id,
        nurse_id: values.nurseId,
        requested_date: values.requestedDate,
        shift: values.shift,
        notes: JSON.stringify(structuredRequest)
      })
      .select("id")
      .single();

    if (error || !booking) {
      setSubmitError(error?.message ?? "Could not send booking request.");
      return;
    }

    const { data: nurseProfile } = await supabase
      .from("nurses")
      .select("profiles(full_name)")
      .eq("id", values.nurseId)
      .single();

    const profile = Array.isArray(nurseProfile?.profiles)
      ? nurseProfile?.profiles[0]
      : nurseProfile?.profiles;
    const nurseName = (profile as { full_name?: string } | null)?.full_name ?? "your nurse";

    setSubmitted({
      bookingId: booking.id,
      nurseName,
      requestedDate: values.requestedDate,
      shift: values.shift
    });
  }

  const selectedSkills = form.watch("requiredSkills");

  if (submitted) {
    return (
      <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Booking request sent</h2>
        <p className="text-sm text-slate-700">
          Your request has been sent to <strong>{submitted.nurseName}</strong>. They typically respond
          within 24 hours.
        </p>
        <p className="text-sm text-slate-500">
          Requested: {formatBookingDate(submitted.requestedDate)} ·{" "}
          {SHIFT_LABELS[submitted.shift] ?? submitted.shift} shift
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={`/dashboard/family/bookings/${submitted.bookingId}`}>
              View booking & chat
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/nurses">Browse more nurses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      <Input placeholder="Nurse ID" {...form.register("nurseId")} />
      <Input type="date" {...form.register("requestedDate")} />
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Patient condition</label>
        <Select {...form.register("patientCondition")}>
          <option value="bedridden">Bedridden</option>
          <option value="mobile">Mobile</option>
          <option value="assisted">Needs assistance</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Shift type</label>
        <Select {...form.register("shift")}>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Night</option>
          <option value="full_day">24-hour</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Required skills</label>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_SKILLS.map((skill) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={
                  isSelected
                    ? "rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                    : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                }
              >
                {skill}
              </button>
            );
          })}
        </div>
        {form.formState.errors.requiredSkills ? (
          <p className="text-xs text-rose-600">Select at least one required skill.</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Budget range (PHP/day)</label>
        <Select {...form.register("budgetRange")}>
          <option value="under_1000">Under 1,000</option>
          <option value="1000_2000">1,000 - 2,000</option>
          <option value="2000_3500">2,000 - 3,500</option>
          <option value="3500_plus">3,500+</option>
        </Select>
      </div>
      <Textarea
        placeholder="Additional specific instructions or context"
        {...form.register("additionalInstructions")}
      />
      {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
      <Button type="submit">Send request</Button>
    </form>
  );
}

export default function NewBookingPage() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Request a booking</h1>
        <Suspense fallback={<p className="text-sm text-slate-600">Loading form...</p>}>
          <BookingForm />
        </Suspense>
      </div>
    </main>
  );
}
