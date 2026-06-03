"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function AdminVerificationsPage() {
  const supabase = createClient();
  const [nurses, setNurses] = useState<any[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("nurses")
        .select(
          "id, provider_type, prc_document_url, tesda_document_url, nbi_document_url, profiles(full_name)"
        )
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
            const isCaregiver = nurse.provider_type === "caregiver";
            return (
              <div key={nurse.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{profile?.full_name ?? "Provider"}</p>
                  <Badge className={isCaregiver ? "bg-amber-100 text-amber-800" : "bg-brand-100 text-brand-800"}>
                    {isCaregiver ? "Caregiver" : "Nurse"}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {isCaregiver ? (
                    <div>
                      <p className="text-xs font-medium text-slate-500">TESDA NC II Certificate</p>
                      {nurse.tesda_document_url ? (
                        <a
                          href={nurse.tesda_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 underline"
                        >
                          View document
                        </a>
                      ) : (
                        <span className="text-rose-600">Not uploaded</span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-500">PRC License</p>
                      {nurse.prc_document_url ? (
                        <a
                          href={nurse.prc_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 underline"
                        >
                          View document
                        </a>
                      ) : (
                        <span className="text-rose-600">Not uploaded</span>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-500">NBI Clearance</p>
                    {nurse.nbi_document_url ? (
                      <a
                        href={nurse.nbi_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 underline"
                      >
                        View document
                      </a>
                    ) : (
                      <span className="text-rose-600">Not uploaded</span>
                    )}
                  </div>
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
