import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CareRequestForm } from "@/components/care-request-form";
import type { CareRequestFormValues } from "@/lib/validations/care-request";
import type { DailyRateBandId } from "@/lib/data/rates";

export default async function EditCareRequestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: request } = await supabase
    .from("care_requests")
    .select(
      "id, title, patient_condition, care_type, region, city, barangay, budget_band, duration_description, status, required_specializations, preferred_provider_type"
    )
    .eq("id", params.id)
    .eq("family_id", auth.user.id)
    .maybeSingle();

  if (!request) notFound();

  if (request.status !== "open") {
    redirect(`/dashboard/family/care-requests/${params.id}`);
  }

  const initialValues: CareRequestFormValues = {
    title: request.title as string,
    patientCondition: request.patient_condition as string,
    careType: request.care_type as CareRequestFormValues["careType"],
    requiredSpecializations: (request.required_specializations as string[]) ?? [],
    preferredProviderType:
      (request.preferred_provider_type as CareRequestFormValues["preferredProviderType"]) ?? "both",
    region: (request.region as string) ?? "",
    city: (request.city as string) ?? "",
    barangay: (request.barangay as string) ?? "",
    budgetBand: (request.budget_band as DailyRateBandId) ?? "",
    durationDescription: (request.duration_description as string) ?? ""
  };

  return <CareRequestForm mode="edit" careRequestId={params.id} initialValues={initialValues} />;
}
