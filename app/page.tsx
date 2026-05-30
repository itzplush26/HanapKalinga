import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">NurseLink PH</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Verified private duty nurses, ready when your family needs them.
          </h1>
          <p className="text-base text-slate-600">
            Browse trusted caregivers across the Philippines. Book directly, coordinate simply, and keep care personal.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/nurses">Find a Nurse</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">I am a Nurse</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          NurseLink PH is a neutral marketplace. We do not take payments or commissions.
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/privacy" className="underline">Privacy Policy</Link>
          <Link href="/terms" className="underline">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
