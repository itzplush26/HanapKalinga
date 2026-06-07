"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { passwordSetupSchema } from "@/lib/validations/auth";
import { mapSupabaseError } from "@/lib/user-errors";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

type UpdatePasswordValues = z.infer<typeof passwordSetupSchema>;

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setReady(true);
        return;
      }
      setMessage("Reset link expired or invalid. Request a new link.");
    }
    checkSession();
  }, [supabase]);

  async function handleSubmit(values: UpdatePasswordValues) {
    setMessage(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password: values.password });

    setIsSubmitting(false);

    if (error) {
      setMessage(mapSupabaseError(error, "password"));
      return;
    }

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
          <h1 className="text-2xl font-semibold">Set new password</h1>
          <p className="text-sm text-slate-600">Choose a new password for your account.</p>
        </div>

        {ready ? (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update password"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">{message ?? "Checking reset link..."}</p>
        )}

        <p className="text-center text-xs text-slate-500">
          <Link href="/login/forgot-password" className="underline">
            Request a new reset link
          </Link>
        </p>
      </div>
    </main>
  );
}
