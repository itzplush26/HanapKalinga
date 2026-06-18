"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { familyProfileSchema } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionCitySelects } from "@/components/region-city-selects";
import { PageHeader } from "@/components/page-header";
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { resolveProfileDisplayName } from "@/lib/profile-display";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { z } from "zod";
import { toTitleCase } from "@/lib/validation/format-name";

type FamilyProfileValues = z.infer<typeof familyProfileSchema>;

export default function FamilyProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [profilePhotoStored, setProfilePhotoStored] = useState<string | null>(null);
  const form = useForm<FamilyProfileValues>({
    resolver: zodResolver(familyProfileSchema),
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
        .select("first_name, middle_name, last_name, full_name, phone, region, city, barangay, address, profile_photo_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const nameParts = profile.full_name?.split(" ") ?? [];
        setProfilePhotoStored(profile.profile_photo_url ?? null);
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

  async function handleSubmit(values: FamilyProfileValues) {
    setSaved(false);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const normalizedFirstName = toTitleCase(values.firstName);
    const normalizedMiddleName = toTitleCase(values.middleName);
    const normalizedLastName = toTitleCase(values.lastName);
    const fullName = [normalizedFirstName, normalizedMiddleName, normalizedLastName]
      .filter((item) => item && item.trim().length > 0)
      .join(" ");

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      first_name: normalizedFirstName,
      middle_name: normalizedMiddleName || null,
      last_name: normalizedLastName,
      phone: values.phone || null,
      region: values.region,
      city: values.city,
      barangay: values.barangay,
      address: values.address,
      profile_photo_url: profilePhotoStored,
      role: "family"
    });

    await supabase.from("families").upsert({
      id: user.id,
      address: values.address
    });

    setSaved(true);
  }

  const displayName = resolveProfileDisplayName({
    first_name: form.watch("firstName"),
    last_name: form.watch("lastName")
  });

  async function handleProfilePhotoChange(url: string) {
    setProfilePhotoStored(url);
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
    <>
      <PageHeader title="User Profile" showBack={false} />
      <main className="px-5 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <p className="text-sm text-slate-600">Update your contact and location details.</p>
        <ProfilePhotoUploader
          photoUrl={
            profilePhotoStored?.startsWith("http")
              ? profilePhotoStored
              : resolveProfilePhotoUrl(profilePhotoStored)
          }
          displayName={displayName}
          onPhotoChange={handleProfilePhotoChange}
        />
        <ThemeToggle />
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...form.register("firstName")} />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-rose-600">{form.formState.errors.firstName.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="middleName">Middle name (optional)</Label>
              <Input id="middleName" {...form.register("middleName")} />
              {form.formState.errors.middleName ? (
                <p className="text-xs text-rose-600">{form.formState.errors.middleName.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...form.register("lastName")} />
            {form.formState.errors.lastName ? (
              <p className="text-xs text-rose-600">{form.formState.errors.lastName.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="09XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
              {...form.register("phone")}
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 11);
              }}
            />
          </div>
          <RegionCitySelects
            region={form.watch("region")}
            city={form.watch("city")}
            onRegionChange={(value) => form.setValue("region", value, { shouldValidate: true })}
            onCityChange={(value) => form.setValue("city", value, { shouldValidate: true })}
            regionError={!!form.formState.errors.region}
            cityError={!!form.formState.errors.city}
            regionLabel={<Label htmlFor="region">Region</Label>}
            cityLabel={<Label htmlFor="city">City</Label>}
          />
          {form.formState.errors.city ? (
            <p className="text-xs text-rose-600">{form.formState.errors.city.message}</p>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="barangay">Barangay</Label>
            <Input
              id="barangay"
              className={form.formState.errors.barangay ? "border-rose-500 focus:ring-rose-500" : undefined}
              {...form.register("barangay")}
            />
            {form.formState.errors.barangay ? (
              <p className="text-xs text-rose-600">{form.formState.errors.barangay.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Home address</Label>
            <Textarea
              id="address"
              className={form.formState.errors.address ? "border-rose-500 focus:ring-rose-500" : undefined}
              {...form.register("address")}
            />
            {form.formState.errors.address ? (
              <p className="text-xs text-rose-600">{form.formState.errors.address.message}</p>
            ) : null}
          </div>
          {saved ? (
            <p className="text-sm text-emerald-700">Profile saved successfully.</p>
          ) : null}
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
        <SignOutDialog className="mt-2" />
      </div>
    </main>
    </>
  );
}
