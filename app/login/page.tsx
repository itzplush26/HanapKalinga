"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { authSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormValues = {
  email: string;
  token?: string;
};

const LOGIN_STEP_KEY = "nurselink.login.step";
const LOGIN_EMAIL_KEY = "nurselink.login.email";

export default function LoginPage() {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const supabase = createClient();
  const safeRedirect = useMemo(() => {
    if (!redirectTarget) return null;
    if (!redirectTarget.startsWith("/")) return null;
    if (redirectTarget.startsWith("//")) return null;
    return redirectTarget;
  }, [redirectTarget]);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      token: ""
    }
  });

  useEffect(() => {
    const queryRedirect = new URLSearchParams(window.location.search).get("redirect");
    setRedirectTarget(queryRedirect);

    const storedStep = window.sessionStorage.getItem(LOGIN_STEP_KEY);
    const storedEmail = window.sessionStorage.getItem(LOGIN_EMAIL_KEY);
    if (storedStep === "send" || storedStep === "verify") {
      setStep(storedStep);
    }
    if (storedEmail) {
      setEmail(storedEmail);
      form.setValue("email", storedEmail);
    }
  }, [form]);

  useEffect(() => {
    window.sessionStorage.setItem(LOGIN_STEP_KEY, step);
  }, [step]);

  useEffect(() => {
    if (email) window.sessionStorage.setItem(LOGIN_EMAIL_KEY, email);
  }, [email]);

  function clearLoginStage() {
    window.sessionStorage.removeItem(LOGIN_STEP_KEY);
    window.sessionStorage.removeItem(LOGIN_EMAIL_KEY);
  }

  async function handleSubmit(values: AuthFormValues) {
    setMessage(null);
    setIsSubmitting(true);

    if (step === "send") {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: { shouldCreateUser: true }
        });
        if (error) {
          console.error("login.send_code.error", error);
          setMessage(error.message);
          setIsSubmitting(false);
          return;
        }
        console.info("login.send_code.success", data);
      } catch (error) {
        console.error("login.send_code.exception", error);
        setMessage("Unexpected error sending code.");
        setIsSubmitting(false);
        return;
      }
      setEmail(values.email);
      setStep("verify");
      setMessage("Enter the 6-digit code sent to your email.");
      setIsSubmitting(false);
      return;
    }

    if (step === "verify" && values.token) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: values.token,
          type: "email"
        });
        if (error) {
          console.error("login.verify_code.error", error);
          setMessage(error.message);
          setIsSubmitting(false);
          return;
        }
        console.info("login.verify_code.success", data);
        clearLoginStage();
        if (safeRedirect) {
          window.location.href = safeRedirect;
          return;
        }
        const userId = data?.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle();
          if (profile?.role === "family") {
            window.location.href = "/dashboard/family";
            return;
          }
          if (profile?.role === "nurse") {
            window.location.href = "/dashboard/nurse";
            return;
          }
        }
        setMessage("No profile yet. Redirecting to registration...");
        setIsSubmitting(false);
        window.location.href = "/register";
      } catch (error) {
        console.error("login.verify_code.exception", error);
        setMessage("Unexpected error verifying code.");
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(false);
  }

  async function handleResend() {
    if (!email) return;
    setMessage(null);
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) {
        console.error("login.resend_code.error", error);
      } else {
        console.info("login.resend_code.success", data);
      }
      setMessage(error ? error.message : "Code resent. Check your email.");
    } catch (error) {
      console.error("login.resend_code.exception", error);
      setMessage("Unexpected error resending code.");
    }
    setIsSubmitting(false);
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-slate-600">Email OTP (6-digit code).</p>
          {safeRedirect ? (
            <p className="mt-1 text-xs text-slate-500">Sign in to continue to your requested page.</p>
          ) : null}
        </div>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {step === "send" ? (
            <div className="space-y-2">
              <Input placeholder="you@email.com" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-rose-600">Enter a valid email address.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Input placeholder="6-digit code" maxLength={6} {...form.register("token")} />
              {form.formState.errors.token ? (
                <p className="text-xs text-rose-600">Enter the 6-digit code.</p>
              ) : null}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : step === "send" ? "Send code" : "Verify code"}
          </Button>
          {step === "verify" ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-brand-700 underline"
              disabled={isSubmitting}
            >
              Resend code
            </button>
          ) : null}
        </form>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}
