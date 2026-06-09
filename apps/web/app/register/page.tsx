"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupCredentialsSchema, roleSchema } from "@/lib/validations/auth";
import { fetchProfileRole, resolvePostLoginDestination } from "@/lib/post-auth";
import { resolveAuthUserId } from "@/lib/auth-session";
import { registerUserSession } from "@/lib/session-lock";
import { mapSupabaseError } from "@/lib/user-errors";
import { familyProfileSchema, nurseProfileFormSchema, type NurseProfileFormValues } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeferredDocumentPicker } from "@/components/deferred-document-picker";
import { PasswordInput } from "@/components/ui/password-input";
import { uploadNurseDocument } from "@/lib/upload-nurse-document";
import { RegionCitySelects } from "@/components/region-city-selects";
import { RateRangeSelect } from "@/components/rate-range-select";
import {
  resolveDailyRateBandValues,
  resolveHourlyRateBandValues,
  type DailyRateBandId,
  type HourlyRateBandId
} from "@/lib/rate-ranges";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";

const SIGNUP_TOTAL_STEPS = 4;

const SIGNUP_STAGE_KEYS = {
  step: "hanapkalinga.signup.step",
  role: "hanapkalinga.signup.role",
  email: "hanapkalinga.signup.email",
  family: "hanapkalinga.signup.family",
  nurse: "hanapkalinga.signup.nurse",
  auth: "hanapkalinga.signup.auth"
} as const;

