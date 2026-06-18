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
import { Select } from "@/components/ui/select";
import { DocumentUploader } from "@/components/document-uploader";
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader";
import { DocumentStatusRow } from "@/components/document-status-row";
import { RegionCitySelects } from "@/components/region-city-selects";
import { RateRangeSelect } from "@/components/rate-range-select";
import { PageHeader } from "@/components/page-header";
import { resolveProfileDisplayName } from "@/lib/profile-display";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { ChangeEmailSection } from "@/components/change-email-section";
import { VerificationStatusBanner } from "@/components/verification-status-banner";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { YEARS_EXPERIENCE_OPTIONS } from "@/lib/years-experience";
import {
  inferDailyRateBandId,
  inferHourlyRateBandId,
  resolveDailyRateBandValues,
  resolveHourlyRateBandValues,
  type DailyRateBandId,
  type HourlyRateBandId
} from "@/lib/rate-ranges";
import { DocumentPendingRow } from "@/components/document-pending-row";
import { isVerifiedProvider, type VerificationStatus } from "@/lib/verification";
import { DocumentExpiryCard } from "@/components/document-expiry-card";
import { getDocumentExpiryItems, hasExpiredDocuments, type DocumentExpiryItem } from "@/lib/license-expiry";
import { ThemeToggle } from "@/components/theme-toggle";
import { ensureNurseProfile } from "@/lib/nurse/ensure-profile";
import { mapSupabaseError } from "@/lib/user-errors";
import { toTitleCase } from "@/lib/validation/format-name";
import { normalizePrcLicenseInput } from "@/lib/validation/prc-license";
import {
  mergeSpecializations,
  SpecializationsPicker,
  splitStoredSpecializations
} from "@/components/specializations-picker";

