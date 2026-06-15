"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { passwordResetCompleteSchema } from "@/lib/validations/auth";
import { mapSupabaseError } from "@/lib/user-errors";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type ResetPasswordValues = z.infer<typeof passwordResetCompleteSchema>;

function UpdatePasswordForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const initialEmail = searchParams.get("email") ?? "";

  const [message, setMessage] = useState<string | null>(
    initialEmail ? null : "Enter the email you used to request a reset code."
  );
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(passwordResetCompleteSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
      password: "",
      confirmPassword: ""
    }
  });

  async function handleResendCode() {
    const email = form.getValues("email").trim();
    if (!email) {
      setMessage("Enter your email address first.");
      return;
    }

    setMessage(null);
    setIsResending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setIsResending(false);

    if (error) {
      setMessage(mapSupabaseError(error, "password"));
      return;
    }

    setMessage("A new 6-digit code was sent if an account exists for that email.");
  }

  async function handleSubmit(values: ResetPasswordValues) {
    setMessage(null);
    setIsSubmitting(true);

    const email = values.email.trim();
    const otp = values.otp.trim();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery"
    });

    if (verifyError) {
      setMessage(mapSupabaseError(verifyError, "password"));
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password
    });

    setIsSubmitting(false);

    if (updateError) {
      setMessage(mapSupabaseError(updateError, "password"));
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setMessage("Password updated. You can log in with your new password.");
  }

  if (done) {
    return (
      <main className="px-5 py-8">
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <h1 className="text-2xl font-semibold">Password updated</h1>
          <p className="text-sm text-slate-600">{message}</p>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Enter reset code</h1>
          <p className="text-sm text-slate-600">
            Enter the 6-digit code from your email and choose a new password.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="you@email.com"
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-rose-600">Enter a valid email address.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Input
              placeholder="6-digit code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...form.register("otp")}
            />
            {form.formState.errors.otp ? (
              <p className="text-xs text-rose-600">{form.formState.errors.otp.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <PasswordInput
              placeholder="New password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <PasswordInput
              placeholder="Confirm password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-rose-600">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <LoadingButton type="submit" className="w-full" loading={isSubmitting} loadingText="Updating...">
            Update password
          </LoadingButton>
        </form>

        <div className="flex flex-col items-center gap-2 text-center text-xs text-slate-500">
          <LoadingButton
            type="button"
            variant="outline"
            size="sm"
            loading={isResending}
            loadingText="Sending..."
            onClick={() => void handleResendCode()}
          >
            Resend code
          </LoadingButton>
          <Link href="/login/forgot-password" className="underline">
            Request a new code
          </Link>
          <Link href="/login" className="underline">
            Back to log in
          </Link>
        </div>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="px-5 py-8">
          <p className="text-sm text-slate-600">Loading...</p>
        </main>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}
