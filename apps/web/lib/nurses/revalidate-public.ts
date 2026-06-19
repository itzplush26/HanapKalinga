import { revalidatePath } from "next/cache";

export function revalidatePublicNursePages(profileSlug?: string | null, nurseId?: string) {
  revalidatePath("/nurses");
  const slugOrId = profileSlug?.trim() || nurseId;
  if (slugOrId) {
    revalidatePath(`/nurses/${slugOrId}`);
  }
}
