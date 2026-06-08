"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { nurseProfileEditSchema, type NurseProfileEditValues } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DocumentUploader } from "@/components/document-uploader";
import { RegionCitySelects } from "@/components/region-city-selects";
import { RateRangeSelect } from "@/components/rate-range-select";
import {
  inferRateRangeId,
  resolveRateRangeValues,
  type RateRangeId
} from "@/lib/rate-ranges";
import { VerificationStatusBanner } from "@/components/verification-status-banner";
import type { VerificationStatus } from "@/lib/verification";

export default function NurseProfilePage() {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<"nurse" | "caregiver">("nurse");
  const [initialCredentialUrl, setInitialCredentialUrl] = useState("");
  const [initialNbiUrl, setInitialNbiUrl] = useState("");
  const form = useForm<NurseProfileEditValues>({
    resolver: zodResolver(nurseProfileEditSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      region: "",
      city: "",
      barangay: "",
      address: "",
      prcLicenseNo: "",
      specializations: "",
      yearsExperience: 0,
      bio: "",
      hourlyRateRange: "",
      dailyRateRange: "",
      profile_photo_url: "",
      prc_document_url: "",
      nbi_document_url: "",
      tesda_document_url: ""
    }
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name, full_name, phone, region, city, barangay, address")
        .eq("id", user.id)
        .maybeSingle();

      const { data: nurse } = await supabase
        .from("nurses")
        .select(
          "provider_type, verification_status, rejection_reason, prc_license_no, specializations, years_experience, bio, hourly_rate, hourly_rate_max, hourly_rate_range, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, prc_document_url, tesda_document_url, nbi_document_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profile || nurse) {
        const nameParts = profile?.full_name?.split(" ") ?? [];
        const credentialUrl = nurse?.prc_document_url ?? nurse?.tesda_document_url ?? "";
        setVerificationStatus((nurse?.verification_status ?? "pending") as VerificationStatus);
        setRejectionReason(nurse?.rejection_reason ?? null);
        setProviderType((nurse?.provider_type ?? "nurse") as "nurse" | "caregiver");
        setInitialCredentialUrl(credentialUrl);
        setInitialNbiUrl(nurse?.nbi_document_url ?? "");
        form.reset({
          firstName: profile?.first_name ?? nameParts[0] ?? "",
          middleName: profile?.middle_name ?? "",
          lastName: profile?.last_name ?? nameParts.slice(1).join(" ") ?? "",
          phone: profile?.phone ?? "",
          region: profile?.region ?? "",
          city: profile?.city ?? "",
          barangay: profile?.barangay ?? "",
          address: profile?.address ?? "",
          prcLicenseNo: nurse?.prc_license_no ?? "",
          specializations: (nurse?.specializations ?? []).join(", "),
          yearsExperience: nurse?.years_experience ?? 0,
          bio: nurse?.bio ?? "",
          hourlyRateRange: inferRateRangeId(
            nurse?.hourly_rate,
            nurse?.hourly_rate_max,
            nurse?.hourly_rate_range
          ),
          dailyRateRange: inferRateRangeId(
            nurse?.daily_rate_12hr,
            nurse?.daily_rate_12hr_max,
            nurse?.daily_rate_range
          ),
          profile_photo_url: nurse?.profile_photo_url ?? "",
          prc_document_url: nurse?.prc_document_url ?? "",
          tesda_document_url: nurse?.tesda_document_url ?? "",
          nbi_document_url: nurse?.nbi_document_url ?? ""
        });
      }
    }

    loadProfile();
  }, [form, supabase]);

  async function handleSubmit(values: NurseProfileEditValues) {
    setSaved(false);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const fullName = [values.firstName, values.middleName, values.lastName]
      .filter((item) => item && item.trim().length > 0)
      .join(" ");

    const hourlyRates = resolveRateRangeValues(
      (values.hourlyRateRange || undefined) as RateRangeId | undefined
    );
    const dailyRates = resolveRateRangeValues(
      (values.dailyRateRange || undefined) as RateRangeId | undefined
    );

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      first_name: values.firstName,
      middle_name: values.middleName || null,
      last_name: values.lastName,
      phone: values.phone || null,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address || null,
      role: "nurse"
    });

    const credentialUrl =
      providerType === "caregiver" ? values.tesda_document_url : values.prc_document_url;
    const documentsChanged =
      (credentialUrl && credentialUrl !== initialCredentialUrl) ||
      (values.nbi_document_url && values.nbi_document_url !== initialNbiUrl);
    const shouldResubmit =
      documentsChanged &&
      (verificationStatus === "rejected" || verificationStatus === "resubmission_required");

    await supabase.from("nurses").upsert({
      id: user.id,
      prc_license_no: values.prcLicenseNo || null,
      specializations: values.specializations.split(",").map((item: string) => item.trim()),
      years_experience: values.yearsExperience,
      bio: values.bio || null,
      hourly_rate: hourlyRates.min,
      hourly_rate_max: hourlyRates.max,
      hourly_rate_range: values.hourlyRateRange || null,
      daily_rate_12hr: dailyRates.min,
      daily_rate_12hr_max: dailyRates.max,
      daily_rate_range: values.dailyRateRange || null,
      profile_photo_url: values.profile_photo_url || null,
      prc_document_url: providerType === "nurse" ? values.prc_document_url || null : null,
      tesda_document_url: providerType === "caregiver" ? values.tesda_document_url || null : null,
      nbi_document_url: values.nbi_document_url || null,
      ...(shouldResubmit
        ? {
            verification_status: "pending",
            rejection_reason: null,
            verified_at: null,
            submitted_at: new Date().toISOString()
          }
        : {})
    });

    if (shouldResubmit) {
      setVerificationStatus("pending");
      setRejectionReason(null);
      setInitialCredentialUrl(credentialUrl ?? "");
      setInitialNbiUrl(values.nbi_document_url ?? "");
    }

    setSaved(true);
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Nurse profile</h1>
        <VerificationStatusBanner status={verificationStatus} rejectionReason={rejectionReason} />
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          <Input placeholder="First name" {...form.register("firstName")} />
          <Input placeholder="Middle name (optional)" {...form.register("middleName")} />
          <Input placeholder="Last name" {...form.register("lastName")} />
          <Input placeholder="Phone" {...form.register("phone")} />
          <RegionCitySelects
            region={form.watch("region")}
            city={form.watch("city")}
            onRegionChange={(value) => form.setValue("region", value, { shouldValidate: true })}
            onCityChange={(value) => form.setValue("city", value, { shouldValidate: true })}
            regionError={!!form.formState.errors.region}
            cityError={!!form.formState.errors.city}
            regionLabel={<Label htmlFor="region">Region</Label>}
            cityLabel={<Label htmlFor="city">City</Label>}
          />
          {form.formState.errors.city ? (
            <p className="text-xs text-rose-600">{form.formState.errors.city.message}</p>
          ) : null}
          <Input placeholder="Barangay" {...form.register("barangay")} />
          <Textarea placeholder="Home address (optional)" {...form.register("address")} />
          <Input placeholder="PRC license number" {...form.register("prcLicenseNo")} />
          <Input placeholder="Specializations (comma separated)" {...form.register("specializations")} />
          <Input
            type="number"
            placeholder="Years experience"
            {...form.register("yearsExperience", { valueAsNumber: true })}
          />
          <Textarea placeholder="Bio" {...form.register("bio")} />
          <div className="space-y-1">
            <Label htmlFor="hourlyRateRange">Expected hourly rate range</Label>
            <RateRangeSelect
              id="hourlyRateRange"
              value={form.watch("hourlyRateRange") ?? ""}
              onChange={(value) =>
                form.setValue("hourlyRateRange", value as NurseProfileEditValues["hourlyRateRange"])
              }
            />
            <p className="text-xs text-slate-500">Final rates can be negotiated privately with families.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dailyRateRange">Expected daily rate range</Label>
            <RateRangeSelect
              id="dailyRateRange"
              value={form.watch("dailyRateRange") ?? ""}
              onChange={(value) =>
                form.setValue("dailyRateRange", value as NurseProfileEditValues["dailyRateRange"])
              }
            />
          </div>
          <DocumentUploader
            label="Profile photo"
            pathPrefix="profile-photo"
            variant="photo"
            onUploaded={(url) => form.setValue("profile_photo_url", url)}
          />
          {providerType === "caregiver" ? (
            <DocumentUploader
              label="TESDA NC II Certificate"
              pathPrefix="tesda"
              onUploaded={(url) => form.setValue("tesda_document_url", url)}
            />
          ) : (
            <DocumentUploader
              label="PRC License"
              pathPrefix="prc"
              onUploaded={(url) => form.setValue("prc_document_url", url)}
            />
          )}
          <DocumentUploader
            label="NBI Clearance"
            pathPrefix="nbi"
            onUploaded={(url) => form.setValue("nbi_document_url", url)}
          />
          {saved ? <p className="text-sm text-emerald-700">Profile saved successfully.</p> : null}
          <Button type="submit">Save</Button>
        </form>
      </div>
    </main>
  );
}
