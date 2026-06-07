"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PH_CITIES, PH_REGIONS } from "@/lib/ph-locations";
import { Select } from "@/components/ui/select";

export default function FamilyProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const form = useForm({
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      region: "",
      city: "",
      barangay: "",
      address: ""
    }
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name, full_name, phone, region, city, barangay, address")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const nameParts = profile.full_name?.split(" ") ?? [];
        form.reset({
          firstName: profile.first_name ?? nameParts[0] ?? "",
          middleName: profile.middle_name ?? "",
          lastName: profile.last_name ?? nameParts.slice(1).join(" ") ?? "",
          phone: profile.phone ?? "",
          region: profile.region ?? "",
          city: profile.city ?? "",
          barangay: profile.barangay ?? "",
          address: profile.address ?? ""
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, [form, supabase]);

  async function handleSubmit(values: {
    firstName: string;
    middleName?: string;
    lastName: string;
    phone?: string;
    region: string;
    city: string;
    barangay: string;
    address: string;
  }) {
    setSaved(false);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const fullName = [values.firstName, values.middleName, values.lastName]
      .filter((item) => item && item.trim().length > 0)
      .join(" ");

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      first_name: values.firstName,
      middle_name: values.middleName || null,
      last_name: values.lastName,
      phone: values.phone || null,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address,
      role: "family"
    });

    await supabase.from("families").upsert({
      id: user.id,
      address: values.address
    });

    setSaved(true);
  }

  if (loading) {
    return (
      <main className="px-5 py-8">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <Skeleton className="h-8 w-1/2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Family profile</h1>
          <p className="text-sm text-slate-600">Update your contact and location details.</p>
        </div>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...form.register("firstName")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="middleName">Middle name (optional)</Label>
              <Input id="middleName" {...form.register("middleName")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...form.register("lastName")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="09XX XXX XXXX" {...form.register("phone")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="region">Region</Label>
            <Select id="region" {...form.register("region")}>
              <option value="">Select region</option>
              {PH_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <Select id="city" {...form.register("city")}>
              <option value="">Select city</option>
              {PH_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="barangay">Barangay</Label>
            <Input id="barangay" {...form.register("barangay")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Home address</Label>
            <Textarea id="address" {...form.register("address")} />
          </div>
          {saved ? (
            <p className="text-sm text-emerald-700">Profile saved successfully.</p>
          ) : null}
          <Button type="submit">Save changes</Button>
        </form>
      </div>
    </main>
  );
}
