"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { getPostLoginPath, parseSafeRedirect } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const supabase = createClient();

  const safeRedirect = useMemo(() => parseSafeRedirect(redirectTarget), [redirectTarget]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTarget(params.get("redirect"));
    if (params.get("error") === "auth_callback") {
      setMessage("Sign-in link expired or invalid. Try again or log in with your password.");
    }
  }, []);

  async function handleSubmit(values: LoginFormValues) {
    setMessage(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        setMessage(
          error.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : error.message
        );
        setIsSubmitting(false);
        return;
      }

      const userId = data.user?.id;
      let role: string | null = null;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        role = profile?.role ?? null;
      }

      window.location.href = getPostLoginPath(role, safeRedirect);
    } catch {
      setMessage("Unexpected error signing in.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-slate-600">Sign in with your email and password.</p>
          {safeRedirect ? (
            <p className="mt-1 text-xs text-slate-500">Sign in to continue to your requested page.</p>
          ) : null}
        </div>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input placeholder="you@email.com" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-xs text-rose-600">Enter a valid email address.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Log in"}
          </Button>
        </form>
        <p className="text-center text-xs text-slate-500">
          <Link href="/login/forgot-password" className="underline">
            Forgot password?
          </Link>
        </p>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
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
