"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupCredentialsSchema, roleSchema } from "@/lib/validations/auth";
import { fetchProfileRole, resolvePostLoginDestination } from "@/lib/post-auth";
import { resolveAuthUserId } from "@/lib/auth-session";
import { establishUserSession } from "@/lib/session-lock";
import { mapSupabaseError } from "@/lib/user-errors";
import { familyProfileSchema, nurseProfileFormSchema, type NurseProfileFormValues } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { TermsAcceptanceModal } from "@/components/terms-acceptance-modal";
import { TurnstileWidget } from "@/components/turnstile-widget";
import {
  clearTermsAcceptanceSession,
  getTermsAcceptedAtForUser,
  hasAcceptedTermsForUser,
  recordTermsAcceptanceForUser,
  syncTermsAcceptanceFromProfile
} from "@/lib/terms-acceptance";
import { mapUploadErrorMessage } from "@/lib/storage/parse-upload-response";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeferredDocumentPicker } from "@/components/deferred-document-picker";
import { PasswordInput } from "@/components/ui/password-input";
import { uploadNurseDocument } from "@/lib/upload-nurse-document";
import { RegionCitySelects } from "@/components/region-city-selects";
import { RateRangeSelect } from "@/components/rate-range-select";
import type { DailyRateBandId, HourlyRateBandId } from "@/lib/rate-ranges";
import { PROVIDER_SPECIALIZATIONS } from "@/lib/constants";
import { ensureNurseProfile } from "@/lib/nurse/ensure-profile";
import {
  clearSignupStage,
  clearSignupStageIfStale,
  getSignupStageKeys,
  isSignupStageOwnedBy,
  saveSignupUserId,
  SIGNUP_TOTAL_STEPS
} from "@/lib/signup-stage";
import { normalizePrcLicenseInput } from "@/lib/validation/prc-license";
import { NAME_SUFFIX_OPTION_GROUPS } from "@/lib/validation/name-suffix";

