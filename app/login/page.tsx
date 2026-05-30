"use client";

import { useState } from "react";
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

export default function LoginPage() {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const supabase = createClient();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      token: ""
    }
  });

  async function handleSubmit(values: AuthFormValues) {
    setMessage(null);

    if (step === "send") {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { shouldCreateUser: false }
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setEmail(values.email);
      setStep("verify");
      setMessage("Enter the 6-digit code sent to your email.");
      return;
    }

    if (step === "verify" && values.token) {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: values.token,
        type: "email"
      });
      setMessage(error ? error.message : "Signed in. Redirecting...");
      if (!error) {
        window.location.href = "/dashboard";
      }
    }
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-slate-600">Email OTP (6-digit code).</p>
        </div>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {step === "send" ? (
            <Input placeholder="you@email.com" {...form.register("email")} />
          ) : (
            <Input placeholder="6-digit code" maxLength={6} {...form.register("token")} />
          )}
          <Button type="submit">{step === "send" ? "Send code" : "Verify code"}</Button>
        </form>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}
