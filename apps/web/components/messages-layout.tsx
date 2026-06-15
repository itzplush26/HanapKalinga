"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SHIFT_LABELS } from "@/lib/booking-notes";
import type { InboxRow } from "@/lib/messages";
import { formatMessageTimestamp } from "@/lib/messages-format";
import { MessagesInbox } from "@/components/messages-inbox";
import { FamilyMessagesOnboarding } from "@/components/family-messages-onboarding";
import { MessageThread, type Message } from "@/components/message-thread";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { EmptyState } from "@/components/empty-state";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagesLayoutProps {
  rows: InboxRow[];
  role: "family" | "nurse";
  userId: string;
  bookingDetailBasePath: string;
  showMessagesTooltip?: boolean;
}

export function MessagesLayout({
  rows,
  role,
  userId,
  bookingDetailBasePath,
  showMessagesTooltip = false
}: MessagesLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedBookingId = searchParams.get("booking");
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [bookingMeta, setBookingMeta] = useState<{
    requestedDate: string;
    shift: string;
    status: string;
    otherPartyName: string;
    otherPartyPhoto?: string | null;
  } | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);

  const selectedRow = rows.find((row) => row.bookingId === selectedBookingId) ?? null;

  const selectConversation = useCallback(
    (bookingId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("booking", bookingId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearConversation = useCallback(() => {
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!selectedBookingId || !userId) {
      setMessages([]);
      setBookingMeta(null);
      return;
    }

    async function loadThread() {
      setLoadingThread(true);
      try {
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, requested_date, shift, status, family_id, nurse_id")
          .eq("id", selectedBookingId)
          .single();

        const { data: messageData } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("booking_id", selectedBookingId)
          .order("created_at", { ascending: true });

        setMessages((messageData ?? []) as Message[]);

        if (booking) {
          const otherId = role === "family" ? booking.nurse_id : booking.family_id;
          const participantIds = [userId, otherId];

          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, profile_photo_url")
            .in("id", participantIds);

          setSenderNames(
            Object.fromEntries(
              (profiles ?? []).map((p) => [p.id as string, (p.full_name as string)?.trim() || "Unknown User"])
            )
          );

          const row = rows.find((r) => r.bookingId === selectedBookingId);
          const names = Object.fromEntries(
            (profiles ?? []).map((p) => [p.id as string, (p.full_name as string)?.trim() || "Unknown User"])
          );
          setBookingMeta({
            requestedDate: booking.requested_date,
            shift: booking.shift,
            status: booking.status,
            otherPartyName: row?.otherPartyName ?? names[otherId] ?? "Unknown User",
            otherPartyPhoto: row?.otherPartyPhoto
          });
        }
      } finally {
        setLoadingThread(false);
      }
    }

    loadThread();
  }, [selectedBookingId, userId, role, supabase, rows]);

  const showMobileThread = Boolean(selectedBookingId);

  return (
    <main className="px-5 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex min-h-[calc(100dvh-10rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white md:min-h-[560px] md:flex-row">
          {/* Conversation list */}
          <div
            className={cn(
              "flex w-full flex-col border-slate-200 md:w-80 md:shrink-0 md:border-r",
              showMobileThread ? "hidden md:flex" : "flex"
            )}
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-navy-900">Conversations</h2>
            </div>
            <div
              id={role === "family" ? "family-messages-list" : undefined}
              className="flex-1 overflow-y-auto p-3"
            >
              {role === "family" ? (
                <FamilyMessagesOnboarding showMessagesTooltip={showMessagesTooltip} />
              ) : null}
              <MessagesInbox
                rows={rows}
                selectedBookingId={selectedBookingId}
                onSelect={selectConversation}
                role={role}
              />
            </div>
          </div>

          {/* Active thread */}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              showMobileThread ? "flex" : "hidden md:flex"
            )}
          >
            {selectedBookingId && bookingMeta ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={clearConversation}
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <ProfileAvatar
                    src={bookingMeta.otherPartyPhoto}
                    name={bookingMeta.otherPartyName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-900">{bookingMeta.otherPartyName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {bookingMeta.requestedDate} · {SHIFT_LABELS[bookingMeta.shift] ?? bookingMeta.shift}
                    </p>
                  </div>
                  <BookingStatusBadge status={bookingMeta.status as "pending" | "accepted" | "declined" | "completed" | "cancelled"} />
                </div>
                <div className="px-4 py-2">
                  <Link
                    href={`${bookingDetailBasePath}/${selectedBookingId}`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    View full booking →
                  </Link>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
                  {loadingThread ? (
                    <p className="p-4 text-sm text-slate-500">Loading conversation...</p>
                  ) : (
                    <MessageThread
                      bookingId={selectedBookingId}
                      currentUserId={userId}
                      initialMessages={messages}
                      senderNames={senderNames}
                      className="h-full min-h-[320px] flex-1"
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <EmptyState
                  icon={MessageCircle}
                  title="Select a conversation"
                  description="Choose a message from the list to start chatting."
                  className="border-0 shadow-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
