import { createClient } from "@/lib/supabase/server";

export default async function AdminNursesPage() {
  const supabase = createClient();
  const { data: nurses } = await supabase
    .from("nurses")
    .select("id, verification_status, profiles(full_name, city)")
    .order("verification_status", { ascending: true });

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">All nurses</h1>
        <div className="space-y-3 text-sm">
          {(nurses ?? []).map((nurse) => {
            const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
            return (
              <div key={nurse.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="font-semibold">{profile?.full_name ?? "Nurse"}</p>
                <p className="text-slate-500">{profile?.city ?? ""}</p>
                <p className="text-xs text-slate-500">{nurse.verification_status}</p>
              </div>
            );
          })}
          {nurses?.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600">
              No nurses found.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
