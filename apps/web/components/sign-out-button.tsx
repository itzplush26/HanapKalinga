"use client";

import { createClient } from "@/lib/supabase/client";
import { signOutWithSessionCleanup } from "@/lib/session-lock";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  async function handleSignOut() {
    const supabase = createClient();
    await signOutWithSessionCleanup(supabase, { redirectTo: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn("text-sm font-medium text-slate-600 underline hover:text-slate-900", className)}
    >
      Sign out
    </button>
  );
}
