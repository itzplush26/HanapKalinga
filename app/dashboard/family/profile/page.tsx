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
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      region: "",
      city: "",
      barangay: "",
      address: "",
      contactPersonName: "",
      relationshipToPatient: "",
      patientName: "",
      patientAge: 0,
      patientCondition: ""
    }
  });

  async function handleSubmit(values: any) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const fullName = [values.firstName, values.middleName, values.lastName]
      .filter((item: string) => item && item.trim().length > 0)
      .join(" ");

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      first_name: values.firstName,
      middle_name: values.middleName || null,
      last_name: values.lastName,
      phone: values.phone,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address,
      role: "family"
    });

    await supabase.from("families").upsert({
      id: user.id,
      contact_person_name: values.contactPersonName,
      relationship_to_patient: values.relationshipToPatient,
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
          <Input placeholder="First name" {...form.register("firstName")} />
          <Input placeholder="Middle name (optional)" {...form.register("middleName")} />
          <Input placeholder="Last name" {...form.register("lastName")} />
          <Input placeholder="Phone" {...form.register("phone")} />
          <Input placeholder="Region" {...form.register("region")} />
          <Input placeholder="City" {...form.register("city")} />
          <Input placeholder="Barangay" {...form.register("barangay")} />
          <Textarea placeholder="Home address" {...form.register("address")} />
          <Input placeholder="Family contact person" {...form.register("contactPersonName")} />
          <Input placeholder="Relationship to patient (e.g. son, daughter, spouse)" {...form.register("relationshipToPatient")} />
          <Input placeholder="Patient name" {...form.register("patientName")} />
          <Input type="number" placeholder="Patient age" {...form.register("patientAge", { valueAsNumber: true })} />
          <Input placeholder="Patient condition" {...form.register("patientCondition")} />
          <Button type="submit">Save</Button>
        </form>
      </div>
    </main>
  );
}
