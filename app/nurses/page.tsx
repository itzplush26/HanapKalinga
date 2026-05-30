import { createClient } from "@/lib/supabase/server";
import { NurseCard } from "@/components/nurse-card";

export default async function NursesPage() {
  const supabase = createClient();
  const { data: nurses } = await supabase
    .from("nurses")
    .select("id, specializations, years_experience, daily_rate_12hr, profiles(full_name, city)")
    .eq("verification_status", "verified");

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Browse verified nurses</h1>
          <p className="text-sm text-slate-600">Search by city or specialization.</p>
        </div>
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
            />
            );
          })}
          {nurses?.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No verified nurses yet. Check back soon.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
