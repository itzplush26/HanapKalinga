import Link from "next/link";
import { SHIFT_LABELS } from "@/lib/booking-notes";
import type { InboxRow } from "@/lib/messages";

interface MessagesInboxProps {
  rows: InboxRow[];
  bookingDetailBasePath: string;
}

export function MessagesInbox({ rows, bookingDetailBasePath }: MessagesInboxProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No conversations yet. Open a booking to start chatting.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Link
          key={row.bookingId}
          href={`${bookingDetailBasePath}/${row.bookingId}`}
          className="block rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900">{row.otherPartyName}</p>
            {row.unreadCount > 0 ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                {row.unreadCount}
              </span>
            ) : null}
          </div>
          {row.lastMessage ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{row.lastMessage}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Booking: {row.requestedDate} · {SHIFT_LABELS[row.shift] ?? row.shift}
          </p>
        </Link>
      ))}
    </div>
  );
}
