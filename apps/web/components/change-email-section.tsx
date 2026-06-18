"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { emailChangeRequestSchema, emailChangeVerifySchema } from "@/lib/validations/auth";
import { mapSupabaseError } from "@/lib/user-errors";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";

type EmailChangeRequestValues = z.infer<typeof emailChangeRequestSchema>;
type EmailChangeVerifyValues = z.infer<typeof emailChangeVerifySchema>;

type ChangeEmailStep = "form" | "verify" | "done";

async function isEmailTakenByAnotherAccount(email: string): Promise<boolean | null> {
  const response = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { exists?: boolean; rateLimited?: boolean };
  if (payload.rateLimited) {
    return null;
  }

  return Boolean(payload.exists);
}

export function ChangeEmailSection() {
  const supabase = createClient();
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [step, setStep] = useState<ChangeEmailStep>("form");
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const requestForm = useForm<EmailChangeRequestValues>({
    resolver: zodResolver(emailChangeRequestSchema),
    defaultValues: { newEmail: "" }
  });

  const verifyForm = useForm<EmailChangeVerifyValues>({
    resolver: zodResolver(emailChangeVerifySchema),
    defaultValues: { newEmail: "", otp: "" }
  });

  const pendingNewEmail = verifyForm.watch("newEmail");

  useEffect(() => {
    async function loadCurrentEmail() {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? null;
      setCurrentEmail(email);
    }

    void loadCurrentEmail();
  }, [supabase]);

  async function handleSendCode(values: EmailChangeRequestValues) {
    setMessage(null);
    const newEmail = values.newEmail.trim().toLowerCase();
    const normalizedCurrent = currentEmail?.trim().toLowerCase() ?? "";

    if (newEmail === normalizedCurrent) {
      setMessage("That is already your current email address.");
      return;
    }

    setIsSending(true);

    const taken = await isEmailTakenByAnotherAccount(newEmail);
    if (taken === null) {
      setMessage("Could not verify that email right now. Please try again in a moment.");
      setIsSending(false);
      return;
    }

    if (taken) {
      setMessage("An account with this email already exists. Use a different email.");
      setIsSending(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    setIsSending(false);

    if (error) {
      console.error("profile.email_change.request", error);
      setMessage(mapSupabaseError(error, "email_change"));
      return;
    }

    verifyForm.reset({ newEmail, otp: "" });
    setStep("verify");
    setMessage(`A 6-digit code was sent to ${newEmail}. Enter it below to confirm your new email.`);
  }

  async function handleVerify(values: EmailChangeVerifyValues) {
    setMessage(null);
    setIsVerifying(true);

    const newEmail = values.newEmail.trim();
    const otp = values.otp.trim();

    const { error } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: otp,
      type: "email_change"
    });

    setIsVerifying(false);

    if (error) {
      console.error("profile.email_change.verify", error);
      setMessage(mapSupabaseError(error, "email_change"));
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    setCurrentEmail(authData.user?.email ?? newEmail);
    requestForm.reset({ newEmail: "" });
    verifyForm.reset({ newEmail: "", otp: "" });
    setStep("done");
    setMessage("Your email address was updated successfully.");
  }

  async function handleResendCode() {
    const newEmail = verifyForm.getValues("newEmail").trim();
    if (!newEmail) {
      setMessage("Enter a new email address first.");
      return;
    }

    setMessage(null);
    setIsResending(true);

    const { error } = await supabase.auth.resend({
      type: "email_change",
      email: newEmail
    });

    setIsResending(false);

    if (error) {
      console.error("profile.email_change.resend", error);
      setMessage(mapSupabaseError(error, "email_change"));
      return;
    }

    setMessage(`A new 6-digit code was sent to ${newEmail}.`);
  }

  function handleStartOver() {
    requestForm.reset({ newEmail: "" });
    verifyForm.reset({ newEmail: "", otp: "" });
    setStep("form");
    setMessage(null);
  }

  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <h2 className="text-base font-semibold text-text-primary">Email address</h2>
        <p className="text-sm text-text-secondary">
          Change the email you use to sign in. We will send a 6-digit code to your new address.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="currentEmail">Current email</Label>
          <Input
            id="currentEmail"
            type="email"
            value={currentEmail ?? ""}
            readOnly
            disabled
            className="bg-slate-50 text-slate-600"
          />
        </div>

        {step === "form" ? (
          <form onSubmit={requestForm.handleSubmit(handleSendCode)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newEmail">New email</Label>
              <Input
                id="newEmail"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                {...requestForm.register("newEmail")}
              />
              {requestForm.formState.errors.newEmail ? (
                <p className="text-xs text-rose-600">{requestForm.formState.errors.newEmail.message}</p>
              ) : null}
            </div>
            <LoadingButton
              type="submit"
              variant="outline"
              className="w-full"
              loading={isSending}
              loadingText="Sending code..."
            >
              Send verification code
            </LoadingButton>
          </form>
        ) : null}

        {step === "verify" ? (
          <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="verifyNewEmail">New email</Label>
              <Input id="verifyNewEmail" type="email" readOnly disabled {...verifyForm.register("newEmail")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="emailChangeOtp">Verification code</Label>
              <Input
                id="emailChangeOtp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                {...verifyForm.register("otp")}
              />
              {verifyForm.formState.errors.otp ? (
                <p className="text-xs text-rose-600">{verifyForm.formState.errors.otp.message}</p>
              ) : null}
            </div>
            <LoadingButton
              type="submit"
              className="w-full"
              loading={isVerifying}
              loadingText="Confirming..."
            >
              Confirm new email
            </LoadingButton>
            <div className="flex flex-col gap-2">
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
              <Button type="button" variant="ghost" size="sm" onClick={handleStartOver}>
                Use a different email
              </Button>
            </div>
          </form>
        ) : null}

        {step === "done" ? (
          <Button type="button" variant="outline" className="w-full" onClick={handleStartOver}>
            Change email again
          </Button>
        ) : null}

        {message ? (
          <p
            className={
              step === "done" ? "text-sm text-emerald-700" : "text-sm text-text-secondary"
            }
          >
            {message}
          </p>
        ) : null}

        {step === "verify" && pendingNewEmail ? (
          <p className="text-xs text-text-muted">
            If secure email change is enabled in your project, you may also need to confirm from your
            current inbox ({currentEmail ?? "current email"}).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
