"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { authSchema, roleSchema } from "@/lib/validations/auth";
import { familyProfileSchema, nurseProfileSchema } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploader } from "@/components/document-uploader";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"family" | "nurse" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const authForm = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", token: "" }
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
      phone: "",
      region: "",
      city: "",
      barangay: "",
      address: "",
      patientName: "",
      patientAge: 0,
      patientCondition: ""
    }
  });

  const nurseForm = useForm({
    resolver: zodResolver(nurseProfileSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      region: "",
      city: "",
      barangay: "",
      address: "",
      prcLicenseNo: "",
      specializations: [""],
      yearsExperience: 0,
      bio: "",
      hourlyRate: 0,
      dailyRate12hr: 0,
      profilePhotoUrl: "",
      nbiDocumentUrl: ""
    }
  });

  async function handleAuthSubmit(values: any) {
    setStatus(null);
    setIsSubmitting(true);
    if (step === 1) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: { shouldCreateUser: true }
        });
        if (error) {
          console.error("signup.send_code.error", error);
          setStatus(error.message);
          setIsSubmitting(false);
          return;
        }
        console.info("signup.send_code.success", data);
      } catch (error) {
        console.error("signup.send_code.exception", error);
        setStatus("Unexpected error sending code.");
        setIsSubmitting(false);
        return;
      }
      setEmail(values.email);
      setStep(2);
      setStatus("Check your email for the 6-digit code.");
      setIsSubmitting(false);
      return;
    }

    if (step === 2 && values.token) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: values.token,
          type: "email"
        });
        if (error) {
          console.error("signup.verify_code.error", error);
          setStatus(error.message);
          setIsSubmitting(false);
          return;
        }
        console.info("signup.verify_code.success", data);
      } catch (error) {
        console.error("signup.verify_code.exception", error);
        setStatus("Unexpected error verifying code.");
        setIsSubmitting(false);
        return;
      }
      setStep(3);
      setStatus(null);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  async function handleResend() {
    if (!email) return;
    setStatus(null);
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) {
        console.error("signup.resend_code.error", error);
      } else {
        console.info("signup.resend_code.success", data);
      }
      setStatus(error ? error.message : "Code resent. Check your email.");
    } catch (error) {
      console.error("signup.resend_code.exception", error);
      setStatus("Unexpected error resending code.");
    }
    setIsSubmitting(false);
  }

  async function handleRoleSubmit(values: any) {
    setRole(values.role);
    setStep(4);
  }

  async function handleProfileSubmit(values: any) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user || !role) {
      setStatus("Missing user or role.");
      return;
    }

    const fullName = [values.firstName, values.middleName, values.lastName]
      .filter((item: string) => item && item.trim().length > 0)
      .join(" ");

    const profilePayload = {
      id: user.id,
      role,
      full_name: fullName,
      first_name: values.firstName,
      middle_name: values.middleName || null,
      last_name: values.lastName,
      phone: values.phone,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address
    };

    await supabase.from("profiles").upsert(profilePayload);

    if (role === "family") {
      await supabase.from("families").upsert({
        id: user.id,
        patient_name: values.patientName,
        patient_age: values.patientAge,
        patient_condition: values.patientCondition,
        address: values.address
      });
    }

    if (role === "nurse") {
      await supabase.from("nurses").upsert({
        id: user.id,
        prc_license_no: values.prcLicenseNo,
        profile_photo_url: values.profilePhotoUrl,
        nbi_document_url: values.nbiDocumentUrl,
        specializations: values.specializations.filter(Boolean),
        years_experience: values.yearsExperience,
        bio: values.bio,
        hourly_rate: values.hourlyRate,
        daily_rate_12hr: values.dailyRate12hr
      });
    }

    setStatus("Profile created. You can now log in.");
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-slate-600">Step {step} of 4</p>
        </div>

        {step <= 2 ? (
          <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4">
            {step === 1 ? (
              <div className="space-y-2">
                <Input placeholder="you@email.com" {...authForm.register("email")} />
                {authForm.formState.errors.email ? (
                  <p className="text-xs text-rose-600">Enter a valid email address.</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Input placeholder="6-digit code" maxLength={6} {...authForm.register("token")} />
                {authForm.formState.errors.token ? (
                  <p className="text-xs text-rose-600">Enter the 6-digit code.</p>
                ) : null}
              </div>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : step === 1 ? "Send code" : "Verify code"}
            </Button>
            {step === 2 ? (
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
        ) : null}

        {step === 3 ? (
          <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4">
            <Select {...roleForm.register("role")}>
              <option value="family">Family</option>
              <option value="nurse">Nurse</option>
            </Select>
            <Button type="submit">Continue</Button>
          </form>
        ) : null}

        {step === 4 && role === "family" ? (
          <form onSubmit={familyForm.handleSubmit(handleProfileSubmit)} className="space-y-3">
            <Input placeholder="First name" {...familyForm.register("firstName")} />
            <Input placeholder="Middle name (optional)" {...familyForm.register("middleName")} />
            <Input placeholder="Last name" {...familyForm.register("lastName")} />
            <Input placeholder="Phone" {...familyForm.register("phone")} />
            <Input placeholder="Region" {...familyForm.register("region")} />
            <Input placeholder="City" {...familyForm.register("city")} />
            <Input placeholder="Barangay" {...familyForm.register("barangay")} />
            <Textarea placeholder="Home address" {...familyForm.register("address")} />
            <Input placeholder="Patient name" {...familyForm.register("patientName")} />
            <Input type="number" placeholder="Patient age" {...familyForm.register("patientAge", { valueAsNumber: true })} />
            <Input placeholder="Patient condition" {...familyForm.register("patientCondition")} />
            <Button type="submit">Finish</Button>
          </form>
        ) : null}

        {step === 4 && role === "nurse" ? (
          <form onSubmit={nurseForm.handleSubmit(handleProfileSubmit)} className="space-y-3">
            <Input placeholder="First name" {...nurseForm.register("firstName")} />
            <Input placeholder="Middle name (optional)" {...nurseForm.register("middleName")} />
            <Input placeholder="Last name" {...nurseForm.register("lastName")} />
            <Input placeholder="Phone" {...nurseForm.register("phone")} />
            <Input placeholder="Region" {...nurseForm.register("region")} />
            <Input placeholder="City" {...nurseForm.register("city")} />
            <Input placeholder="Barangay" {...nurseForm.register("barangay")} />
            <Textarea placeholder="Home address" {...nurseForm.register("address")} />
            <Input placeholder="PRC license number" {...nurseForm.register("prcLicenseNo")} />
            <DocumentUploader
              label="Profile photo"
              pathPrefix="profile-photo"
              onUploaded={(url) => nurseForm.setValue("profilePhotoUrl", url)}
            />
            <DocumentUploader
              label="NBI clearance"
              pathPrefix="nbi"
              onUploaded={(url) => nurseForm.setValue("nbiDocumentUrl", url)}
            />
            <Input
              placeholder="Specializations (comma separated)"
              onChange={(event) =>
                nurseForm.setValue(
                  "specializations",
                  event.target.value.split(",").map((value) => value.trim())
                )
              }
            />
            <Input type="number" placeholder="Years experience" {...nurseForm.register("yearsExperience", { valueAsNumber: true })} />
            <Textarea placeholder="Bio" {...nurseForm.register("bio")} />
            <Input type="number" placeholder="Hourly rate" {...nurseForm.register("hourlyRate", { valueAsNumber: true })} />
            <Input type="number" placeholder="Daily rate (12 hr)" {...nurseForm.register("dailyRate12hr", { valueAsNumber: true })} />
            <Button type="submit">Finish</Button>
          </form>
        ) : null}

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        <p className="text-xs text-slate-500">
          By continuing, you agree to the <Link href="/terms" className="underline">Terms of Service</Link> and
          <Link href="/privacy" className="underline"> Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
