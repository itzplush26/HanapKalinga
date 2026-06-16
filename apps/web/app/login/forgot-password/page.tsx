"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordRequestSchema } from "@/lib/validations/auth";
import { mapSupabaseError } from "@/lib/user-errors";
import { LoadingButton } from "@/components/ui/loading-button";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Input } from "@/components/ui/input";

type ForgotPasswordValues = z.infer<typeof resetPasswordRequestSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email: "" }
  });

  async function handleSubmit(values: ForgotPasswordValues) {
    setMessage(null);
    setIsSubmitting(true);

    if (turnstileRequired && !captchaToken) {
      setMessage("Please complete the verification challenge.");
      setIsSubmitting(false);
      return;
    }

    const email = values.email.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken: captchaToken ?? undefined
    });

    setIsSubmitting(false);

    if (error) {
      const lowered = error.message.toLowerCase();
      if (lowered.includes("captcha") || lowered.includes("turnstile")) {
        setMessage("Verification failed. Please try again.");
        setCaptchaToken(null);
      } else {
        setMessage(mapSupabaseError(error, "password"));
      }
      return;
    }

    router.push(`/login/update-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-slate-600">
            Enter your email and we will send you a 6-digit code to reset your password.
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
            loadingText="Sending code..."
            disabled={turnstileRequired && !captchaToken}
          >
            Send reset code
          </LoadingButton>
        </form>

        {message ? <p className="text-sm text-rose-600">{message}</p> : null}

        <p className="text-center text-xs text-slate-500">
          <Link href="/login" className="underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
