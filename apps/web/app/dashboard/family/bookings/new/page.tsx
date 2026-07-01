"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { bookingRequestSchema } from "@/lib/validations/booking";
import { SHIFT_LABELS, formatShiftLabel } from "@/lib/booking-notes";
import { BOOKING_SKILLS } from "@/lib/constants";
import { DAILY_RATE_BANDS } from "@/lib/data/rates";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { AvailableDateInput } from "@/components/available-date-input";
import { mapSupabaseError } from "@/lib/user-errors";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { containsProfanity } from "@/lib/validation/sanitize";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultNurse = searchParams.get("nurse") ?? "";
  const [nursePreview, setNursePreview] = useState<NursePreview | null>(null);
  const [loadingNurse, setLoadingNurse] = useState(Boolean(defaultNurse));
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [hasAvailabilitySet, setHasAvailabilitySet] = useState(false);
  const [submitted, setSubmitted] = useState<SuccessState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingRequestValues>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      nurseId: defaultNurse,
      requestedDate: "",
      shift: "",
      customStartTime: "",
      customEndTime: "",
      patientCondition: "",
      requiredSkills: [],
      customSkills: [],
      budgetRange: "1500_2500",
      additionalInstructions: ""
    }
  });
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSkillError, setCustomSkillError] = useState<string | null>(null);
  const dateFieldRef = useRef<HTMLDivElement | null>(null);
  const shiftFieldRef = useRef<HTMLDivElement | null>(null);
  const conditionFieldRef = useRef<HTMLDivElement | null>(null);
  const skillsFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!defaultNurse) {
      setLoadingNurse(false);
      return;
    }
    form.setValue("nurseId", defaultNurse);

    async function loadNurse() {
      const { data } = await supabase
        .from("nurses")
        .select("id, provider_type, profile_photo_url, profiles!nurses_id_fkey(full_name, city)")
        .eq("id", defaultNurse)
        .in("verification_status", ["verified", "renewal_under_review"])
        .maybeSingle();

      if (!data) {
        setLoadingNurse(false);
        router.replace("/nurses?message=select-nurse");
        return;
      }

      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      setNursePreview({
        id: data.id,
        name: profile?.full_name ?? "Verified Nurse",
        city: profile?.city ?? "Philippines",
        providerType: data.provider_type ?? "nurse",
        imageUrl: resolveProfilePhotoUrl(data.profile_photo_url) ?? undefined
      });

      const today = new Date().toISOString().slice(0, 10);
      const end = new Date();
      end.setDate(end.getDate() + 60);
      const endDate = end.toISOString().slice(0, 10);
      const { data: availabilityRows } = await supabase
        .from("availability")
        .select("date")
        .eq("nurse_id", defaultNurse)
        .eq("is_open", true)
        .gte("date", today)
        .lte("date", endDate);

      const dates = [...new Set((availabilityRows ?? []).map((row) => row.date as string))].sort();
      setAvailableDates(dates);
      setHasAvailabilitySet(dates.length > 0);
      setLoadingNurse(false);
    }

    loadNurse();
  }, [defaultNurse, form, router, supabase]);

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
    setIsSubmitting(true);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = (await response.json()) as { bookingId?: string; error?: string };
    if (!response.ok || !payload.bookingId) {
      setSubmitError(payload.error ?? "Failed to create booking.");
      setIsSubmitting(false);
      return;
    }

    setSubmitted({
      bookingId: payload.bookingId,
      nurseName: nursePreview?.name ?? "your nurse",
      requestedDate: values.requestedDate,
      shift: values.shift
    });
    setIsSubmitting(false);
  }

  function addCustomSkill() {
    const normalized = customSkillInput.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    if (containsProfanity(normalized)) {
      setCustomSkillError("Please keep skill descriptions appropriate.");
      return;
    }

    const current = form.getValues("customSkills");
    if (current.length >= 10) {
      setCustomSkillError("You can add up to 10 custom skills only.");
      return;
    }
    if (current.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
      setCustomSkillInput("");
      setCustomSkillError(null);
      return;
    }

    form.setValue("customSkills", [...current, normalized], { shouldValidate: true });
    setCustomSkillInput("");
    setCustomSkillError(null);
  }

  function removeCustomSkill(skill: string) {
    const current = form.getValues("customSkills");
    form.setValue(
      "customSkills",
      current.filter((item) => item !== skill),
      { shouldValidate: true }
    );
  }

  function handleInvalidSubmit() {
    const errors = form.formState.errors;
    const orderedFields: Array<[keyof BookingRequestValues, RefObject<HTMLDivElement | null>]> = [
      ["requestedDate", dateFieldRef],
      ["shift", shiftFieldRef],
      ["patientCondition", conditionFieldRef],
      ["requiredSkills", skillsFieldRef]
    ];

    const firstError = orderedFields.find(([key]) => Boolean(errors[key]));
    if (firstError?.[1].current) {
      firstError[1].current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const selectedSkills = form.watch("requiredSkills");
  const customSkills = form.watch("customSkills");
  const selectedShift = form.watch("shift");
  const requestedDate = form.watch("requestedDate");

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
          {formatShiftLabel(submitted.shift, null)}
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
    <form onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)} className="space-y-3">
      {loadingNurse ? (
        <p className="text-sm text-slate-600">Loading nurse...</p>
      ) : nursePreview ? (
        <NurseSummaryCard nurse={nursePreview} />
      ) : (
        <p className="text-sm text-rose-600">Nurse not found.</p>
      )}
      <input type="hidden" {...form.register("nurseId")} />
      <div ref={dateFieldRef} className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Requested date</label>
        <div
          className={
            form.formState.errors.requestedDate
              ? "rounded-xl border border-rose-500 p-2"
              : "rounded-xl border border-transparent p-2"
          }
        >
          <AvailableDateInput
            value={requestedDate}
            availableDates={availableDates}
            hasAvailabilitySet={hasAvailabilitySet}
            onChange={(value) => form.setValue("requestedDate", value, { shouldValidate: true })}
          />
        </div>
        {form.formState.errors.requestedDate ? (
          <p className="text-xs text-rose-600">{form.formState.errors.requestedDate.message}</p>
        ) : null}
      </div>
      <div ref={conditionFieldRef} className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Patient condition</label>
        <Select
          {...form.register("patientCondition")}
          className={form.formState.errors.patientCondition ? "border-rose-500 focus:ring-rose-500" : undefined}
        >
          <option value="">Select patient condition</option>
          <option value="bedridden">Bedridden</option>
          <option value="mobile">Mobile</option>
          <option value="assisted">Needs assistance</option>
        </Select>
        {form.formState.errors.patientCondition ? (
          <p className="text-xs text-rose-600">{form.formState.errors.patientCondition.message}</p>
        ) : null}
      </div>
      <div ref={shiftFieldRef} className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Shift</label>
        <Select
          {...form.register("shift")}
          className={form.formState.errors.shift ? "border-rose-500 focus:ring-rose-500" : undefined}
        >
          <option value="">Select shift</option>
          <option value="morning">Morning (6am–2pm)</option>
          <option value="afternoon">Afternoon (2pm–10pm)</option>
          <option value="evening">Evening (10pm–6am)</option>
          <option value="full_day">Full day (24hr)</option>
          <option value="custom">Custom time</option>
        </Select>
        {form.formState.errors.shift ? (
          <p className="text-xs text-rose-600">{form.formState.errors.shift.message}</p>
        ) : null}
      </div>
      {selectedShift === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Start time</label>
            <Input type="time" {...form.register("customStartTime")} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">End time</label>
            <Input type="time" {...form.register("customEndTime")} />
          </div>
        </div>
      ) : null}
      <div ref={skillsFieldRef} className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Skills needed</label>
        <div
          className={
            form.formState.errors.requiredSkills
              ? "rounded-xl border border-rose-500 p-2"
              : "rounded-xl border border-transparent p-2"
          }
        >
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
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            Add a skill not in the list above and press Enter or click Add.
          </p>
          <div className="flex gap-2">
            <Input
              value={customSkillInput}
              placeholder="Add a skill not in the list above and press Enter or click Add."
              onChange={(event) => setCustomSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomSkill();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addCustomSkill}>
              Add
            </Button>
          </div>
          {customSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => removeCustomSkill(skill)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  aria-label={`Remove ${skill}`}
                >
                  {skill} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {form.formState.errors.requiredSkills ? (
          <p className="text-xs text-rose-600">{form.formState.errors.requiredSkills.message}</p>
        ) : null}
        {customSkillError ? (
          <p className="text-xs text-rose-600">{customSkillError}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Budget band</label>
        <Select {...form.register("budgetRange")}>
          {DAILY_RATE_BANDS.map((band) => (
            <option key={band.id} value={band.id}>
              {band.label}
            </option>
          ))}
        </Select>
      </div>
      <Textarea
        placeholder="Additional notes (optional)"
        {...form.register("additionalInstructions")}
      />
      {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
      <LoadingButton type="submit" loading={isSubmitting} loadingText="Sending request..." disabled={!nursePreview}>
        Send booking request
      </LoadingButton>
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
