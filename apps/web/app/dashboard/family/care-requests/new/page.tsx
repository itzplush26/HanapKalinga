"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/page-header";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { RegionCitySelects } from "@/components/region-city-selects";
import { DAILY_RATE_BANDS } from "@/lib/data/rates";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";
import { careRequestSchema, type CareRequestFormValues } from "@/lib/validations/care-request";

function fieldLabel(label: string, hasError?: boolean) {
  return (
    <span className={hasError ? "text-sm font-medium text-rose-600" : "text-sm font-medium text-slate-700"}>
      {label} <span className="text-rose-600">*</span>
      {hasError ? <span className="ml-2 text-xs text-rose-600">Required</span> : null}
    </span>
  );
}

export default function NewCareRequestPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  const form = useForm<CareRequestFormValues>({
    resolver: zodResolver(careRequestSchema),
    defaultValues: {
      title: "",
      patientCondition: "",
      careType: "per_shift",
      requiredSpecializations: [],
      preferredProviderType: "both",
      region: "",
      city: "",
      barangay: "",
      budgetBand: "",
      durationDescription: ""
    }
  });

  const selectedSkills = form.watch("requiredSpecializations");

  async function handleSubmit(values: CareRequestFormValues) {
    setStatus(null);

    const response = await fetch("/api/care-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = (await response.json()) as { careRequestId?: string; error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? "Could not post your care request. Please try again.");
      return;
    }

    if (payload.careRequestId) {
      router.push(`/dashboard/family/care-requests/${payload.careRequestId}?posted=1`);
    }
  }

  return (
    <>
      <PageHeader title="Post a care request" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              {fieldLabel("Request title", !!form.formState.errors.title)}
              <Input
                placeholder="Elderly care needed in Quezon City"
                {...form.register("title")}
                className={form.formState.errors.title ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-rose-600">{form.formState.errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              {fieldLabel("Patient condition", !!form.formState.errors.patientCondition)}
              <Textarea
                placeholder="Describe the patient's needs and situation"
                {...form.register("patientCondition")}
                className={
                  form.formState.errors.patientCondition ? "border-rose-500 focus:ring-rose-500" : undefined
                }
              />
              {form.formState.errors.patientCondition ? (
                <p className="text-xs text-rose-600">{form.formState.errors.patientCondition.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              {fieldLabel("Care type", !!form.formState.errors.careType)}
              <Select
                {...form.register("careType")}
                className={form.formState.errors.careType ? "border-rose-500 focus:ring-rose-500" : undefined}
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="live_in">Live in</option>
                <option value="per_shift">Per shift</option>
              </Select>
            </div>

            <div className="space-y-3">
              <RegionCitySelects
                region={form.watch("region")}
                city={form.watch("city")}
                onRegionChange={(value) => {
                  form.setValue("region", value, { shouldValidate: true });
                  form.setValue("city", "", { shouldValidate: true });
                }}
                onCityChange={(value) => form.setValue("city", value, { shouldValidate: true })}
                regionError={!!form.formState.errors.region}
                cityError={!!form.formState.errors.city}
                regionLabel={fieldLabel("Region", !!form.formState.errors.region)}
                cityLabel={fieldLabel("City", !!form.formState.errors.city)}
              />
              {form.formState.errors.region ? (
                <p className="text-xs text-rose-600">{form.formState.errors.region.message}</p>
              ) : null}
              {form.formState.errors.city ? (
                <p className="text-xs text-rose-600">{form.formState.errors.city.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              {fieldLabel("Barangay", !!form.formState.errors.barangay)}
              <Input
                placeholder="Barangay"
                {...form.register("barangay")}
                className={form.formState.errors.barangay ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
              {form.formState.errors.barangay ? (
                <p className="text-xs text-rose-600">{form.formState.errors.barangay.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              {fieldLabel("Budget band", !!form.formState.errors.budgetBand)}
              <Select
                {...form.register("budgetBand")}
                className={form.formState.errors.budgetBand ? "border-rose-500 focus:ring-rose-500" : undefined}
              >
                <option value="">Select budget band</option>
                {DAILY_RATE_BANDS.map((band) => (
                  <option key={band.id} value={band.id}>
                    {band.label}
                  </option>
                ))}
              </Select>
              {form.formState.errors.budgetBand ? (
                <p className="text-xs text-rose-600">{form.formState.errors.budgetBand.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              {fieldLabel("Care categories", !!form.formState.errors.requiredSpecializations)}
              <div className="flex flex-wrap gap-2">
                {PROVIDER_SPECIALIZATIONS.map((skill) => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? selectedSkills.filter((s) => s !== skill)
                          : [...selectedSkills, skill];
                        form.setValue("requiredSpecializations", next, { shouldValidate: true });
                      }}
                      className={
                        selected
                          ? "rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                          : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                      }
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.requiredSpecializations ? (
                <p className="text-xs text-rose-600">
                  {form.formState.errors.requiredSpecializations.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              {fieldLabel("Duration", !!form.formState.errors.durationDescription)}
              <Input
                placeholder="e.g. 3 months or ongoing"
                {...form.register("durationDescription")}
                className={
                  form.formState.errors.durationDescription ? "border-rose-500 focus:ring-rose-500" : undefined
                }
              />
              {form.formState.errors.durationDescription ? (
                <p className="text-xs text-rose-600">{form.formState.errors.durationDescription.message}</p>
              ) : null}
            </div>

            {status ? <p className="text-sm text-rose-600">{status}</p> : null}

            <LoadingButton
              type="submit"
              className="w-full"
              loading={form.formState.isSubmitting}
              loadingText="Posting..."
            >
              Post care request
            </LoadingButton>
          </form>
        </div>
      </main>
    </>
  );
}
