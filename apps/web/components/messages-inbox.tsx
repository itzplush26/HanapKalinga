import Image from "next/image";
import Link from "next/link";
import { SHIFT_LABELS } from "@/lib/booking-notes";
import type { InboxRow } from "@/lib/messages";

interface MessagesInboxProps {
  rows: InboxRow[];
  bookingDetailBasePath: string;
}

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
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
          href={`${bookingDetailBasePath}/${row.bookingId}#chat`}
          className="block rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {row.otherPartyPhoto ? (
                <Image src={row.otherPartyPhoto} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                initialsFromName(row.otherPartyName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold text-slate-900">{row.otherPartyName}</p>
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
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
