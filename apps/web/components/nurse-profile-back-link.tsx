"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function NurseProfileBackLink() {
  const router = useRouter();

  return (
    <Link
      href="/nurses"
      onClick={(event) => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to browse
    </Link>
  );
}
