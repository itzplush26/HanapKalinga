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
}

export function MessageThread({
  bookingId,
  currentUserId,
  initialMessages
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => [...prev, next]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!draft.trim()) return;
    await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content: draft.trim()
    });
    setDraft("");
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender_id === currentUserId
                ? "ml-auto w-4/5 rounded-2xl bg-brand-50 p-3"
                : "mr-auto w-4/5 rounded-2xl bg-slate-100 p-3"
            }
          >
            <p className="text-slate-800">{message.content}</p>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-slate-200 p-3">
        <Input
          placeholder="Type a message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="button" onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
