import { createClient } from "@/lib/supabase/server";

export default async function AdminFamiliesPage() {
  const supabase = createClient();
  const { data: families } = await supabase
    .from("families")
    .select("id, patient_name, profiles(full_name, city)")
    .order("patient_name", { ascending: true });

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">All families</h1>
        <div className="space-y-3 text-sm">
          {(families ?? []).map((family) => {
            const profile = Array.isArray(family.profiles) ? family.profiles[0] : family.profiles;
            return (
              <div key={family.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="font-semibold">{profile?.full_name ?? "Family"}</p>
                <p className="text-slate-500">{family.patient_name ?? "Patient"}</p>
                <p className="text-xs text-slate-500">{profile?.city ?? ""}</p>
              </div>
            );
          })}
          {families?.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600">
              No families found.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