const LEGACY_SIGNUP_KEYS = [
  "nurselink.signup.step",
  "nurselink.signup.role",
  "nurselink.signup.email",
  "nurselink.signup.family",
  "nurselink.signup.nurse",
  "nurselink.signup.auth"
] as const;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"family" | "nurse" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [signupUserId, setSignupUserId] = useState<string | null>(null);
  const [pendingCredentialFile, setPendingCredentialFile] = useState<File | null>(null);
  const [pendingNbiFile, setPendingNbiFile] = useState<File | null>(null);
  const [docErrors, setDocErrors] = useState<{ credential?: string; nbi?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const requiredLabel = (label: string, hasError?: boolean) => (
    <span className={hasError ? "text-sm font-medium text-rose-600" : "text-sm font-medium text-slate-700"}>
      {label} <span className="text-rose-600">*</span>
      {hasError ? <span className="ml-2 text-xs text-rose-600">Required</span> : null}
    </span>
  );

  const optionalLabel = (label: string) => (
    <span className="text-sm font-medium text-slate-700">{label}</span>
  );

  const credentialsForm = useForm({
    resolver: zodResolver(signupCredentialsSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" }
  });

  const roleForm = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: { role: "family" }
  });

  const familyForm = useForm({
    resolver: zodResolver(familyProfileSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      region: "",
      city: "",
      barangay: "",
      address: ""
    }
  });

  const nurseForm = useForm({
    resolver: zodResolver(nurseProfileFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      providerType: "nurse" as NurseProfileFormValues["providerType"],
      region: "",
      city: "",
      barangay: "",
      bio: "",
      hourlyRateRange: "",
      dailyRateRange: "",
      specializations: [] as string[]
    }
  });

  function clearSignupStage() {
    Object.values(SIGNUP_STAGE_KEYS).forEach((key) => window.sessionStorage.removeItem(key));
    LEGACY_SIGNUP_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  }

  async function handleCredentialsSubmit(values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    setStatus(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password
      });

      if (error) {
        console.error("signup.sign_up.error", error);
        setStatus(mapSupabaseError(error, "signup"));
        setIsSubmitting(false);
        return;
      }

      const userId = data.user?.id ?? data.session?.user?.id ?? null;
      if (userId) {
        setSignupUserId(userId);
        await registerUserSession(supabase, userId, navigator.userAgent);

        const { role: existingRole } = await fetchProfileRole(supabase, userId);
        if (existingRole) {
          clearSignupStage();
          const destination = resolvePostLoginDestination(existingRole, null);
          if (destination) {
            window.location.href = destination;
            return;
          }
        }
      }

      setEmail(values.email);
      credentialsForm.setValue("email", values.email);
      setStep(2);
      setStatus(null);
    } catch (error) {
      console.error("signup.sign_up.exception", error);
      setStatus("Unexpected error creating account.");
    }

    setIsSubmitting(false);
  }

  async function handleRoleSubmit(values: { role: string }) {
    setRole(values.role as "family" | "nurse");
    setStep(3);
  }

  async function handleProfileSubmit(values: NurseProfileFormValues | Record<string, unknown>) {
    const userId = await resolveAuthUserId(supabase, signupUserId);

    if (!userId || !role) {
      setStatus("Your session expired. Please sign up again from step 1.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    if (role === "family") {
      const familyValues = values as {
        firstName: string;
        middleName?: string;
        lastName: string;
        phone?: string;
        region: string;
        city: string;
        barangay: string;
        address: string;
      };

      await supabase.from("profiles").upsert({
        id: userId,
        role: "family",
        full_name: [familyValues.firstName, familyValues.middleName, familyValues.lastName]
          .filter((part) => part?.trim())
          .join(" "),
        first_name: familyValues.firstName,
        middle_name: familyValues.middleName?.trim() || null,
        last_name: familyValues.lastName,
        phone: familyValues.phone?.trim() || null,
        region: familyValues.region,
        city: familyValues.city,
        barangay: familyValues.barangay,
        address: familyValues.address
      });

      await supabase.from("families").upsert({
        id: userId,
        address: familyValues.address
      });

      clearSignupStage();
      setIsSubmitting(false);
      window.location.href = "/dashboard/family?welcome=1";
      return;
    }

    const nurseValues = values as NurseProfileFormValues;
    const nextDocErrors: { credential?: string; nbi?: string } = {};
    if (!pendingCredentialFile) {
      nextDocErrors.credential =
        nurseValues.providerType === "caregiver"
          ? "TESDA NC II certificate is required."
          : "PRC license is required.";
    }
    if (!pendingNbiFile) {
      nextDocErrors.nbi = "NBI clearance is required.";
    }
    if (Object.keys(nextDocErrors).length > 0) {
      setDocErrors(nextDocErrors);
      setIsSubmitting(false);
      return;
    }
    setDocErrors({});

    const fullName = [nurseValues.firstName, nurseValues.middleName, nurseValues.lastName]
      .filter((part) => part?.trim())
      .join(" ");

    await supabase.from("profiles").upsert({
      id: userId,
      role: "nurse",
      full_name: fullName,
      first_name: nurseValues.firstName,
      middle_name: nurseValues.middleName?.trim() || null,
      last_name: nurseValues.lastName,
      phone: null,
      region: nurseValues.region,
      city: nurseValues.city,
      barangay: nurseValues.barangay,
      address: null
    });

    const credentialPrefix = nurseValues.providerType === "nurse" ? "prc" : "tesda";
    const credentialUpload = await uploadNurseDocument(pendingCredentialFile!, credentialPrefix, userId);
    if ("error" in credentialUpload) {
      setStatus(credentialUpload.error);
      setIsSubmitting(false);
      return;
    }

    const nbiUpload = await uploadNurseDocument(pendingNbiFile!, "nbi", userId);
    if ("error" in nbiUpload) {
      setStatus(nbiUpload.error);
      setIsSubmitting(false);
      return;
    }

    const credentialField =
      nurseValues.providerType === "nurse" ? "prc_document_url" : "tesda_document_url";
    const hourlyRates = resolveHourlyRateBandValues(
      (nurseValues.hourlyRateRange || undefined) as HourlyRateBandId | undefined
    );
    const dailyRates = resolveDailyRateBandValues(
      (nurseValues.dailyRateRange || undefined) as DailyRateBandId | undefined
    );
    const submittedAt = new Date().toISOString();
    const { error: nurseError } = await supabase.from("nurses").upsert({
      id: userId,
      provider_type: nurseValues.providerType,
      specializations: nurseValues.specializations,
      bio: nurseValues.bio ?? null,
      hourly_rate: hourlyRates.min,
      hourly_rate_max: hourlyRates.max,
      hourly_rate_range: nurseValues.hourlyRateRange || null,
      daily_rate_12hr: dailyRates.min,
      daily_rate_12hr_max: dailyRates.max,
      daily_rate_range: nurseValues.dailyRateRange || null,
      nbi_document_url: nbiUpload.path,
      [credentialField]: credentialUpload.path,
      verification_status: "pending",
      submitted_at: submittedAt
    });

    if (nurseError) {
      setStatus(mapSupabaseError(nurseError, "generic"));
      setIsSubmitting(false);
      return;
    }

    clearSignupStage();
    setIsSubmitting(false);
    window.location.href = "/dashboard/nurse";
  }

  useEffect(() => {
    async function restoreSignupSession() {
      const userId = await resolveAuthUserId(supabase, null);
      if (userId) setSignupUserId(userId);
    }
    restoreSignupSession();
  }, [supabase]);

  useEffect(() => {
    async function redirectIfProfileComplete() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { role: existingRole } = await fetchProfileRole(supabase, auth.user.id);
      if (!existingRole) return;

      const destination = resolvePostLoginDestination(existingRole, null);
      if (destination) {
        clearSignupStage();
        window.location.href = destination;
      }
    }

    redirectIfProfileComplete();
  }, [supabase]);

  useEffect(() => {
    const storedStep = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.step);
    const storedRole = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.role);
    const storedEmail = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.email);
    const storedAuth = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.auth);
    const queryRole = new URLSearchParams(window.location.search).get("role");
    if (storedStep) {
      const nextStep = Number(storedStep);
      if (!Number.isNaN(nextStep)) setStep(nextStep);
    }
    const normalizedQueryRole = queryRole === "provider" ? "nurse" : queryRole;
    const nextRole =
      normalizedQueryRole === "family" || normalizedQueryRole === "nurse"
        ? normalizedQueryRole
        : storedRole;
    if (nextRole === "family" || nextRole === "nurse") {
      setRole(nextRole);
      roleForm.setValue("role", nextRole);
    }
    if (storedEmail) {
      setEmail(storedEmail);
      credentialsForm.setValue("email", storedEmail);
    }
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (typeof parsed.email === "string") credentialsForm.setValue("email", parsed.email);
      } catch {
        // Ignore malformed auth cache.
      }
    }
  }, [credentialsForm, roleForm]);

  useEffect(() => {
    window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.step, String(step));
  }, [step]);

  useEffect(() => {
    if (role) window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.role, role);
  }, [role]);

  useEffect(() => {
    if (email) window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.email, email);
  }, [email]);

  const authValues = credentialsForm.watch();
  const familyValues = familyForm.watch();
  const nurseValues = nurseForm.watch();

  useEffect(() => {
    window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.auth, JSON.stringify(authValues));
  }, [authValues]);

  useEffect(() => {
    window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.family, JSON.stringify(familyValues));
  }, [familyValues]);

  useEffect(() => {
    window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.nurse, JSON.stringify(nurseValues));
  }, [nurseValues]);

  useEffect(() => {
    const storedFamily = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.family);
    const storedNurse = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.nurse);
    if (storedFamily) {
      try {
        familyForm.reset(JSON.parse(storedFamily));
      } catch {
        // Ignore bad data
      }
    }
    if (storedNurse) {
      try {
        nurseForm.reset(JSON.parse(storedNurse));
      } catch {
        // Ignore bad data
      }
    }
  }, [familyForm, nurseForm]);

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-slate-600">Step {step} of {SIGNUP_TOTAL_STEPS}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)} className="space-y-4">
            <div className="space-y-2">
              {requiredLabel("Email", !!credentialsForm.formState.errors.email)}
              <Input
                placeholder="you@email.com"
                autoComplete="email"
                {...credentialsForm.register("email")}
                className={
                  credentialsForm.formState.errors.email ? "border-rose-500 focus:ring-rose-500" : undefined
                }
              />
              {credentialsForm.formState.errors.email ? (
                <p className="text-xs text-rose-600">Enter a valid email address.</p>
              ) : null}
            </div>
            {requiredLabel("Password", !!credentialsForm.formState.errors.password)}
            <PasswordInput
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...credentialsForm.register("password")}
              className={
                credentialsForm.formState.errors.password ? "border-rose-500 focus:ring-rose-500" : undefined
              }
            />
            {credentialsForm.formState.errors.password ? (
              <p className="text-xs text-rose-600">{credentialsForm.formState.errors.password.message}</p>
            ) : null}
            {requiredLabel("Confirm password", !!credentialsForm.formState.errors.confirmPassword)}
            <PasswordInput
              placeholder="Confirm password"
              autoComplete="new-password"
              {...credentialsForm.register("confirmPassword")}
              className={
                credentialsForm.formState.errors.confirmPassword
                  ? "border-rose-500 focus:ring-rose-500"
                  : undefined
              }
            />
            {credentialsForm.formState.errors.confirmPassword ? (
              <p className="text-xs text-rose-600">
                {credentialsForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating account..." : "Continue"}
            </Button>
          </form>
        ) : null}

        {step === 2 ? (
          <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4">
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => roleForm.setValue("role", "family")}
                className={
                  roleForm.watch("role") === "family"
                    ? "rounded-2xl border border-brand-300 bg-brand-50 p-4 text-left"
                    : "rounded-2xl border border-slate-200 bg-white p-4 text-left"
                }
              >
                <p className="text-base font-semibold">🏠 I need a nurse or caregiver</p>
                <p className="text-sm text-slate-600">For families and patients</p>
              </button>
              <button
                type="button"
                onClick={() => roleForm.setValue("role", "nurse")}
                className={
                  roleForm.watch("role") === "nurse"
                    ? "rounded-2xl border border-brand-300 bg-brand-50 p-4 text-left"
                    : "rounded-2xl border border-slate-200 bg-white p-4 text-left"
                }
              >
                <p className="text-base font-semibold">👩‍⚕️ I am a nurse or caregiver</p>
                <p className="text-sm text-slate-600">RN, PDN, or TESDA NC II caregiver</p>
              </button>
            </div>
            <Button type="submit">Continue</Button>
          </form>
        ) : null}

        {step === 3 && role === "family" ? (
          <form onSubmit={familyForm.handleSubmit(handleProfileSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                {requiredLabel("First name", !!familyForm.formState.errors.firstName)}
                <Input
                  placeholder="First name"
                  {...familyForm.register("firstName")}
                  className={familyForm.formState.errors.firstName ? "border-rose-500 focus:ring-rose-500" : undefined}
                />
              </div>
              <div className="space-y-1">
                {optionalLabel("Middle name (optional)")}
                <Input placeholder="Middle name" {...familyForm.register("middleName")} />
              </div>
            </div>
            <div className="space-y-1">
              {requiredLabel("Last name", !!familyForm.formState.errors.lastName)}
              <Input
                placeholder="Last name"
                {...familyForm.register("lastName")}
                className={familyForm.formState.errors.lastName ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
            </div>
            <div className="space-y-1">
              {optionalLabel("Phone (optional)")}
              <Input placeholder="09XX XXX XXXX" {...familyForm.register("phone")} />
            </div>
            <div className="space-y-3">
              <RegionCitySelects
                region={familyForm.watch("region")}
                city={familyForm.watch("city")}
                onRegionChange={(value) =>
                  familyForm.setValue("region", value, { shouldValidate: true })
                }
                onCityChange={(value) => familyForm.setValue("city", value, { shouldValidate: true })}
                regionError={!!familyForm.formState.errors.region}
                cityError={!!familyForm.formState.errors.city}
                regionLabel={requiredLabel("Region", !!familyForm.formState.errors.region)}
                cityLabel={requiredLabel("City", !!familyForm.formState.errors.city)}
              />
            </div>
            {familyForm.formState.errors.city ? (
              <p className="text-xs text-rose-600">{familyForm.formState.errors.city.message}</p>
            ) : null}
            <div className="space-y-1">
              {requiredLabel("Barangay", !!familyForm.formState.errors.barangay)}
              <Input
                placeholder="Barangay"
                {...familyForm.register("barangay")}
                className={familyForm.formState.errors.barangay ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
            </div>
            <div className="space-y-1">
              {requiredLabel("Home address", !!familyForm.formState.errors.address)}
              <Textarea
                placeholder="Street, building, unit number"
                {...familyForm.register("address")}
                className={familyForm.formState.errors.address ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create account"}
            </Button>
          </form>
        ) : null}

        {step === 3 && role === "nurse" ? (
          <form onSubmit={nurseForm.handleSubmit(handleProfileSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                {requiredLabel("First name", !!nurseForm.formState.errors.firstName)}
                <Input
                  placeholder="First name"
                  {...nurseForm.register("firstName")}
                  className={nurseForm.formState.errors.firstName ? "border-rose-500 focus:ring-rose-500" : undefined}
                />
              </div>
              <div className="space-y-1">
                {optionalLabel("Middle name (optional)")}
                <Input placeholder="Middle name" {...nurseForm.register("middleName")} />
              </div>
            </div>
            <div className="space-y-1">
              {requiredLabel("Last name", !!nurseForm.formState.errors.lastName)}
              <Input
                placeholder="Last name"
                {...nurseForm.register("lastName")}
                className={nurseForm.formState.errors.lastName ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
            </div>
            {requiredLabel("Provider type", !!nurseForm.formState.errors.providerType)}
            <Select
              {...nurseForm.register("providerType")}
              className={nurseForm.formState.errors.providerType ? "border-rose-500 focus:ring-rose-500" : undefined}
              onChange={(event) => {
                nurseForm.setValue("providerType", event.target.value as "nurse" | "caregiver");
                setPendingCredentialFile(null);
              }}
            >
              <option value="nurse">Nurse (PRC)</option>
              <option value="caregiver">Caregiver (TESDA NC II)</option>
            </Select>
            <div className="space-y-3">
              <RegionCitySelects
                region={nurseForm.watch("region")}
                city={nurseForm.watch("city")}
                onRegionChange={(value) =>
                  nurseForm.setValue("region", value, { shouldValidate: true, shouldDirty: true })
                }
                onCityChange={(value) =>
                  nurseForm.setValue("city", value, { shouldValidate: true, shouldDirty: true })
                }
                regionError={!!nurseForm.formState.errors.region}
                cityError={!!nurseForm.formState.errors.city}
                regionLabel={requiredLabel("Region", !!nurseForm.formState.errors.region)}
                cityLabel={requiredLabel("City", !!nurseForm.formState.errors.city)}
              />
            </div>
            {nurseForm.formState.errors.city ? (
              <p className="text-xs text-rose-600">{nurseForm.formState.errors.city.message}</p>
            ) : null}
            {requiredLabel("Barangay", !!nurseForm.formState.errors.barangay)}
            <Input
              placeholder="Barangay"
              {...nurseForm.register("barangay")}
              className={nurseForm.formState.errors.barangay ? "border-rose-500 focus:ring-rose-500" : undefined}
            />
            <div className="space-y-2">
              {requiredLabel("Specializations", !!nurseForm.formState.errors.specializations)}
              <div className="flex flex-wrap gap-2">
                {PROVIDER_SPECIALIZATIONS.map((item) => {
                  const selected = nurseForm.watch("specializations").includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const current = nurseForm.getValues("specializations");
                        const next = selected
                          ? current.filter((s: string) => s !== item)
                          : [...current, item];
                        nurseForm.setValue("specializations", next, { shouldValidate: true });
                      }}
                      className={
                        selected
                          ? "rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                          : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              {nurseForm.formState.errors.specializations ? (
                <p className="text-xs text-rose-600">Select at least one specialization.</p>
              ) : null}
            </div>
            {optionalLabel("Bio (optional)")}
            <Textarea placeholder="Bio" {...nurseForm.register("bio")} />
            <div className="space-y-1">
              {optionalLabel("Expected hourly rate range (optional)")}
              <RateRangeSelect
                variant="hourly"
                value={nurseForm.watch("hourlyRateRange") ?? ""}
                onChange={(value) =>
                  nurseForm.setValue(
                    "hourlyRateRange",
                    (value || "") as NurseProfileFormValues["hourlyRateRange"]
                  )
                }
              />
              <p className="text-xs text-slate-500">Final rates can be negotiated privately with families.</p>
            </div>
            <div className="space-y-1">
              {optionalLabel("Expected daily rate range (optional)")}
              <RateRangeSelect
                variant="daily"
                value={nurseForm.watch("dailyRateRange") ?? ""}
                onChange={(value) =>
                  nurseForm.setValue(
                    "dailyRateRange",
                    (value || "") as NurseProfileFormValues["dailyRateRange"]
                  )
                }
              />
            </div>
            {requiredLabel(
              nurseForm.watch("providerType") === "caregiver"
                ? "TESDA NC II certificate"
                : "PRC license scan",
              !!docErrors.credential
            )}
            <DeferredDocumentPicker
              label={
                nurseForm.watch("providerType") === "caregiver"
                  ? "TESDA NC II certificate"
                  : "PRC license scan"
              }
              file={pendingCredentialFile}
              onFileSelected={(file) => {
                setPendingCredentialFile(file);
                if (file) setDocErrors((prev) => ({ ...prev, credential: undefined }));
              }}
            />
            {docErrors.credential ? (
              <p className="text-xs text-rose-600">{docErrors.credential}</p>
            ) : null}
            {requiredLabel("NBI clearance", !!docErrors.nbi)}
            <DeferredDocumentPicker
              label="NBI clearance"
              file={pendingNbiFile}
              onFileSelected={(file) => {
                setPendingNbiFile(file);
                if (file) setDocErrors((prev) => ({ ...prev, nbi: undefined }));
              }}
            />
            {docErrors.nbi ? <p className="text-xs text-rose-600">{docErrors.nbi}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading documents..." : "Create account"}
            </Button>
          </form>
        ) : null}

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        <p className="text-xs text-slate-500">
          By continuing you agree to <Link href="/terms" className="underline">Terms</Link> and
          <Link href="/privacy" className="underline"> Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
