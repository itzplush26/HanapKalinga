import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NurseCareRequestApplyPage } from "./apply-form";

export default async function NurseCareRequestDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: request } = await supabase
    .from("care_requests")
    .select(
      "id, title, patient_condition, care_type, region, city, barangay, budget_band, duration_description, required_specializations, status"
    )
    .eq("id", params.id)
    .eq("status", "open")
    .maybeSingle();

  if (!request) notFound();

  const { data: existing } = await supabase
    .from("care_request_applications")
    .select("id")
    .eq("care_request_id", params.id)
    .eq("nurse_id", auth.user.id)
    .maybeSingle();

  return (
    <NurseCareRequestApplyPage
      request={{
        id: request.id as string,
        title: request.title as string,
        patient_condition: request.patient_condition as string,
        care_type: request.care_type as string,
        region: request.region as string | null,
        city: request.city as string | null,
        barangay: request.barangay as string | null,
        budget_band: request.budget_band as string | null,
        duration_description: request.duration_description as string | null,
        required_specializations: (request.required_specializations as string[]) ?? []
      }}
      alreadyApplied={Boolean(existing)}
    />
  );
}
