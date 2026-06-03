import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">NurseLink PH</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Trusted nurses and caregivers, ready when your family needs them.
          </h1>
          <p className="text-base text-slate-600">
            Find trusted nurses and caregivers across the Philippines. Book directly, coordinate simply, and keep care
            personal.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge className="bg-slate-100 text-slate-700">Private Duty Nurse</Badge>
            <Badge className="bg-slate-100 text-slate-700">Elderly Care</Badge>
            <Badge className="bg-slate-100 text-slate-700">Newborn Care</Badge>
            <Badge className="bg-slate-100 text-slate-700">Special Needs Care</Badge>
          </div>
          {/* TODO: Verified Badge / Subscription upsell - Phase 2 */}
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
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>NurseLink PH is a neutral marketplace. We do not take payments or commissions.</span>
          <Link href="/privacy" className="underline">Privacy Policy</Link>
          <Link href="/terms" className="underline">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
