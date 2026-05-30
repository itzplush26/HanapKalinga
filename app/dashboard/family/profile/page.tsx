"use client";

import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FamilyProfilePage() {
  const supabase = createClient();
  const form = useForm({
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
      role: "family"
    });

    await supabase.from("families").upsert({
      id: user.id,
      patient_name: values.patientName,
      patient_age: values.patientAge,
      patient_condition: values.patientCondition,
      address: values.address
    });
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Family profile</h1>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          <Input placeholder="Full name" {...form.register("fullName")} />
          <Input placeholder="Phone" {...form.register("phone")} />
          <Input placeholder="City" {...form.register("city")} />
          <Input placeholder="Barangay" {...form.register("barangay")} />
          <Input placeholder="Patient name" {...form.register("patientName")} />
          <Input type="number" placeholder="Patient age" {...form.register("patientAge", { valueAsNumber: true })} />
          <Input placeholder="Patient condition" {...form.register("patientCondition")} />
          <Textarea placeholder="Address" {...form.register("address")} />
          <Button type="submit">Save</Button>
        </form>
      </div>
    </main>
  );
}
