"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminVerificationsPage() {
  const supabase = createClient();
  const [nurses, setNurses] = useState<any[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("nurses")
        .select("id, prc_document_url, nbi_document_url, profiles(full_name)")
        .eq("verification_status", "pending");
      setNurses(data ?? []);
    }
    load();
  }, [supabase]);

  async function handleVerify(id: string) {
    await supabase
      .from("nurses")
      .update({ verification_status: "verified", verified_at: new Date().toISOString() })
      .eq("id", id);
    setNurses((prev) => prev.filter((nurse) => nurse.id !== id));
  }

  async function handleReject(id: string) {
    await supabase
      .from("nurses")
      .update({
        verification_status: "rejected",
        rejection_reason: reasons[id] ?? ""
      })
      .eq("id", id);
    setNurses((prev) => prev.filter((nurse) => nurse.id !== id));
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Verification queue</h1>
        <div className="space-y-4">
          {nurses.map((nurse) => {
            const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
            return (
            <div key={nurse.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-semibold">{profile?.full_name ?? "Nurse"}</p>
              <div className="mt-2 text-xs text-slate-500">
                <p>PRC: {nurse.prc_document_url ?? "Not uploaded"}</p>
                <p>NBI: {nurse.nbi_document_url ?? "Not uploaded"}</p>
              </div>
              <Textarea
                className="mt-3"
                placeholder="Rejection reason"
                value={reasons[nurse.id] ?? ""}
                onChange={(event) =>
                  setReasons((prev) => ({ ...prev, [nurse.id]: event.target.value }))
                }
              />
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => handleVerify(nurse.id)}>
                  Verify
                </Button>
                <Button type="button" variant="outline" onClick={() => handleReject(nurse.id)}>
                  Reject
                </Button>
              </div>
            </div>
            );
          })}
          {nurses.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No pending verifications.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