export default function NurseProfilePage() {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<"nurse" | "caregiver">("nurse");
  const [initialCredentialUrl, setInitialCredentialUrl] = useState("");
  const [initialNbiUrl, setInitialNbiUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [documentExpiry, setDocumentExpiry] = useState<DocumentExpiryItem[]>([]);

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
      tesdaCertificateNo: "",
      selectedSpecializations: [] as string[],
      customSpecialization: "",
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

      const [{ data: profile, error: profileError }, { data: nurse, error: nurseError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "first_name, middle_name, last_name, full_name, phone, region, city, barangay, address, profile_photo_url"
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("nurses")
            .select(
              "provider_type, verification_status, rejection_reason, submitted_at, prc_license_no, tesda_certificate_no, specializations, years_experience, bio, hourly_rate, hourly_rate_max, hourly_rate_range, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, prc_document_url, tesda_document_url, nbi_document_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry"
            )
            .eq("id", user.id)
            .maybeSingle()
        ]);

      if (profileError) {
        console.error("nurse_profile.profiles.load", profileError);
      }
      if (nurseError) {
        console.error("nurse_profile.nurses.load", nurseError);
      }

      if (profile || nurse) {
        const nameParts = profile?.full_name?.split(" ") ?? [];
        const credentialUrl = nurse?.prc_document_url ?? nurse?.tesda_document_url ?? "";
        setVerificationStatus((nurse?.verification_status ?? "pending") as VerificationStatus);
        setRejectionReason(nurse?.rejection_reason ?? null);
        setSubmittedAt(nurse?.submitted_at ?? null);
        setProviderType((nurse?.provider_type ?? "nurse") as "nurse" | "caregiver");
        setDocumentExpiry(getDocumentExpiryItems(nurse ?? {}));
        setInitialCredentialUrl(credentialUrl);
        setInitialNbiUrl(nurse?.nbi_document_url ?? "");
        setProfilePhotoUrl(
          resolveProfilePhotoUrl(profile?.profile_photo_url ?? nurse?.profile_photo_url ?? null)
        );
        const { selected, custom } = splitStoredSpecializations(nurse?.specializations ?? []);
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
          tesdaCertificateNo: nurse?.tesda_certificate_no ?? "",
          selectedSpecializations: selected,
          customSpecialization: custom,
          yearsExperience: nurse?.years_experience ?? 0,
          bio: nurse?.bio ?? "",
          hourlyRateRange: inferHourlyRateBandId(
            nurse?.hourly_rate,
            nurse?.hourly_rate_max,
            nurse?.hourly_rate_range
          ),
          dailyRateRange: inferDailyRateBandId(
            nurse?.daily_rate_12hr,
            nurse?.daily_rate_12hr_max,
            nurse?.daily_rate_range
          ),
          profile_photo_url: profile?.profile_photo_url ?? nurse?.profile_photo_url ?? "",
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
    setSaveError(null);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const normalizedFirstName = toTitleCase(values.firstName);
    const normalizedMiddleName = toTitleCase(values.middleName);
    const normalizedLastName = toTitleCase(values.lastName);
    const fullName = [normalizedFirstName, normalizedMiddleName, normalizedLastName]
      .filter((item) => item && item.trim().length > 0)
      .join(" ");

    const hourlyRates = resolveHourlyRateBandValues(
      (values.hourlyRateRange || undefined) as HourlyRateBandId | undefined
    );
    const dailyRates = resolveDailyRateBandValues(
      (values.dailyRateRange || undefined) as DailyRateBandId | undefined
    );

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      first_name: normalizedFirstName,
      middle_name: normalizedMiddleName || null,
      last_name: normalizedLastName,
      phone: values.phone || null,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address || null,
      role: "nurse"
    });

    if (profileError) {
      console.error("nurse_profile.profiles.error", profileError);
      setSaveError(mapSupabaseError(profileError, "generic"));
      return;
    }

    const { error: nurseStubError } = await ensureNurseProfile(supabase, user.id, providerType);
    if (nurseStubError) {
      console.error("nurse_profile.nurses_stub.error", nurseStubError);
      setSaveError(mapSupabaseError(nurseStubError, "generic"));
      return;
    }

    const credentialUrl =
      providerType === "caregiver" ? values.tesda_document_url : values.prc_document_url;
    const documentsChanged =
      (credentialUrl && credentialUrl !== initialCredentialUrl) ||
      (values.nbi_document_url && values.nbi_document_url !== initialNbiUrl);
    const docsExpired = hasExpiredDocuments({
      provider_type: providerType,
      prc_license_expiry: documentExpiry.find((d) => d.key === "prc")?.date,
      tesda_cert_expiry: documentExpiry.find((d) => d.key === "tesda")?.date,
      nbi_expiry: documentExpiry.find((d) => d.key === "nbi")?.date
    });
    const shouldResubmit =
      documentsChanged &&
      (docsExpired ||
        verificationStatus === "rejected" ||
        verificationStatus === "resubmission_required");

    const specializations = mergeSpecializations(
      values.selectedSpecializations,
      values.customSpecialization ?? ""
    );

    const { error: nurseError } = await supabase.from("nurses").upsert(
      {
        id: user.id,
        provider_type: providerType,
        prc_license_no: providerType === "nurse" ? values.prcLicenseNo || null : null,
        tesda_certificate_no: providerType === "caregiver" ? values.tesdaCertificateNo || null : null,
        specializations,
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
      },
      { onConflict: "id" }
    );

    if (nurseError) {
      console.error("nurse_profile.nurses.error", nurseError);
      setSaveError(mapSupabaseError(nurseError, "generic"));
      return;
    }

    if (shouldResubmit) {
      setVerificationStatus("pending");
      setRejectionReason(null);
      setInitialCredentialUrl(credentialUrl ?? "");
      setInitialNbiUrl(values.nbi_document_url ?? "");
    }

    setProfilePhotoUrl(resolveProfilePhotoUrl(values.profile_photo_url || null));

    if (verificationStatus === "verified") {
      void fetch("/api/revalidate/nurse", { method: "POST" });
    }

    setSaved(true);
  }

  const documentsExpired = hasExpiredDocuments({
    provider_type: providerType,
    prc_license_expiry: documentExpiry.find((d) => d.key === "prc")?.date,
    tesda_cert_expiry: documentExpiry.find((d) => d.key === "tesda")?.date,
    nbi_expiry: documentExpiry.find((d) => d.key === "nbi")?.date
  });
  const canReuploadDocuments =
    documentsExpired ||
    verificationStatus === "rejected" ||
    verificationStatus === "resubmission_required";
  const credentialPath =
    (providerType === "caregiver"
      ? form.watch("tesda_document_url")
      : form.watch("prc_document_url")) || initialCredentialUrl;
  const nbiPath = form.watch("nbi_document_url") || initialNbiUrl;
  const isVerified = isVerifiedProvider(verificationStatus);
  const showCredentialStatus = !!credentialPath && !canReuploadDocuments;
  const showNbiStatus = !!nbiPath && !canReuploadDocuments;
  const credentialLabel =
    providerType === "caregiver" ? "TESDA NC II Certificate" : "PRC License";
  const displayName = resolveProfileDisplayName({
    first_name: form.watch("firstName"),
    last_name: form.watch("lastName")
  });

  async function handleProfilePhotoChange(url: string) {
    form.setValue("profile_photo_url", url);
    setProfilePhotoUrl(url.startsWith("http") ? url : resolveProfilePhotoUrl(url));
  }

  return (
    <>
      <PageHeader title="User Profile" showBack={false} />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-5">
          <VerificationStatusBanner
            status={verificationStatus}
            rejectionReason={rejectionReason}
            variant="profile"
          />

          <ProfilePhotoUploader
            photoUrl={profilePhotoUrl}
            displayName={displayName}
            onPhotoChange={handleProfilePhotoChange}
          />

          <ThemeToggle />

          {isVerified && documentExpiry.length > 0 ? (
            <DocumentExpiryCard documents={documentExpiry} showRenewCta={false} />
          ) : null}

          {isVerifiedProvider(verificationStatus) &&
          ((providerType === "nurse" && !form.watch("prcLicenseNo")?.trim()) ||
            (providerType === "caregiver" && !form.watch("tesdaCertificateNo")?.trim())) ? (
            <div className="rounded-2xl border border-warning-border bg-warning-bg p-4 text-sm text-warning">
              {providerType === "nurse"
                ? "Add your PRC license number to help admins verify your credentials. This does not affect your verified status."
                : "Add your TESDA certificate number to help admins verify your credentials. This does not affect your verified status."}
            </div>
          ) : null}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id="documents">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="First name"
                className={form.formState.errors.firstName ? "border-rose-500 focus:ring-rose-500" : undefined}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-rose-600">{form.formState.errors.firstName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="middleName">Middle name</Label>
              <Input
                id="middleName"
                placeholder="Middle name (optional)"
                className={form.formState.errors.middleName ? "border-rose-500 focus:ring-rose-500" : undefined}
                {...form.register("middleName")}
              />
              {form.formState.errors.middleName ? (
                <p className="text-xs text-rose-600">{form.formState.errors.middleName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                className={form.formState.errors.lastName ? "border-rose-500 focus:ring-rose-500" : undefined}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-xs text-rose-600">{form.formState.errors.lastName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="09XXXXXXXXX"
                inputMode="numeric"
                maxLength={11}
                {...form.register("phone")}
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 11);
                }}
              />
            </div>
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
            <div className="space-y-1">
              <Label htmlFor="barangay">Barangay</Label>
              <Input
                id="barangay"
                placeholder="Barangay"
                className={form.formState.errors.barangay ? "border-rose-500 focus:ring-rose-500" : undefined}
                {...form.register("barangay")}
              />
              {form.formState.errors.barangay ? (
                <p className="text-xs text-rose-600">{form.formState.errors.barangay.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Home address</Label>
              <Textarea
                id="address"
                placeholder="Home address (optional)"
                className={form.formState.errors.address ? "border-rose-500 focus:ring-rose-500" : undefined}
                {...form.register("address")}
              />
              {form.formState.errors.address ? (
                <p className="text-xs text-rose-600">{form.formState.errors.address.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              {providerType === "nurse" ? (
                <>
                  <Label htmlFor="prcLicenseNo">PRC license number</Label>
                  <Input
                    id="prcLicenseNo"
                    placeholder="7-digit number"
                    inputMode="numeric"
                    maxLength={7}
                    className={form.formState.errors.prcLicenseNo ? "border-rose-500 focus:ring-rose-500" : undefined}
                    {...form.register("prcLicenseNo")}
                    onInput={(event) => {
                      event.currentTarget.value = normalizePrcLicenseInput(event.currentTarget.value);
                    }}
                  />
                  {form.formState.errors.prcLicenseNo ? (
                    <p className="text-xs text-rose-600">{form.formState.errors.prcLicenseNo.message}</p>
                  ) : (
                    <p className="text-xs text-slate-500">Enter the 7-digit number from your PRC ID.</p>
                  )}
                </>
              ) : (
                <>
                  <Label htmlFor="tesdaCertificateNo">TESDA certificate number</Label>
                  <Input
                    id="tesdaCertificateNo"
                    placeholder="TESDA NC II certificate number"
                    {...form.register("tesdaCertificateNo")}
                  />
                </>
              )}
            </div>
            <SpecializationsPicker
              selected={form.watch("selectedSpecializations")}
              customValue={form.watch("customSpecialization") ?? ""}
              onSelectedChange={(value) =>
                form.setValue("selectedSpecializations", value, { shouldValidate: true })
              }
              onCustomChange={(value) =>
                form.setValue("customSpecialization", value, { shouldValidate: true })
              }
              error={
                form.formState.errors.selectedSpecializations?.message ??
                form.formState.errors.customSpecialization?.message
              }
            />
            <div className="space-y-1">
              <Label htmlFor="yearsExperience">Years of experience</Label>
              <Select
                id="yearsExperience"
                value={String(form.watch("yearsExperience"))}
                onChange={(event) =>
                  form.setValue("yearsExperience", Number(event.target.value), { shouldValidate: true })
                }
              >
                {YEARS_EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Bio"
                className={form.formState.errors.bio ? "border-rose-500 focus:ring-rose-500" : undefined}
                {...form.register("bio")}
              />
              {form.formState.errors.bio ? (
                <p className="text-xs text-rose-600">{form.formState.errors.bio.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="hourlyRateRange">Expected hourly rate range</Label>
              <RateRangeSelect
                id="hourlyRateRange"
                variant="hourly"
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
                variant="daily"
                value={form.watch("dailyRateRange") ?? ""}
                onChange={(value) =>
                  form.setValue("dailyRateRange", value as NurseProfileEditValues["dailyRateRange"])
                }
              />
            </div>

            {showCredentialStatus ? (
              <DocumentStatusRow label={credentialLabel} path={credentialPath} submittedAt={submittedAt} />
            ) : canReuploadDocuments ? (
              providerType === "caregiver" ? (
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
              )
            ) : (
              <DocumentPendingRow label={credentialLabel} />
            )}

            {showNbiStatus ? (
              <DocumentStatusRow label="NBI Clearance" path={nbiPath} submittedAt={submittedAt} />
            ) : canReuploadDocuments ? (
              <DocumentUploader
                label="NBI Clearance"
                pathPrefix="nbi"
                onUploaded={(url) => form.setValue("nbi_document_url", url)}
              />
            ) : (
              <DocumentPendingRow label="NBI Clearance" />
            )}

            {saveError ? <p className="text-sm text-rose-600">{saveError}</p> : null}
            {saved ? <p className="text-sm text-emerald-700">Profile saved successfully.</p> : null}
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>

          <ChangeEmailSection />
          <SignOutDialog className="mt-2" />
        </div>
      </main>
    </>
  );
}
