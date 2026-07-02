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
import { getDocumentExpiryItems, type DocumentExpiryItem } from "@/lib/license-expiry";
import { ThemeToggle } from "@/components/theme-toggle";
import { ensureNurseProfile } from "@/lib/nurse/ensure-profile";
import { mapSupabaseError } from "@/lib/user-errors";
import { buildFormattedFullName, toTitleCase } from "@/lib/validation/format-name";
import { DatePickerField } from "@/components/date-picker-field";
import { NAME_SUFFIX_OPTION_GROUPS } from "@/lib/validation/name-suffix";
import {
  getTesdaCertificateSegments,
  normalizeTesdaCertificateInput,
  TESDA_CERTIFICATE_MAX_LENGTH,
  TESDA_CERTIFICATE_MIN_LENGTH
} from "@/lib/validation/prc-license";
import { formatDateOfBirth, getDateOfBirthBounds } from "@/lib/validation/date-of-birth";
import {
  mergeSpecializations,
  SpecializationsPicker,
  splitStoredSpecializations
} from "@/components/specializations-picker";

function formatExpiryDate(date: string | null | undefined): string {
  if (!date) return "an upcoming date";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

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
  const [initialPrcLicenseNo, setInitialPrcLicenseNo] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [documentExpiry, setDocumentExpiry] = useState<DocumentExpiryItem[]>([]);
  const dateOfBirthBounds = getDateOfBirthBounds();

  const form = useForm<NurseProfileEditValues>({
    resolver: zodResolver(nurseProfileEditSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      nameSuffix: "",
      dateOfBirth: "",
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

      const [
        { data: profile, error: profileError },
        { data: nurse, error: nurseError },
        { data: dateOfBirth, error: dateOfBirthError }
      ] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "first_name, middle_name, last_name, name_suffix, full_name, phone, region, city, barangay, address, profile_photo_url"
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("nurses")
            .select(
              "provider_type, verification_status, rejection_reason, submitted_at, prc_license_no, tesda_certificate_no, specializations, years_experience, bio, hourly_rate, hourly_rate_max, hourly_rate_range, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, prc_document_url, tesda_document_url, nbi_document_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry"
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase.rpc("get_my_date_of_birth")
        ]);

      if (profileError) {
        console.error("nurse_profile.profiles.load", profileError);
      }
      if (nurseError) {
        console.error("nurse_profile.nurses.load", nurseError);
      }
      if (dateOfBirthError) {
        console.error("nurse_profile.dob.load", dateOfBirthError);
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
        setInitialPrcLicenseNo(nurse?.prc_license_no ?? "");
        setProfilePhotoUrl(
          resolveProfilePhotoUrl(profile?.profile_photo_url ?? nurse?.profile_photo_url ?? null)
        );
        const { selected, custom } = splitStoredSpecializations(nurse?.specializations ?? []);
        form.reset({
          firstName: profile?.first_name ?? nameParts[0] ?? "",
          middleName: profile?.middle_name ?? "",
          lastName: profile?.last_name ?? nameParts.slice(1).join(" ") ?? "",
          nameSuffix: profile?.name_suffix ?? "",
          dateOfBirth: dateOfBirth ?? "",
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
    const normalizedNameSuffix = values.nameSuffix?.trim() || null;
    const normalizedTesdaCertificateNo = normalizeTesdaCertificateInput(values.tesdaCertificateNo ?? "");
    const fullName = buildFormattedFullName({
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      suffix: normalizedNameSuffix
    });

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
      name_suffix: normalizedNameSuffix,
      date_of_birth: values.dateOfBirth || null,
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
    const credentialKey = providerType === "caregiver" ? "tesda" : "prc";
    const credentialExpiryStatus =
      documentExpiry.find((document) => document.key === credentialKey)?.status ?? "missing";
    const nbiExpiryStatus =
      documentExpiry.find((document) => document.key === "nbi")?.status ?? "missing";

    const credentialChanged = Boolean(credentialUrl && credentialUrl !== initialCredentialUrl);
    const nbiChanged = Boolean(values.nbi_document_url && values.nbi_document_url !== initialNbiUrl);
    const documentsChanged = credentialChanged || nbiChanged;
    const changedHasExpired =
      (credentialChanged && credentialExpiryStatus === "expired") ||
      (nbiChanged && nbiExpiryStatus === "expired");
    const changedHasExpiringSoon =
      (credentialChanged && credentialExpiryStatus === "expiring_soon") ||
      (nbiChanged && nbiExpiryStatus === "expiring_soon");

    const shouldResubmitToPending =
      documentsChanged &&
      (changedHasExpired ||
        verificationStatus === "rejected" ||
        verificationStatus === "resubmission_required");
    const shouldSetRenewalUnderReview =
      documentsChanged &&
      !changedHasExpired &&
      changedHasExpiringSoon &&
      isVerifiedProvider(verificationStatus);

    const specializations = mergeSpecializations(
      values.selectedSpecializations,
      values.customSpecialization ?? ""
    );

    const { error: nurseError } = await supabase.from("nurses").upsert(
      {
        id: user.id,
        provider_type: providerType,
        prc_license_no: providerType === "nurse" ? initialPrcLicenseNo || null : null,
        tesda_certificate_no: providerType === "caregiver" ? normalizedTesdaCertificateNo || null : null,
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
        ...(shouldResubmitToPending
          ? {
              verification_status: "pending",
              rejection_reason: null,
              verified_at: null,
              submitted_at: new Date().toISOString()
            }
          : shouldSetRenewalUnderReview
            ? {
                verification_status: "renewal_under_review",
                rejection_reason: null,
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

    if (shouldResubmitToPending) {
      setVerificationStatus("pending");
      setRejectionReason(null);
      setInitialCredentialUrl(credentialUrl ?? "");
      setInitialNbiUrl(values.nbi_document_url ?? "");
    } else if (shouldSetRenewalUnderReview) {
      setVerificationStatus("renewal_under_review");
      setRejectionReason(null);
      setInitialCredentialUrl(credentialUrl ?? "");
      setInitialNbiUrl(values.nbi_document_url ?? "");
    }

    setProfilePhotoUrl(resolveProfilePhotoUrl(values.profile_photo_url || null));

    if (isVerifiedProvider(verificationStatus) || shouldSetRenewalUnderReview) {
      void fetch("/api/revalidate/nurse", { method: "POST" });
    }

    setSaved(true);
  }

  const isStatusResubmissionFlow =
    verificationStatus === "rejected" || verificationStatus === "resubmission_required";
  const credentialExpiryItem = documentExpiry.find((d) =>
    providerType === "caregiver" ? d.key === "tesda" : d.key === "prc"
  );
  const nbiExpiryItem = documentExpiry.find((d) => d.key === "nbi");
  const credentialNeedsRenewal =
    credentialExpiryItem?.status === "expired" || credentialExpiryItem?.status === "expiring_soon";
  const nbiNeedsRenewal = nbiExpiryItem?.status === "expired" || nbiExpiryItem?.status === "expiring_soon";
  const canReuploadCredential = isStatusResubmissionFlow || credentialNeedsRenewal;
  const canReuploadNbi = isStatusResubmissionFlow || nbiNeedsRenewal;
  const credentialPath =
    (providerType === "caregiver"
      ? form.watch("tesda_document_url")
      : form.watch("prc_document_url")) || initialCredentialUrl;
  const nbiPath = form.watch("nbi_document_url") || initialNbiUrl;
  const isVerified = isVerifiedProvider(verificationStatus);
  const showCredentialStatus = !!credentialPath && !canReuploadCredential;
  const showNbiStatus = !!nbiPath && !canReuploadNbi;
  const credentialLabel =
    providerType === "caregiver" ? "TESDA NC II Certificate" : "PRC License";
  const displayName = resolveProfileDisplayName({
    first_name: form.watch("firstName"),
    middle_name: form.watch("middleName"),
    last_name: form.watch("lastName"),
    name_suffix: form.watch("nameSuffix")
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
          <ProfilePhotoUploader
            photoUrl={profilePhotoUrl}
            displayName={displayName}
            onPhotoChange={handleProfilePhotoChange}
          />

          <VerificationStatusBanner
            status={verificationStatus}
            rejectionReason={rejectionReason}
            variant="profile"
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
              <Label htmlFor="nameSuffix">Suffix (optional)</Label>
              <Select id="nameSuffix" {...form.register("nameSuffix")}>
                <option value="">None</option>
                {NAME_SUFFIX_OPTION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((suffix) => (
                      <option key={suffix} value={suffix}>
                        {suffix}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth">
                Date of birth <span className="text-rose-600">*</span>
              </Label>
              <DatePickerField
                value={form.watch("dateOfBirth") ?? ""}
                onChange={(value) => form.setValue("dateOfBirth", value, { shouldValidate: true })}
                min={dateOfBirthBounds.min}
                max={dateOfBirthBounds.max}
                placeholder="Select date of birth"
              />
              {form.watch("dateOfBirth") ? (
                <p className="text-xs text-slate-500">
                  Selected: {formatDateOfBirth(form.watch("dateOfBirth"))}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">
                Required for PRC license verification. Your date of birth is kept confidential and is
                only accessible to platform administrators.
              </p>
              {form.formState.errors.dateOfBirth ? (
                <p className="text-xs text-rose-600">{form.formState.errors.dateOfBirth.message}</p>
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
                    {...form.register("prcLicenseNo")}
                    readOnly
                    className={`bg-slate-50 text-slate-600 ${
                      form.formState.errors.prcLicenseNo ? "border-rose-500 focus:ring-rose-500" : ""
                    }`}
                  />
                  {form.formState.errors.prcLicenseNo ? (
                    <p className="text-xs text-rose-600">{form.formState.errors.prcLicenseNo.message}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      PRC license number is read-only. Contact support if this needs correction.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Label htmlFor="tesdaCertificateNo">TESDA NC II Certificate Number</Label>
                  <Input
                    id="tesdaCertificateNo"
                    placeholder="Enter full certificate number"
                    maxLength={TESDA_CERTIFICATE_MAX_LENGTH}
                    {...form.register("tesdaCertificateNo")}
                  />
                  <p className="text-xs text-slate-500">
                    Enter your full TESDA certificate number. You can find this on your Certificate of
                    Competency or Certificate of NC II Qualification. Usually starts with a region code and
                    contains both letters and numbers.
                  </p>
                  {(() => {
                    const currentTesda = normalizeTesdaCertificateInput(
                      form.watch("tesdaCertificateNo") ?? ""
                    );
                    const segments = getTesdaCertificateSegments(currentTesda);
                    if (!segments && currentTesda.length > 0 && currentTesda.length < TESDA_CERTIFICATE_MIN_LENGTH) {
                      return (
                        <p className="text-xs text-rose-600">
                          TESDA certificate number must be at least {TESDA_CERTIFICATE_MIN_LENGTH} characters.
                        </p>
                      );
                    }
                    if (!segments) return null;
                    return (
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>
                          First Four of Certificate No.:{" "}
                          <span className="font-medium font-mono">{segments.firstFour}</span>
                        </p>
                        <p>
                          Last Four of Certificate No.:{" "}
                          <span className="font-medium font-mono">{segments.lastFour}</span>
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            {providerType === "caregiver" && form.formState.errors.tesdaCertificateNo ? (
              <p className="text-xs text-rose-600">{form.formState.errors.tesdaCertificateNo.message}</p>
            ) : null}
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
            ) : canReuploadCredential ? (
              <>
                {!isStatusResubmissionFlow && credentialExpiryItem?.status === "expiring_soon" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <strong>Renew early:</strong> Your {credentialLabel} expires on{" "}
                    {formatExpiryDate(credentialExpiryItem.date)}. Upload your renewed document now to
                    maintain uninterrupted access. Your verified status stays active while we review the
                    new document.
                  </div>
                ) : null}
                {!isStatusResubmissionFlow && credentialExpiryItem?.status === "expired" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                    <strong>Action required:</strong> Your {credentialLabel} expired on{" "}
                    {formatExpiryDate(credentialExpiryItem.date)}. Upload your renewed document to restore
                    your verified status. Your profile will be under review until approved.
                  </div>
                ) : null}
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
              </>
            ) : (
              <DocumentPendingRow label={credentialLabel} />
            )}

            {showNbiStatus ? (
              <DocumentStatusRow label="NBI Clearance" path={nbiPath} submittedAt={submittedAt} />
            ) : canReuploadNbi ? (
              <>
                {!isStatusResubmissionFlow && nbiExpiryItem?.status === "expiring_soon" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <strong>Renew early:</strong> Your NBI Clearance expires on{" "}
                    {formatExpiryDate(nbiExpiryItem.date)}. Upload your renewed document now to maintain
                    uninterrupted access. Your verified status stays active while we review the new
                    document.
                  </div>
                ) : null}
                {!isStatusResubmissionFlow && nbiExpiryItem?.status === "expired" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                    <strong>Action required:</strong> Your NBI Clearance expired on{" "}
                    {formatExpiryDate(nbiExpiryItem.date)}. Upload your renewed document to restore your
                    verified status. Your profile will be under review until approved.
                  </div>
                ) : null}
                <DocumentUploader
                  label="NBI Clearance"
                  pathPrefix="nbi"
                  onUploaded={(url) => form.setValue("nbi_document_url", url)}
                />
              </>
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
