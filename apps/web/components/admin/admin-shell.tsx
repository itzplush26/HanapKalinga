import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

interface AdminShellProps {
  adminName: string;
  children: React.ReactNode;
}

export function AdminShell({ adminName, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">HanapKalinga Admin</p>
            <p className="text-sm text-slate-600">{adminName}</p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-6 lg:self-start">
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  breadcrumbs?: React.ReactNode;
}

export function AdminPageHeader({ title, description, backHref, breadcrumbs }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      ) : null}
      {breadcrumbs}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}
