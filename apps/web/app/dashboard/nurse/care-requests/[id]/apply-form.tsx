"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getDailyRateBand } from "@/lib/data/rates";

interface NurseCareRequestApplyPageProps {
  request: {
    id: string;
    title: string;
    patient_condition: string;
    care_type: string;
    region: string | null;
    city: string | null;
    barangay: string | null;
    budget_band: string | null;
    duration_description: string | null;
    required_specializations: string[];
  };
  alreadyApplied: boolean;
}

export function NurseCareRequestApplyPage({ request, alreadyApplied }: NurseCareRequestApplyPageProps) {
  const router = useRouter();
  const [coverMessage, setCoverMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const location = [request.barangay, request.city, request.region].filter(Boolean).join(", ");

  async function handleApply() {
    setStatus(null);

    if (coverMessage.trim().length < 50) {
      setStatus("Your cover message must be at least 50 characters.");
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/care-requests/${request.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverMessage: coverMessage.trim() })
    });
    setLoading(false);

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(payload.error ?? "Could not submit your application.");
      return;
    }

    router.push("/dashboard/nurse/applications?applied=1");
  }

  return (
    <>
      <PageHeader title="Apply to care request" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h1 className="text-lg font-semibold text-navy-900">{request.title}</h1>
            {location ? <p className="mt-2 text-sm text-slate-600">{location}</p> : null}
            <p className="mt-3 text-sm text-slate-700">{request.patient_condition}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Badge className="bg-brand-50 text-brand-800">
                {request.care_type.replaceAll("_", " ")}
              </Badge>
              {request.required_specializations.map((item) => (
                <Badge key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Budget: {getDailyRateBand(request.budget_band ?? "")?.label ?? "Open"}
            </p>
            {request.duration_description ? (
              <p className="mt-1 text-sm text-slate-600">Duration: {request.duration_description}</p>
            ) : null}
          </div>

          {alreadyApplied ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              You have already applied to this care request.
            </p>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <label htmlFor="cover-message" className="text-sm font-medium text-slate-700">
                Cover message <span className="text-rose-600">*</span>
              </label>
              <Textarea
                id="cover-message"
                placeholder="Introduce yourself and explain why you are a good fit for this care request."
                value={coverMessage}
                onChange={(event) => setCoverMessage(event.target.value)}
              />
              <p className="text-xs text-slate-500">Minimum 50 characters.</p>
              {status ? <p className="text-sm text-rose-600">{status}</p> : null}
              <LoadingButton
                type="button"
                className="w-full"
                loading={loading}
                loadingText="Submitting..."
                onClick={() => void handleApply()}
              >
                Submit application
              </LoadingButton>
            </div>
          )}

          <Button asChild variant="outline">
            <Link href="/dashboard/nurse/bookings?tab=find-work">Back to open requests</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
