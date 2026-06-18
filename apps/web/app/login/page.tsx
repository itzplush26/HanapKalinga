"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { parseSafeRedirect } from "@/lib/auth-redirect";
import { resolvePostLoginDestination } from "@/lib/post-auth";
import type { ProfileRole } from "@/lib/post-auth";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import { mapSupabaseError } from "@/lib/user-errors";
import { establishUserSession } from "@/lib/session-lock";
import { LoadingButton } from "@/components/ui/loading-button";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

type LoginFormValues = z.infer<typeof loginSchema>;

const emailStepSchema = z.object({
  email: z.string().email()
});

type EmailStepValues = z.infer<typeof emailStepSchema>;

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [sessionConflict, setSessionConflict] = useState(false);
  const [sessionConflictDismissed, setSessionConflictDismissed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const supabase = createClient();

  const safeRedirect = useMemo(() => parseSafeRedirect(redirectTarget), [redirectTarget]);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: "" }
  });

  const passwordForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTarget(params.get("redirect"));
    const prefillEmail = params.get("email");
    if (prefillEmail) {
      emailForm.setValue("email", prefillEmail);
    }
    if (params.get("error") === "auth_callback") {
      setMessage("Your sign-in link has expired or is invalid. Please log in with your password.");
    }
    if (params.get("error") === "no_profile") {
      setMessage(
        "We could not find a complete account profile for this user. Please contact support if you need help."
      );
    }
    if (params.get("reason") === "session_conflict") {
      setSessionConflict(true);
      setSessionConflictDismissed(false);
    }
    if (params.get("suspended") === "true") {
      setMessage(`Your account has been suspended. Please contact support at ${SUPPORT_EMAIL}.`);
    }
  }, [emailForm]);

  async function handleEmailStep(values: EmailStepValues) {
    setMessage(null);
    setEmailNotFound(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.trim() })
      });

      const payload = (await response.json()) as {
        exists?: boolean | null;
        rateLimited?: boolean;
        message?: string;
        error?: string;
      };

      if (response.status === 429 || payload.rateLimited) {
        setMessage(payload.message ?? "Too many attempts. Please try again in a few minutes.");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        setMessage(payload.error ?? "Could not continue. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (!payload.exists) {
        setEmailNotFound(true);
        setIsSubmitting(false);
        return;
      }

      const email = values.email.trim();
      setConfirmedEmail(email);
      passwordForm.setValue("email", email);
      setStep(2);
      setCaptchaToken(null);
      setIsSubmitting(false);
    } catch {
      setMessage("Could not continue. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handlePasswordStep(values: LoginFormValues) {
    setMessage(null);
    setIsSubmitting(true);

    if (turnstileRequired && !captchaToken) {
      setMessage("Please complete the verification challenge.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
        options: captchaToken ? { captchaToken } : undefined
      });

      if (error) {
        const lowered = error.message.toLowerCase();
        if (lowered.includes("captcha") || lowered.includes("turnstile")) {
          setMessage("Verification failed. Please try again.");
          setCaptchaToken(null);
        } else {
          setMessage("Incorrect password. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setMessage("Sign-in did not complete. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const profileAccessResponse = await fetch("/api/auth/profile-access");
      const profileAccessPayload = (await profileAccessResponse.json().catch(() => null)) as
        | { role?: ProfileRole | null; suspended?: boolean; error?: string }
        | null;

      if (!profileAccessResponse.ok) {
        setMessage(profileAccessPayload?.error ?? mapSupabaseError(null, "profile"));
        setIsSubmitting(false);
        return;
      }

      const role = profileAccessPayload?.role ?? null;
      const suspended = Boolean(profileAccessPayload?.suspended);

      if (suspended) {
        await supabase.auth.signOut();
        setMessage(`Your account has been suspended. Please contact support at ${SUPPORT_EMAIL}.`);
        setIsSubmitting(false);
        return;
      }

      await establishUserSession(
        supabase,
        userId,
        typeof navigator !== "undefined" ? navigator.userAgent : undefined
      );

      const destination = resolvePostLoginDestination(role, safeRedirect);

      if (!destination) {
        setMessage(
          `Your sign-in succeeded, but your ${APP_NAME} profile is not set up yet. Please complete registration or contact support.`
        );
        setIsSubmitting(false);
        return;
      }

      window.location.href = destination;
    } catch {
      setMessage(mapSupabaseError(null, "auth"));
      setIsSubmitting(false);
    }
  }

  function resetToEmailStep() {
    setStep(1);
    setConfirmedEmail("");
    setEmailNotFound(false);
    setMessage(null);
    setCaptchaToken(null);
    passwordForm.reset({ email: emailForm.getValues("email"), password: "" });
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        {sessionConflict && !sessionConflictDismissed ? (
          <div className="flex items-start gap-3 rounded-2xl border border-warning-border bg-warning-bg p-4 text-sm text-warning">
            <Lock className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p>
                Your account is currently active on another device. You have been signed out for your security.
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-medium underline"
                onClick={() => setSessionConflictDismissed(true)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-slate-600">Sign in to {APP_NAME} with your email and password.</p>
          {safeRedirect ? (
            <p className="mt-1 text-xs text-slate-500">Sign in to continue to your requested page.</p>
          ) : null}
        </div>

        {step === 1 ? (
          <form onSubmit={emailForm.handleSubmit(handleEmailStep)} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="you@email.com"
                type="email"
                autoComplete="email"
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email ? (
                <p className="text-xs text-rose-600">Enter a valid email address.</p>
              ) : null}
              {emailNotFound ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">We couldn&apos;t find an account with this email.</p>
                  <Button asChild className="w-full">
                    <Link
                      href={`/register?email=${encodeURIComponent(emailForm.getValues("email").trim())}`}
                    >
                      Create an account
                    </Link>
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-xs text-slate-600 underline"
                    onClick={() => {
                      emailForm.reset({ email: "" });
                      setEmailNotFound(false);
                    }}
                  >
                    Try a different email
                  </button>
                </div>
              ) : null}
            </div>
            <LoadingButton
              type="submit"
              className="w-full"
              loading={isSubmitting}
              loadingText="Checking..."
              disabled={emailNotFound}
            >
              Continue
            </LoadingButton>
          </form>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordStep)} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-900">{confirmedEmail}</span>
                <button type="button" className="text-xs text-brand-700 underline" onClick={resetToEmailStep}>
                  Change
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <PasswordInput
                placeholder="Password"
                autoComplete="current-password"
                {...passwordForm.register("password")}
              />
              {passwordForm.formState.errors.password ? (
                <p className="text-xs text-rose-600">{passwordForm.formState.errors.password.message}</p>
              ) : null}
            </div>
            <TurnstileWidget
              className="flex justify-center"
              onToken={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
            <LoadingButton
              type="submit"
              className="w-full"
              loading={isSubmitting}
              loadingText="Signing in..."
              disabled={turnstileRequired && !captchaToken}
            >
              Log in
            </LoadingButton>
            <p className="text-center text-xs text-slate-500">
              <Link href="/login/forgot-password" className="underline">
                Forgot your password?
              </Link>
            </p>
          </form>
        )}

        {message ? <p className="text-sm text-rose-600">{message}</p> : null}
        <p className="text-center text-xs text-slate-500">
          New here?{" "}
          <Link href="/register" className="underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