const SIGNUP_STAGE_KEYS = getSignupStageKeys();

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
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsPendingUserId, setTermsPendingUserId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const supabase = createClient();
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

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
      nameSuffix: "",
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
      nameSuffix: "",
      providerType: "nurse" as NurseProfileFormValues["providerType"],
      region: "",
      city: "",
      barangay: "",
      bio: "",
      hourlyRateRange: "",
      dailyRateRange: "",
      prcLicenseNo: "",
      tesdaCertificateNo: "",
      specializations: [] as string[]
    }
  });

  function clearSignupStageLocal() {
    clearSignupStage();
  }

  async function resetSignupAuthState() {
    clearSignupStageLocal();
    clearTermsAcceptanceSession();
    setSignupUserId(null);
    setTermsAccepted(false);
    await supabase.auth.signOut({ scope: "local" });
  }

  async function handleCredentialsSubmit(values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    setStatus(null);
    const existingUserId = await resolveAuthUserId(supabase, signupUserId);
    if (existingUserId) {
      const { data: authData } = await supabase.auth.getUser();
      const sessionEmail = authData.user?.email?.trim().toLowerCase() ?? "";
      const submittedEmail = values.email.trim().toLowerCase();
      if (sessionEmail && sessionEmail === submittedEmail) {
        setSignupUserId(existingUserId);
        saveSignupUserId(existingUserId);
        setEmail(values.email);
        credentialsForm.setValue("email", values.email);
        const hasTerms =
          hasAcceptedTermsForUser(existingUserId) ||
          (await syncTermsAcceptanceFromProfile(supabase, existingUserId));
        if (hasTerms) setTermsAccepted(true);
        if (!hasTerms) {
          setTermsPendingUserId(existingUserId);
          setShowTermsModal(true);
          return;
        }
        setStep(2);
        return;
      }

      await resetSignupAuthState();
    }

    await performSignUp(values);
  }

  async function performSignUp(values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    setStatus(null);
    setIsSubmitting(true);

    if (turnstileRequired && !captchaToken) {
      setStatus("Please complete the verification challenge.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: captchaToken ? { captchaToken } : undefined
      });

      if (error) {
        console.error("signup.sign_up.error", error);
        const lowered = error.message.toLowerCase();
        if (lowered.includes("captcha") || lowered.includes("turnstile")) {
          setStatus("Verification failed. Please try again.");
          setCaptchaToken(null);
        } else {
          setStatus(mapSupabaseError(error, "signup"));
        }
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      const { data: verifiedAuth } = await supabase.auth.getUser();
      const verifiedUser = verifiedAuth.user;

      if (
        data.user &&
        (!data.user.identities || data.user.identities.length === 0) &&
        !verifiedUser
      ) {
        setStatus("An account with this email may already exist. Try logging in instead.");
        setIsSubmitting(false);
        return;
      }

      const userId = verifiedUser?.id ?? data.user?.id ?? data.session?.user?.id ?? null;
      if (!userId) {
        setStatus("Account could not be created. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSignupUserId(userId);
      saveSignupUserId(userId);

      if (!data.session) {
        setStatus(
          "Check your email for a confirmation link. After confirming, sign in to finish setting up your account."
        );
        setIsSubmitting(false);
        return;
      }

      await establishUserSession(supabase, userId, navigator.userAgent);

      const { role: existingRole } = await fetchProfileRole(supabase, userId);
      if (existingRole) {
        clearSignupStageLocal();
        const destination = resolvePostLoginDestination(existingRole, null);
        if (destination) {
          window.location.href = destination;
          return;
        }
      }

      if (!hasAcceptedTermsForUser(userId)) {
        setTermsPendingUserId(userId);
        setShowTermsModal(true);
        setIsSubmitting(false);
        return;
      }

      setEmail(values.email);
      credentialsForm.setValue("email", values.email);
      setStep(2);
      setStatus(null);
    } catch (error) {
      console.error("signup.sign_up.exception", error);
      setStatus(
        mapSupabaseError(
          error instanceof Error ? { message: error.message } : undefined,
          "signup"
        )
      );
    }

    setIsSubmitting(false);
  }

  async function resolveTermsAcceptedUserId(): Promise<string | null> {
    const userId = await resolveAuthUserId(supabase, signupUserId);
    if (!userId) {
      setStatus("Your session expired. Please sign up again from step 1.");
      return null;
    }
    if (hasAcceptedTermsForUser(userId)) {
      setTermsAccepted(true);
      return userId;
    }
    if (await syncTermsAcceptanceFromProfile(supabase, userId)) {
      setTermsAccepted(true);
      return userId;
    }
    setTermsPendingUserId(userId);
    setShowTermsModal(true);
    return null;
  }

  async function handleRoleSubmit(values: { role: string }) {
    const userId = await resolveTermsAcceptedUserId();
    if (!userId) {
      return;
    }

    setIsSavingRole(true);
    setStatus(null);

    const nextRole = values.role as "family" | "nurse";
    const acceptedAt = getTermsAcceptedAtForUser(userId) ?? new Date().toISOString();
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      role: nextRole,
      terms_accepted_at: acceptedAt
    });

    if (profileError) {
      console.error("signup.profiles_role.error", profileError);
      if (profileError.code === "23503") {
        await resetSignupAuthState();
        setStep(1);
        setStatus("Your session expired. Please sign up again from step 1.");
      } else {
        setStatus(mapSupabaseError(profileError, "generic"));
      }
      setIsSavingRole(false);
      return;
    }

    recordTermsAcceptanceForUser(userId, acceptedAt);
    setTermsAccepted(true);

    if (nextRole === "nurse") {
      const { error: nurseError } = await ensureNurseProfile(supabase, userId, "nurse");
      if (nurseError) {
        console.error("signup.nurses_stub.error", nurseError);
        setStatus(mapSupabaseError(nurseError, "generic"));
        setIsSavingRole(false);
        return;
      }
    }

    setRole(nextRole);
    setStep(3);
    setIsSavingRole(false);
  }

  async function handleProfileSubmit(values: NurseProfileFormValues | Record<string, unknown>) {
    const userId = await resolveTermsAcceptedUserId();
    if (!userId || !role) {
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    if (role === "family") {
      const familyValues = values as {
        firstName: string;
        middleName?: string;
        lastName: string;
        nameSuffix?: string;
        phone?: string;
        region: string;
        city: string;
        barangay: string;
        address: string;
      };

      const completeResponse = await fetch("/api/register/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...familyValues,
          termsAcceptedAt: getTermsAcceptedAtForUser(userId) ?? undefined
        })
      });

      const completePayload = (await completeResponse.json()) as { error?: string };
      if (!completeResponse.ok) {
        console.error("signup.family_finalize.error", completePayload.error);
        setStatus(completePayload.error ?? "Could not complete registration. Please try again.");
        setIsSubmitting(false);
        return;
      }

      await establishUserSession(supabase, userId, navigator.userAgent);

      clearSignupStageLocal();
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

    const { error: stubError } = await ensureNurseProfile(supabase, userId, nurseValues.providerType);
    if (stubError) {
      console.error("signup.nurses_provider_type.error", stubError);
      setStatus(mapSupabaseError(stubError, "generic"));
      setIsSubmitting(false);
      return;
    }

    const credentialPrefix = nurseValues.providerType === "nurse" ? "prc" : "tesda";

    setUploadProgress("Uploading documents...");
    const [credentialUpload, nbiUpload] = await Promise.all([
      uploadNurseDocument(pendingCredentialFile!, credentialPrefix, userId),
      uploadNurseDocument(pendingNbiFile!, "nbi", userId)
    ]);

    if ("error" in credentialUpload) {
      const credentialLabel =
        nurseValues.providerType === "caregiver" ? "TESDA certificate" : "PRC license";
      setStatus(mapUploadErrorMessage(credentialUpload.error));
      setDocErrors((prev) => ({
        ...prev,
        credential: mapUploadErrorMessage(credentialUpload.error)
      }));
      setUploadProgress(null);
      setIsSubmitting(false);
      return;
    }

    if ("error" in nbiUpload) {
      setStatus(mapUploadErrorMessage(nbiUpload.error));
      setDocErrors((prev) => ({ ...prev, nbi: mapUploadErrorMessage(nbiUpload.error) }));
      setUploadProgress(null);
      setIsSubmitting(false);
      return;
    }

    setUploadProgress("Saving your profile...");

    const completeResponse = await fetch("/api/register/nurse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...nurseValues,
        prcDocumentPath: nurseValues.providerType === "nurse" ? credentialUpload.path : undefined,
        tesdaDocumentPath: nurseValues.providerType === "caregiver" ? credentialUpload.path : undefined,
        nbiDocumentPath: nbiUpload.path,
        nameSuffix: nurseValues.nameSuffix || undefined,
        termsAcceptedAt: getTermsAcceptedAtForUser(userId) ?? undefined
      })
    });

    const completePayload = (await completeResponse.json()) as { error?: string };
    if (!completeResponse.ok) {
      console.error("signup.nurses_finalize.error", completePayload.error);
      setStatus(completePayload.error ?? "Could not complete registration. Please try again.");
      setIsSubmitting(false);
      return;
    }

    await establishUserSession(supabase, userId, navigator.userAgent);

    clearSignupStageLocal();
    setUploadProgress(null);
    setIsSubmitting(false);
    window.location.href = "/dashboard/nurse";
  }

  async function handleTermsAccepted() {
    const acceptedUserId = await resolveAuthUserId(supabase, null);
    if (!acceptedUserId) {
      setStatus("Your session expired. Please sign up again from step 1.");
      setShowTermsModal(false);
      setTermsPendingUserId(null);
      await resetSignupAuthState();
      setStep(1);
      return;
    }
    recordTermsAcceptanceForUser(acceptedUserId);
    setTermsAccepted(true);
    setSignupUserId(acceptedUserId);
    saveSignupUserId(acceptedUserId);
    setShowTermsModal(false);
    setTermsPendingUserId(null);
    if (step === 1) {
      setStep(2);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillEmail = params.get("email");
    if (prefillEmail) {
      credentialsForm.setValue("email", prefillEmail);
    }
  }, [credentialsForm]);

  useEffect(() => {
    async function restoreSignupSession() {
      const userId = await resolveAuthUserId(supabase, null);
      clearSignupStageIfStale(userId);
      if (userId) {
        setSignupUserId(userId);
        saveSignupUserId(userId);
        const hasTerms =
          hasAcceptedTermsForUser(userId) ||
          (await syncTermsAcceptanceFromProfile(supabase, userId));
        setTermsAccepted(hasTerms);
      }
      setAuthChecked(true);
    }
    restoreSignupSession();
  }, [supabase]);

  useEffect(() => {
    if (signupUserId) {
      saveSignupUserId(signupUserId);
    }
  }, [signupUserId]);

  useEffect(() => {
    async function redirectIfProfileComplete() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { role: existingRole } = await fetchProfileRole(supabase, auth.user.id);
      if (!existingRole) return;

      const destination = resolvePostLoginDestination(existingRole, null);
      if (destination) {
        clearSignupStageLocal();
        window.location.href = destination;
      }
    }

    redirectIfProfileComplete();
  }, [supabase]);

  useEffect(() => {
    if (!authChecked) return;

    async function restoreCachedStage() {
      const userId = await resolveAuthUserId(supabase, signupUserId);
      const storedStepRaw = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.step);
      const storedStep = storedStepRaw ? Number(storedStepRaw) : 1;

      if (storedStep > 1 && (!userId || !isSignupStageOwnedBy(userId))) {
        clearSignupStageLocal();
        setStep(1);
        setRole(null);
        return;
      }

      const storedRole = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.role);
      const storedEmail = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.email);
      const storedAuth = window.sessionStorage.getItem(SIGNUP_STAGE_KEYS.auth);
      const queryRole = new URLSearchParams(window.location.search).get("role");

      if (storedStepRaw) {
        if (!Number.isNaN(storedStep) && storedStep >= 1 && storedStep <= SIGNUP_TOTAL_STEPS) {
          setStep(storedStep);
        }
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
    }

    void restoreCachedStage();
  }, [authChecked, credentialsForm, roleForm, signupUserId, supabase]);

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
            <TurnstileWidget
              className="flex justify-center"
              onToken={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              loadingText="Creating account..."
              className="w-full"
              disabled={turnstileRequired && !captchaToken}
            >
              Continue
            </LoadingButton>
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
            <LoadingButton type="submit" loading={isSavingRole} loadingText="Saving..." className="w-full">
              Continue
            </LoadingButton>
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
                {familyForm.formState.errors.firstName ? (
                  <p className="text-xs text-rose-600">{familyForm.formState.errors.firstName.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                {optionalLabel("Middle name (optional)")}
                <Input
                  placeholder="Middle name"
                  {...familyForm.register("middleName")}
                  className={familyForm.formState.errors.middleName ? "border-rose-500 focus:ring-rose-500" : undefined}
                />
                {familyForm.formState.errors.middleName ? (
                  <p className="text-xs text-rose-600">{familyForm.formState.errors.middleName.message}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              {requiredLabel("Last name", !!familyForm.formState.errors.lastName)}
              <Input
                placeholder="Last name"
                {...familyForm.register("lastName")}
                className={familyForm.formState.errors.lastName ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
              {familyForm.formState.errors.lastName ? (
                <p className="text-xs text-rose-600">{familyForm.formState.errors.lastName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              {optionalLabel("Suffix (optional)")}
              <Select {...familyForm.register("nameSuffix")}>
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
              {optionalLabel("Phone (optional)")}
              <Input
                placeholder="09XXXXXXXXX"
                inputMode="numeric"
                maxLength={11}
                {...familyForm.register("phone")}
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 11);
                }}
              />
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
              {familyForm.formState.errors.barangay ? (
                <p className="text-xs text-rose-600">{familyForm.formState.errors.barangay.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              {requiredLabel("Home address", !!familyForm.formState.errors.address)}
              <Textarea
                placeholder="Street, building, unit number"
                {...familyForm.register("address")}
                className={familyForm.formState.errors.address ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
              {familyForm.formState.errors.address ? (
                <p className="text-xs text-rose-600">{familyForm.formState.errors.address.message}</p>
              ) : null}
            </div>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              loadingText="Setting up your account..."
              className="w-full"
            >
              Create account
            </LoadingButton>
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
                {nurseForm.formState.errors.firstName ? (
                  <p className="text-xs text-rose-600">{nurseForm.formState.errors.firstName.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                {optionalLabel("Middle name (optional)")}
                <Input placeholder="Middle name" {...nurseForm.register("middleName")} />
                {nurseForm.formState.errors.middleName ? (
                  <p className="text-xs text-rose-600">{nurseForm.formState.errors.middleName.message}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              {requiredLabel("Last name", !!nurseForm.formState.errors.lastName)}
              <Input
                placeholder="Last name"
                {...nurseForm.register("lastName")}
                className={nurseForm.formState.errors.lastName ? "border-rose-500 focus:ring-rose-500" : undefined}
              />
              {nurseForm.formState.errors.lastName ? (
                <p className="text-xs text-rose-600">{nurseForm.formState.errors.lastName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              {optionalLabel("Suffix (optional)")}
              <Select {...nurseForm.register("nameSuffix")}>
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
            {nurseForm.formState.errors.barangay ? (
              <p className="text-xs text-rose-600">{nurseForm.formState.errors.barangay.message}</p>
            ) : null}
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
            <Textarea
              placeholder="Bio"
              className={nurseForm.formState.errors.bio ? "border-rose-500 focus:ring-rose-500" : undefined}
              {...nurseForm.register("bio")}
            />
            {nurseForm.formState.errors.bio ? (
              <p className="text-xs text-rose-600">{nurseForm.formState.errors.bio.message}</p>
            ) : null}
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
            {nurseForm.watch("providerType") === "nurse" ? (
              <div className="space-y-1">
                {requiredLabel("PRC License Number", !!nurseForm.formState.errors.prcLicenseNo)}
                <Input
                  placeholder="7-digit number"
                  inputMode="numeric"
                  maxLength={7}
                  autoComplete="off"
                  {...nurseForm.register("prcLicenseNo")}
                  className={
                    nurseForm.formState.errors.prcLicenseNo ? "border-rose-500 focus:ring-rose-500" : undefined
                  }
                  onInput={(event) => {
                    event.currentTarget.value = normalizePrcLicenseInput(event.currentTarget.value);
                  }}
                />
                <p className="text-xs text-slate-500">
                  You can find this on your PRC ID card, usually a 7-digit number.
                </p>
                {nurseForm.formState.errors.prcLicenseNo ? (
                  <p className="text-xs text-rose-600">{nurseForm.formState.errors.prcLicenseNo.message}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1">
                {requiredLabel("TESDA Certificate Number", !!nurseForm.formState.errors.tesdaCertificateNo)}
                <Input
                  placeholder="Certificate number"
                  autoComplete="off"
                  {...nurseForm.register("tesdaCertificateNo")}
                  className={
                    nurseForm.formState.errors.tesdaCertificateNo
                      ? "border-rose-500 focus:ring-rose-500"
                      : undefined
                  }
                />
                <p className="text-xs text-slate-500">
                  You can find this on your TESDA NC II certificate.
                </p>
                {nurseForm.formState.errors.tesdaCertificateNo ? (
                  <p className="text-xs text-rose-600">
                    {nurseForm.formState.errors.tesdaCertificateNo.message}
                  </p>
                ) : null}
              </div>
            )}
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
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              loadingText="Uploading documents..."
              className="w-full"
            >
              Create account
            </LoadingButton>
            {uploadProgress ? (
              <p className="text-center text-xs text-text-secondary">{uploadProgress}</p>
            ) : null}
          </form>
        ) : null}

        {status ? <p className="text-sm text-rose-600">{status}</p> : null}
        <p className="text-xs text-text-muted">
          By continuing you agree to our{" "}
          <button
            type="button"
            className="legal-inline-link"
            onClick={() => setShowTermsModal(true)}
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="legal-inline-link"
            onClick={() => setShowTermsModal(true)}
          >
            Privacy Policy
          </button>
          .
        </p>
      </div>

      <TermsAcceptanceModal
        open={showTermsModal}
        alreadyAccepted={termsAccepted}
        onAccept={handleTermsAccepted}
        onClose={() => {
          setShowTermsModal(false);
          setTermsPendingUserId(null);
        }}
      />
    </main>
  );
}
