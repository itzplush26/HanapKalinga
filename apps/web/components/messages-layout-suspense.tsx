"use client";

import { Suspense } from "react";
import { MessagesLayout } from "@/components/messages-layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { InboxRow } from "@/lib/messages";

interface MessagesLayoutSuspenseProps {
  rows: InboxRow[];
  role: "family" | "nurse";
  userId: string;
  bookingDetailBasePath: string;
  showMessagesTooltip?: boolean;
}

export function MessagesLayoutSuspense(props: MessagesLayoutSuspenseProps) {
  return (
    <Suspense
      fallback={
        <main className="px-5 py-6">
          <Skeleton className="mx-auto h-[560px] max-w-5xl rounded-2xl" />
        </main>
      }
    >
      <MessagesLayout {...props} />
    </Suspense>
  );
}
