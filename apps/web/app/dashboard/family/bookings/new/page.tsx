"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { bookingRequestSchema } from "@/lib/validations/booking";
import { SHIFT_LABELS } from "@/lib/booking-notes";
import { BOOKING_SKILLS } from "@/lib/constants";
import { mapSupabaseError } from "@/lib/user-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type BookingRequestValues = z.infer<typeof bookingRequestSchema>;

type SuccessState = {
  bookingId: string;
  nurseName: string;
  requestedDate: string;
  shift: string;
};

type NursePreview = {
  id: string;
  name: string;
  city: string;
  providerType: string;
  imageUrl?: string;
};

function formatBookingDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

function NurseSummaryCard({ nurse }: { nurse: NursePreview }) {
  const initials = nurse.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
        {nurse.imageUrl ? (
          <Image src={nurse.imageUrl} alt={nurse.name} fill className="object-cover" />
        ) : (
          initials
        )}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{nurse.name}</p>
        <p className="text-sm text-slate-600">{nurse.city}</p>
        <Badge className="mt-1 bg-brand-100 text-brand-800">
          {nurse.providerType === "caregiver" ? "Caregiver" : "Nurse"}
        </Badge>
      </div>
    </div>
  );
}

function BookingForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const defaultNurse = searchParams.get("nurse") ?? "";
  const [nursePreview, setNursePreview] = useState<NursePreview | null>(null);
  const [loadingNurse, setLoadingNurse] = useState(Boolean(defaultNurse));
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

  useEffect(() => {
    if (!defaultNurse) {
      setLoadingNurse(false);
      return;
    }
    form.setValue("nurseId", defaultNurse);

    async function loadNurse() {
      const { data } = await supabase
        .from("nurses")
        .select("id, provider_type, profile_photo_url, profiles(full_name, city)")
        .eq("id", defaultNurse)
        .single();

      if (data) {
        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        setNursePreview({
          id: data.id,
          name: profile?.full_name ?? "Provider",
          city: profile?.city ?? "Philippines",
          providerType: data.provider_type ?? "nurse",
          imageUrl: data.profile_photo_url ?? undefined
        });
      }
      setLoadingNurse(false);
    }

    loadNurse();
  }, [defaultNurse, form, supabase]);

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
      setSubmitError(mapSupabaseError(error, "generic"));
      return;
    }

    setSubmitted({
      bookingId: booking.id,
      nurseName: nursePreview?.name ?? "your nurse",
      requestedDate: values.requestedDate,
      shift: values.shift
    });
  }

  const selectedSkills = form.watch("requiredSkills");

  if (!defaultNurse) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Select a nurse first</p>
        <p className="mt-1">Browse verified providers, then request a booking from their profile.</p>
        <Button asChild className="mt-3">
          <Link href="/nurses">Browse nurses</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Request sent to {submitted.nurseName}</h2>
        <p className="text-sm text-slate-700">They typically respond within 24 hours.</p>
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
      {loadingNurse ? (
        <p className="text-sm text-slate-600">Loading nurse...</p>
      ) : nursePreview ? (
        <NurseSummaryCard nurse={nursePreview} />
      ) : (
        <p className="text-sm text-rose-600">Nurse not found.</p>
      )}
      <input type="hidden" {...form.register("nurseId")} />
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Requested date</label>
        <Input type="date" {...form.register("requestedDate")} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Patient condition</label>
        <Select {...form.register("patientCondition")}>
          <option value="bedridden">Bedridden</option>
          <option value="mobile">Mobile</option>
          <option value="assisted">Needs assistance</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Shift</label>
        <Select {...form.register("shift")}>
          <option value="morning">Morning (6am–2pm)</option>
          <option value="afternoon">Afternoon (2pm–10pm)</option>
          <option value="evening">Evening (10pm–6am)</option>
          <option value="full_day">Full day (24hr)</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Skills needed</label>
        <div className="flex flex-wrap gap-2">
          {BOOKING_SKILLS.map((skill) => {
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
          <p className="text-xs text-rose-600">Select at least one skill.</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Budget band</label>
        <Select {...form.register("budgetRange")}>
          <option value="under_1000">Under ₱1,500/shift</option>
          <option value="1000_2000">₱1,500–₱2,500/shift</option>
          <option value="2000_3500">₱2,500–₱4,000/shift</option>
          <option value="3500_plus">Above ₱4,000/shift</option>
        </Select>
      </div>
      <Textarea
        placeholder="Additional notes (optional)"
        {...form.register("additionalInstructions")}
      />
      {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
      <Button type="submit" disabled={!nursePreview}>
        Send booking request
      </Button>
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
