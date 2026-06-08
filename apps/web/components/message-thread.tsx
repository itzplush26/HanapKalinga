"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}

export function MessageThread({
  bookingId,
  currentUserId,
  initialMessages,
  senderNames = {},
  readOnly = false
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
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
    if (!content || readOnly || !currentUserId) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender_id: currentUserId,
        content
      })
      .select("id, sender_id, content, created_at")
      .single();

    if (error || !data) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setDraft(content);
      return;
    }

    setMessages((prev) => {
      const withoutOptimistic = prev.filter((message) => message.id !== optimisticId);
      if (withoutOptimistic.some((message) => message.id === data.id)) return withoutOptimistic;
      return [...withoutOptimistic, data as Message];
    });
  }

  return (
    <div id="chat" className="flex h-[420px] scroll-mt-24 flex-col rounded-2xl border border-slate-200 bg-white">
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
        <div className="flex gap-2 border-t border-slate-200 p-3">
          <Input
            placeholder="Type a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button type="button" onClick={() => void handleSend()}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
