import { SignOutButton } from "@/components/sign-out-button";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 pt-4">
      {title ? <h1 className="text-lg font-semibold text-slate-900">{title}</h1> : <span />}
      <SignOutButton />
    </div>
  );
}
