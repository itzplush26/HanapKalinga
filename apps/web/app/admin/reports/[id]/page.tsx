"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("incident_reports").select("*").eq("id", params.id).single();
      setReport(data);
    }
    load();
  }, [params.id, supabase]);

  async function updateStatus(status: "reviewed" | "resolved") {
    await supabase
      .from("incident_reports")
      .update({ status, admin_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq("id", params.id);
    setReport((prev) => (prev ? { ...prev, status } : prev));
  }

  async function suspendUser() {
    if (!report?.reported_user_id) return;
    await supabase
      .from("profiles")
      .update({ suspended: true })
      .eq("id", report.reported_user_id as string);
  }

  if (!report) return <p className="p-8 text-sm text-slate-600">Loading report...</p>;

  return (
    <main className="max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold text-navy-900">Incident report</h1>
      <p className="text-sm text-slate-600">Category: {report.category as string}</p>
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm">{report.description as string}</p>
      <Textarea placeholder="Admin notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void updateStatus("reviewed")}>
          Mark reviewed
        </Button>
        <Button type="button" onClick={() => void updateStatus("resolved")}>
          Mark resolved
        </Button>
        <Button type="button" variant="destructive" onClick={() => void suspendUser()}>
          Suspend user
        </Button>
      </div>
    </main>
  );
}
