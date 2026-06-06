"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordRequestSchema } from "@/lib/validations/auth";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { mapSupabaseError } from "@/lib/user-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ForgotPasswordValues = z.infer<typeof resetPasswordRequestSchema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email: "" }
  });

  async function handleSubmit(values: ForgotPasswordValues) {
    setMessage(null);
    setIsSubmitting(true);

    const redirectTo = getAuthCallbackUrl("/login/update-password");

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(mapSupabaseError(error, "password"));
      return;
    }

    setSent(true);
    setMessage("If an account exists for that email, we sent a password reset link.");
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-slate-600">
            Enter your email and we will send you a link to choose a new password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {message}
          </div>
        ) : (
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}

        {message && !sent ? <p className="text-sm text-slate-600">{message}</p> : null}

        <p className="text-center text-xs text-slate-500">
          <Link href="/login" className="underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
