import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { SHIFT_LABELS } from "@/lib/booking-notes";
import type { InboxRow } from "@/lib/messages";
import { formatMessageTimestamp } from "@/lib/messages-format";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagesInboxProps {
  rows: InboxRow[];
  selectedBookingId?: string | null;
  onSelect: (bookingId: string) => void;
  role?: "family" | "nurse";
}

export function MessagesInbox({ rows, selectedBookingId, onSelect, role = "nurse" }: MessagesInboxProps) {
  if (rows.length === 0) {
    if (role === "family") {
      return (
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description="Messages will appear here once you have an active booking."
          action={
            <Button asChild size="sm">
              <Link href="/nurses">Find a caregiver</Link>
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description="Open a booking to start chatting with your nurse or family."
      />
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <button
          key={row.bookingId}
          type="button"
          onClick={() => onSelect(row.bookingId)}
          className={cn(
            "w-full rounded-xl border p-3 text-left transition",
            selectedBookingId === row.bookingId
              ? "border-brand-300 bg-brand-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          <div className="flex items-start gap-3">
            <ProfileAvatar src={row.otherPartyPhoto} name={row.otherPartyName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold text-navy-900">{row.otherPartyName}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {row.lastMessageAt ? (
                    <span className="text-[10px] text-slate-500">
                      {formatMessageTimestamp(row.lastMessageAt)}
                    </span>
                  ) : null}
                  {row.unreadCount > 0 ? (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {row.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
              {row.lastMessage ? (
                <p className="mt-0.5 truncate text-sm text-slate-600">{row.lastMessage}</p>
              ) : null}
              <p className="mt-1.5 text-xs text-slate-500">
                Booking: {row.requestedDate} · {SHIFT_LABELS[row.shift] ?? row.shift}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
