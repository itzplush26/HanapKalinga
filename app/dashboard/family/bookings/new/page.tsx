"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { bookingRequestSchema } from "@/lib/validations/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function BookingForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const defaultNurse = searchParams.get("nurse") ?? "";

  const form = useForm({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      nurseId: defaultNurse,
      requestedDate: "",
      shift: "morning",
      notes: ""
    }
  });

  async function handleSubmit(values: any) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    await supabase.from("bookings").insert({
      family_id: user.id,
      nurse_id: values.nurseId,
      requested_date: values.requestedDate,
      shift: values.shift,
      notes: values.notes
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      <Input placeholder="Nurse ID" {...form.register("nurseId")} />
      <Input type="date" {...form.register("requestedDate")} />
      <Select {...form.register("shift")}>
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
        <option value="evening">Evening</option>
        <option value="full_day">Full day</option>
      </Select>
      <Textarea placeholder="Notes" {...form.register("notes")} />
      <Button type="submit">Send request</Button>
    </form>
  );
}

export default function NewBookingPage() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Request a booking</h1>
        <Suspense fallback={<p className="text-sm text-slate-600">Loading form...</p>}>
          <BookingForm />
        </Suspense>
      </div>
    </main>
  );
}
