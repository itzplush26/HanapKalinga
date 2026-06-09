import { createServiceClient } from "@/lib/supabase/service";

export async function getUserEmail(userId: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

export async function getAdminEmails(): Promise<string[]> {
  const service = createServiceClient();
  const { data: admins } = await service.from("profiles").select("id").eq("role", "admin");
  const emails: string[] = [];
  for (const admin of admins ?? []) {
    const email = await getUserEmail(admin.id as string);
    if (email) emails.push(email);
  }
  return emails;
}
