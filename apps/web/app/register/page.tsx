"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupOtpSchema, roleSchema, passwordSetupSchema } from "@/lib/validations/auth";
import { fetchProfileRole, resolvePostLoginDestination } from "@/lib/post-auth";
import { resolveAuthUserId } from "@/lib/auth-session";
import { mapSupabaseError } from "@/lib/user-errors";
import { familyProfileSchema, nurseProfileSchema } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploader } from "@/components/document-uploader";
import { PasswordInput } from "@/components/ui/password-input";
import { PH_CITIES, PH_REGIONS } from "@/lib/ph-locations";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";

const SIGNUP_TOTAL_STEPS = 5;

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

  const authForm = useForm({
    resolver: zodResolver(signupOtpSchema),
    defaultValues: { email: "", token: "" }
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { password: "", confirmPassword: "" }
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
    resolver: zodResolver(nurseProfileSchema),
    defaultValues: {
      fullName: "",
      providerType: "nurse",
      city: "",
      barangay: "",
      bio: "",
      hourlyRate: undefined,
      dailyRate12hr: undefined,
      specializations: [] as string[],
      prcDocumentUrl: "",
      tesdaDocumentUrl: "",
      nbiDocumentUrl: ""
    }
  });

  function clearSignupStage() {
    Object.values(SIGNUP_STAGE_KEYS).forEach((key) => window.sessionStorage.removeItem(key));
    LEGACY_SIGNUP_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  }

  async function handleAuthSubmit(values: any) {
    setStatus(null);
    setIsSubmitting(true);
    if (step === 1) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: { shouldCreateUser: true }
        });
        if (error) {
          console.error("signup.send_code.error", error);
          setStatus(mapSupabaseError(error, "signup"));
          setIsSubmitting(false);
          return;
        }
        console.info("signup.send_code.success", data);
      } catch (error) {
        console.error("signup.send_code.exception", error);
        setStatus("Unexpected error sending code.");
        setIsSubmitting(false);
        return;
      }
      setEmail(values.email);
      setStep(2);
      setStatus("Check your email for the 6-digit code.");
      setIsSubmitting(false);
      return;
    }

    if (step === 2 && values.token) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: values.token,
          type: "email"
        });
        if (error) {
          console.error("signup.verify_code.error", error);
          setStatus(mapSupabaseError(error, "signup"));
          setIsSubmitting(false);
          return;
        }
        console.info("signup.verify_code.success", data);
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }
        const userId = data?.user?.id ?? data.session?.user?.id ?? null;
        if (userId) {
          setSignupUserId(userId);
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
      } catch (error) {
        console.error("signup.verify_code.exception", error);
        setStatus("Unexpected error verifying code.");
        setIsSubmitting(false);
        return;
      }
      setStep(3);
      setStatus(null);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  async function handleResend() {
    if (!email) return;
    setStatus(null);
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) {
        console.error("signup.resend_code.error", error);
      } else {
        console.info("signup.resend_code.success", data);
      }
      setStatus(error ? mapSupabaseError(error, "signup") : "Code resent. Check your email.");
    } catch (error) {
      console.error("signup.resend_code.exception", error);
      setStatus("Unexpected error resending code.");
    }
    setIsSubmitting(false);
  }

  async function handleRoleSubmit(values: any) {
    setRole(values.role);
    setStep(4);
  }

  async function handleProfileSubmit(values: any) {
    const userId = await resolveAuthUserId(supabase, signupUserId);

    if (!userId || !role) {
      setStatus("Your session expired. Please verify your email code again (step 2).");
      return;
    }

    const profilePayload =
      role === "family"
        ? {
            id: userId,
            role,
            full_name: [values.firstName, values.middleName, values.lastName]
              .filter((part: string) => part?.trim())
              .join(" "),
            first_name: values.firstName,
            middle_name: values.middleName?.trim() || null,
            last_name: values.lastName,
            phone: values.phone?.trim() || null,
            region: values.region,
            city: values.city,
            barangay: values.barangay,
            address: values.address
          }
        : {
            id: userId,
            role,
            full_name: values.fullName,
            first_name: null,
            middle_name: null,
            last_name: null,
            phone: null,
            region: null,
            city: values.city,
            barangay: values.barangay,
            address: null
          };

    await supabase.from("profiles").upsert(profilePayload);

    if (role === "family") {
      await supabase.from("families").upsert({
        id: userId,
        address: values.address
      });
    } else if (role === "nurse") {
      const credentialField = values.providerType === "nurse" ? "prc_document_url" : "tesda_document_url";
      await supabase.from("nurses").upsert({
        id: userId,
        provider_type: values.providerType,
        specializations: values.specializations,
        bio: values.bio ?? null,
        hourly_rate: values.hourlyRate ?? null,
        daily_rate_12hr: values.dailyRate12hr ?? null,
        nbi_document_url: values.nbiDocumentUrl,
        [credentialField]: values.providerType === "nurse" ? values.prcDocumentUrl : values.tesdaDocumentUrl,
        verification_status: "pending"
      });
    }

    setStep(5);
    setStatus(null);
  }

  async function handlePasswordSubmit(values: { password: string; confirmPassword: string }) {
    setStatus(null);
    setIsSubmitting(true);

    const userId = await resolveAuthUserId(supabase, signupUserId);

    if (!userId || !role) {
      setStatus("Session expired. Please start registration again.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setStatus(mapSupabaseError(error, "password"));
      setIsSubmitting(false);
      return;
    }

    clearSignupStage();
    setIsSubmitting(false);

    if (role === "family") {
      window.location.href = "/dashboard/family?welcome=1";
      return;
    }

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
      authForm.setValue("email", storedEmail);
    }
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (typeof parsed.email === "string") authForm.setValue("email", parsed.email);
        if (typeof parsed.token === "string") authForm.setValue("token", parsed.token);
      } catch {
        // Ignore malformed auth cache.
      }
    }
  }, [authForm, roleForm]);

  useEffect(() => {
    window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.step, String(step));
  }, [step]);

  useEffect(() => {
    if (role) window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.role, role);
  }, [role]);

  useEffect(() => {
    if (email) window.sessionStorage.setItem(SIGNUP_STAGE_KEYS.email, email);
  }, [email]);

  const authValues = authForm.watch();
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

        {step <= 2 ? (
          <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4">
            {step === 1 ? (
              <div className="space-y-2">
                {requiredLabel("Email", !!authForm.formState.errors.email)}
                <Input
                  placeholder="you@email.com"
                  {...authForm.register("email")}
                  className={authForm.formState.errors.email ? "border-rose-500 focus:ring-rose-500" : undefined}
                />
                {authForm.formState.errors.email ? (
                  <p className="text-xs text-rose-600">Enter a valid email address.</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                {requiredLabel("6-digit code", !!authForm.formState.errors.token)}
                <Input
                  placeholder="6-digit code"
                  maxLength={6}
                  {...authForm.register("token")}
                  className={authForm.formState.errors.token ? "border-rose-500 focus:ring-rose-500" : undefined}
                />
                {authForm.formState.errors.token ? (
                  <p className="text-xs text-rose-600">Enter the 6-digit code.</p>
                ) : null}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="submit" disabled={isSubmitting} className="sm:flex-1">
                {isSubmitting ? "Sending..." : step === 1 ? "Send code" : "Verify code"}
              </Button>
              {step === 2 ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-sm font-medium text-brand-700 underline hover:text-brand-900 disabled:opacity-50 sm:px-2"
                  disabled={isSubmitting}
                >
                  Resend code
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        {step === 3 ? (
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

        {step === 4 && role === "family" ? (
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
            <div className="space-y-1">
              {requiredLabel("Region", !!familyForm.formState.errors.region)}
              <Select
                {...familyForm.register("region")}
                className={familyForm.formState.errors.region ? "border-rose-500 focus:ring-rose-500" : undefined}
              >
                <option value="">Select region</option>
                {PH_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              {requiredLabel("City", !!familyForm.formState.errors.city)}
              <Select
                {...familyForm.register("city")}
                className={familyForm.formState.errors.city ? "border-rose-500 focus:ring-rose-500" : undefined}
              >
                <option value="">Select city</option>
                {PH_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </div>
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
            <Button type="submit">Continue</Button>
          </form>
        ) : null}

        {step === 4 && role === "nurse" ? (
          <form onSubmit={nurseForm.handleSubmit(handleProfileSubmit)} className="space-y-3">
            {requiredLabel("Full name", !!nurseForm.formState.errors.fullName)}
            <Input
              placeholder="Full name"
              {...nurseForm.register("fullName")}
              className={nurseForm.formState.errors.fullName ? "border-rose-500 focus:ring-rose-500" : undefined}
            />
            {requiredLabel("Provider type", !!nurseForm.formState.errors.providerType)}
            <Select
              {...nurseForm.register("providerType")}
              className={nurseForm.formState.errors.providerType ? "border-rose-500 focus:ring-rose-500" : undefined}
            >
              <option value="nurse">Nurse (PRC)</option>
              <option value="caregiver">Caregiver (TESDA NC II)</option>
            </Select>
            {requiredLabel("City", !!nurseForm.formState.errors.city)}
            <Select
              {...nurseForm.register("city")}
              className={nurseForm.formState.errors.city ? "border-rose-500 focus:ring-rose-500" : undefined}
            >
              <option value="">Select city</option>
              {PH_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
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
            {optionalLabel("Hourly rate (optional)")}
            <Input type="number" placeholder="Hourly rate" {...nurseForm.register("hourlyRate", { valueAsNumber: true })} />
            {optionalLabel("Daily rate (optional)")}
            <Input type="number" placeholder="Daily rate" {...nurseForm.register("dailyRate12hr", { valueAsNumber: true })} />
            {requiredLabel(
              nurseForm.watch("providerType") === "caregiver"
                ? "TESDA NC II certificate"
                : "PRC license scan",
              nurseForm.watch("providerType") === "caregiver"
                ? !!nurseForm.formState.errors.tesdaDocumentUrl
                : !!nurseForm.formState.errors.prcDocumentUrl
            )}
            {nurseForm.watch("providerType") === "caregiver" ? (
              <DocumentUploader
                label="TESDA NC II certificate"
                pathPrefix="tesda"
                userId={signupUserId}
                onUploaded={(url) => nurseForm.setValue("tesdaDocumentUrl", url, { shouldValidate: true })}
              />
            ) : (
              <DocumentUploader
                label="PRC license scan"
                pathPrefix="prc"
                userId={signupUserId}
                onUploaded={(url) => nurseForm.setValue("prcDocumentUrl", url, { shouldValidate: true })}
              />
            )}
            {nurseForm.watch("providerType") === "caregiver" && nurseForm.formState.errors.tesdaDocumentUrl ? (
              <p className="text-xs text-rose-600">Required</p>
            ) : null}
            {nurseForm.watch("providerType") !== "caregiver" && nurseForm.formState.errors.prcDocumentUrl ? (
              <p className="text-xs text-rose-600">Required</p>
            ) : null}
            {requiredLabel("NBI clearance", !!nurseForm.formState.errors.nbiDocumentUrl)}
            <DocumentUploader
              label="NBI clearance"
              pathPrefix="nbi"
              userId={signupUserId}
              onUploaded={(url) => nurseForm.setValue("nbiDocumentUrl", url, { shouldValidate: true })}
            />
            {nurseForm.formState.errors.nbiDocumentUrl ? (
              <p className="text-xs text-rose-600">Required</p>
            ) : null}
            <Button type="submit">Continue</Button>
          </form>
        ) : null}

        {step === 5 ? (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <p className="text-sm text-slate-600">
              Create a password to sign in next time. You will not need an email code for login.
            </p>
            {requiredLabel("Password", !!passwordForm.formState.errors.password)}
            <PasswordInput
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...passwordForm.register("password")}
              className={
                passwordForm.formState.errors.password ? "border-rose-500 focus:ring-rose-500" : undefined
              }
            />
            {passwordForm.formState.errors.password ? (
              <p className="text-xs text-rose-600">{passwordForm.formState.errors.password.message}</p>
            ) : null}
            {requiredLabel("Confirm password", !!passwordForm.formState.errors.confirmPassword)}
            <PasswordInput
              placeholder="Confirm password"
              autoComplete="new-password"
              {...passwordForm.register("confirmPassword")}
              className={
                passwordForm.formState.errors.confirmPassword
                  ? "border-rose-500 focus:ring-rose-500"
                  : undefined
              }
            />
            {passwordForm.formState.errors.confirmPassword ? (
              <p className="text-xs text-rose-600">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create account"}
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
