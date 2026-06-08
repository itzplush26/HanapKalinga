"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOutWithSessionCleanup } from "@/lib/session-lock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutDialogProps {
  className?: string;
}

export function SignOutDialog({ className }: SignOutDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirmSignOut() {
    setLoading(true);
    const supabase = createClient();
    await signOutWithSessionCleanup(supabase);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("w-full border-rose-200 text-rose-700 hover:bg-rose-50", className)}
        onClick={() => setOpen(true)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Sign out?</h2>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to sign out?</p>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={loading}
                onClick={() => void confirmSignOut()}
              >
                {loading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
