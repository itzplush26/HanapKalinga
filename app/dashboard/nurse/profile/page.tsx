"use client";

import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploader } from "@/components/document-uploader";

export default function NurseProfilePage() {
  const supabase = createClient();
  const form = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      city: "",
      barangay: "",
      specializations: "",
      yearsExperience: 0,
      bio: "",
      hourlyRate: 0,
      dailyRate12hr: 0,
      prc_document_url: "",
      nbi_document_url: ""
    }
  });

  async function handleSubmit(values: any) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: values.fullName,
      phone: values.phone,
      city: values.city,
      barangay: values.barangay,
      role: "nurse"
    });

    await supabase.from("nurses").upsert({
      id: user.id,
      specializations: values.specializations.split(",").map((item: string) => item.trim()),
      years_experience: values.yearsExperience,
      bio: values.bio,
      hourly_rate: values.hourlyRate,
      daily_rate_12hr: values.dailyRate12hr,
      prc_document_url: values.prc_document_url,
      nbi_document_url: values.nbi_document_url
    });
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Nurse profile</h1>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          <Input placeholder="Full name" {...form.register("fullName")} />
          <Input placeholder="Phone" {...form.register("phone")} />
          <Input placeholder="City" {...form.register("city")} />
          <Input placeholder="Barangay" {...form.register("barangay")} />
          <Input placeholder="Specializations (comma separated)" {...form.register("specializations")} />
          <Input type="number" placeholder="Years experience" {...form.register("yearsExperience", { valueAsNumber: true })} />
          <Textarea placeholder="Bio" {...form.register("bio")} />
          <Input type="number" placeholder="Hourly rate" {...form.register("hourlyRate", { valueAsNumber: true })} />
          <Input type="number" placeholder="Daily rate (12 hr)" {...form.register("dailyRate12hr", { valueAsNumber: true })} />
          <DocumentUploader
            label="PRC License"
            pathPrefix="prc"
            onUploaded={(url) => form.setValue("prc_document_url", url)}
          />
          <DocumentUploader
            label="NBI Clearance"
            pathPrefix="nbi"
            onUploaded={(url) => form.setValue("nbi_document_url", url)}
          />
          <Button type="submit">Save</Button>
        </form>
      </div>
    </main>
  );
}
