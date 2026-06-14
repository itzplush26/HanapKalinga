import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/auth-redirect";
import type { AuthRole } from "@/lib/auth-redirect";
import { isProviderRole } from "@/lib/provider-role";

export const metadata: Metadata = {
  description:
    "Find verified private duty nurses and TESDA NC II caregivers across the Philippines. Browse profiles, check availability, and connect directly. Free to use, no agency fees."
};

export default async function HomePage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (auth.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    const role = profile?.role as AuthRole | undefined;
    if (role === "family" || isProviderRole(role) || role === "admin") {
      redirect(getPostLoginPath(role, null));
    }
  }

  return (
    <main className="px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">HanapKalinga</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Trusted nurses and caregivers, ready when your family needs them.
          </h1>
          <p className="text-base text-slate-600">
            Find trusted nurses and caregivers across the Philippines. Book directly, coordinate simply, and keep care
            personal.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button asChild className="w-full">
            <Link href="/register?role=family">I need a nurse or caregiver</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register?role=provider">I am a nurse or caregiver</Link>
          </Button>
          <Link href="/login" className="text-xs text-slate-500 underline">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
