"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface MessageThreadProps {
  bookingId: string;
  currentUserId: string;
  initialMessages: Message[];
  senderNames?: Record<string, string>;
  readOnly?: boolean;
  className?: string;
}

export function MessageThread({
  bookingId,
  currentUserId,
  initialMessages,
  senderNames = {},
  readOnly = false,
  className
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!currentUserId || readOnly) return;

    async function markRead() {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("booking_id", bookingId)
        .neq("sender_id", currentUserId)
        .eq("is_read", false);
    }

    markRead();
  }, [bookingId, currentUserId, readOnly, supabase]);

  useEffect(() => {
    if (!currentUserId || readOnly) return;

    async function loadBlockState() {
      const response = await fetch(`/api/messages?bookingId=${encodeURIComponent(bookingId)}`);
      const payload = (await response.json().catch(() => null)) as
        | { blocked?: boolean; error?: string }
        | null;
      if (!response.ok) {
        setErrorMessage(payload?.error ?? "Unable to verify messaging availability.");
        return;
      }
      setBlocked(Boolean(payload?.blocked));
    }

    void loadBlockState();
  }, [bookingId, currentUserId, readOnly]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((message) => message.id === next.id)) return prev;
            return [...prev, next];
          });
          if (!readOnly && next.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", next.id)
              .neq("sender_id", currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, currentUserId, readOnly, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || readOnly || !currentUserId || blocked) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");
    setSending(true);

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, content })
    });
    const payload = (await response.json().catch(() => null)) as
      | { message?: Message; error?: string }
      | null;

    if (!response.ok || !payload?.message) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setDraft(content);
      setErrorMessage(payload?.error ?? "Failed to send message.");
      if (response.status === 403) {
        setBlocked(true);
      }
      setSending(false);
      return;
    }

    setSending(false);
    setErrorMessage(null);

    const sentMessage = payload.message;
    setMessages((prev) => {
      const withoutOptimistic = prev.filter((message) => message.id !== optimisticId);
      if (withoutOptimistic.some((message) => message.id === sentMessage.id)) return withoutOptimistic;
      return [...withoutOptimistic, sentMessage as Message];
    });
  }

  return (
    <div
      id="chat"
      className={cn("flex h-[420px] scroll-mt-24 flex-col rounded-2xl border border-slate-200 bg-white", className)}
    >
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          const senderLabel = isMine ? "You" : senderNames[message.sender_id] ?? "Unknown User";
          return (
            <div
              key={message.id}
              className={
                isMine
                  ? "ml-auto w-4/5 rounded-2xl bg-brand-50 p-3"
                  : "mr-auto w-4/5 rounded-2xl bg-slate-100 p-3"
              }
            >
              <p className="text-xs font-medium text-slate-500">{senderLabel}</p>
              <p className="mt-1 text-slate-800">{message.content}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {readOnly ? (
        <p className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
          Admin view — read only
        </p>
      ) : (
        <div className="border-t border-slate-200 p-3">
          {blocked ? (
            <p className="mb-2 text-xs text-rose-600">Messaging is unavailable for this conversation.</p>
          ) : null}
          {errorMessage ? <p className="mb-2 text-xs text-rose-600">{errorMessage}</p> : null}
          <div className="flex gap-2">
          <Input
            placeholder="Type a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={blocked || sending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <LoadingButton
            type="button"
            loading={sending}
            loadingText="Sending..."
            onClick={() => void handleSend()}
            disabled={blocked}
          >
            Send
          </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
