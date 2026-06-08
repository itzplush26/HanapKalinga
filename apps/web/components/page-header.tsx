"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  className?: string;
}

export function PageHeader({ title, showBack = true, className }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "relative flex min-h-11 items-center justify-center border-b border-slate-200 bg-white/95 px-12 py-2",
        className
      )}
    >
      {showBack ? (
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      <h1 className="truncate text-center text-base font-semibold text-slate-900">{title}</h1>
    </header>
  );
}
