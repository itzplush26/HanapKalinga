"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { authSchema, roleSchema } from "@/lib/validations/auth";
import { familyProfileSchema, nurseProfileSchema } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"family" | "nurse" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
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
      fullName: "",
      phone: "",
      city: "",
      barangay: "",
      patientName: "",
      patientAge: 0,
      patientCondition: "",
      address: ""
    }
  });

  const nurseForm = useForm({
    resolver: zodResolver(nurseProfileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      city: "",
      barangay: "",
      specializations: [""],
      yearsExperience: 0,
      bio: "",
      hourlyRate: 0,
      dailyRate12hr: 0
    }
  });

  async function handleAuthSubmit(values: any) {
    setStatus(null);
    if (step === 1) {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { shouldCreateUser: true }
      });
      if (error) {
        setStatus(error.message);
        return;
      }
      setEmail(values.email);
      setStep(2);
      setStatus("Check your email for the 6-digit code.");
      return;
    }

    if (step === 2 && values.token) {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: values.token,
        type: "email"
      });
      if (error) {
        setStatus(error.message);
        return;
      }
      setStep(3);
      setStatus(null);
    }
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

    const profilePayload = {
      id: user.id,
      role,
      full_name: values.fullName,
      phone: values.phone,
      city: values.city,
      barangay: values.barangay
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
          <p className="text-sm text-slate-600">Step {step} of 3</p>
        </div>

        {step <= 2 ? (
          <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4">
            {step === 1 ? (
              <Input placeholder="you@email.com" {...authForm.register("email")} />
            ) : (
              <Input placeholder="6-digit code" maxLength={6} {...authForm.register("token")} />
            )}
            <Button type="submit">{step === 1 ? "Send code" : "Verify code"}</Button>
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
            <Input placeholder="Full name" {...familyForm.register("fullName")} />
            <Input placeholder="Phone" {...familyForm.register("phone")} />
            <Input placeholder="City" {...familyForm.register("city")} />
            <Input placeholder="Barangay" {...familyForm.register("barangay")} />
            <Input placeholder="Patient name" {...familyForm.register("patientName")} />
            <Input type="number" placeholder="Patient age" {...familyForm.register("patientAge", { valueAsNumber: true })} />
            <Input placeholder="Patient condition" {...familyForm.register("patientCondition")} />
            <Textarea placeholder="Address" {...familyForm.register("address")} />
            <Button type="submit">Finish</Button>
          </form>
        ) : null}

        {step === 4 && role === "nurse" ? (
          <form onSubmit={nurseForm.handleSubmit(handleProfileSubmit)} className="space-y-3">
            <Input placeholder="Full name" {...nurseForm.register("fullName")} />
            <Input placeholder="Phone" {...nurseForm.register("phone")} />
            <Input placeholder="City" {...nurseForm.register("city")} />
            <Input placeholder="Barangay" {...nurseForm.register("barangay")} />
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
      </div>
    </main>
  );
}
