import { redirect } from "next/navigation";

export default async function NurseCareRequestsPage() {
  redirect("/dashboard/nurse/bookings?tab=find-work");
}
