"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DAILY_RATE_BANDS } from "@/lib/data/rates";
import { BOOKING_SKILLS } from "@/lib/constants";

export default function NewCareRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [patientCondition, setPatientCondition] = useState("");
  const [careType, setCareType] = useState("per_shift");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [budgetBand, setBudgetBand] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [durationDescription, setDurationDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const response = await fetch("/api/care-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        patientCondition,
        careType,
        requiredSpecializations: skills,
        preferredProviderType: "both",
        region,
        city,
        budgetBand,
        durationDescription
      })
    });
    setLoading(false);
    const payload = (await response.json()) as { careRequestId?: string };
    if (payload.careRequestId) {
      router.push(`/dashboard/family/care-requests/${payload.careRequestId}`);
    }
  }

  return (
    <>
      <PageHeader title="Post a care request" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <Input placeholder="Elderly care needed in Quezon City" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Patient condition" value={patientCondition} onChange={(e) => setPatientCondition(e.target.value)} />
          <Select value={careType} onChange={(e) => setCareType(e.target.value)}>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="live_in">Live in</option>
            <option value="per_shift">Per shift</option>
          </Select>
          <Input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Select value={budgetBand} onChange={(e) => setBudgetBand(e.target.value)}>
            <option value="">Budget band</option>
            {DAILY_RATE_BANDS.map((band) => (
              <option key={band.id} value={band.id}>
                {band.label}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2">
            {BOOKING_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() =>
                  setSkills((prev) =>
                    prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
                  )
                }
                className={`rounded-full px-3 py-1 text-xs ${skills.includes(skill) ? "bg-brand-500 text-white" : "bg-slate-100"}`}
              >
                {skill}
              </button>
            ))}
          </div>
          <Input placeholder="Duration (e.g. 3 months or ongoing)" value={durationDescription} onChange={(e) => setDurationDescription(e.target.value)} />
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? "Posting..." : "Post care request"}
          </Button>
        </div>
      </main>
    </>
  );
}
