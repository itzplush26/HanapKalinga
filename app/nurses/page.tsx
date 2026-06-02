import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NurseCard } from "@/components/nurse-card";
import { NurseFilters } from "@/components/nurse-filters";
import { Button } from "@/components/ui/button";

export default async function NursesPage() {
  const supabase = createClient();
  const { data: nurses } = await supabase
    .from("nurses")
    .select("id, specializations, years_experience, daily_rate_12hr, profile_photo_url, profiles(full_name, city)")
    .eq("verification_status", "verified");

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Browse verified nurses</h1>
          <p className="text-sm text-slate-600">Search by city or specialization.</p>
        </div>
        <NurseFilters />
        <div className="space-y-4">
          {(nurses ?? []).map((nurse) => {
            const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
            return (
            <NurseCard
              key={nurse.id}
              id={nurse.id}
              name={profile?.full_name ?? "Verified Nurse"}
              city={profile?.city ?? "Philippines"}
              specializations={nurse.specializations ?? []}
              yearsExperience={nurse.years_experience ?? 0}
              dailyRate={nurse.daily_rate_12hr ?? 0}
              rating={4.7}
              verified
              imageUrl={nurse.profile_photo_url ?? undefined}
            />
            );
          })}
          {nurses?.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">No verified nurses yet</p>
              <p className="mt-1">Be the first to sign up and get verified.</p>
              <Button asChild className="mt-3">
                <Link href="/register?role=nurse">Create nurse profile</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
