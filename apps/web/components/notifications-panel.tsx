"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUTO_DISMISS_MS,
  FADE_OUT_MS,
  shouldAutoDismissNotification
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as { notifications?: NotificationItem[] };
      const unread = (payload.notifications ?? []).filter((item) => !item.read_at);
      setNotifications(unread);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissNotification = useCallback(async (id: string, animate = true) => {
    const timer = dismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.current.delete(id);
    }

    if (animate) {
      setFadingIds((prev) => new Set(prev).add(id));
      await new Promise((resolve) => setTimeout(resolve, FADE_OUT_MS));
    }

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id })
    });

    setFadingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const timers = dismissTimers.current;

    for (const item of notifications) {
      if (!shouldAutoDismissNotification(item.type)) continue;
      if (timers.has(item.id)) continue;

      const timer = setTimeout(() => {
        void dismissNotification(item.id);
      }, AUTO_DISMISS_MS);
      timers.set(item.id, timer);
    }

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, [notifications, dismissNotification]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-navy-900">Notifications</h2>
        <p className="text-xs text-slate-500">
          {notifications.length > 0 ? `${notifications.length} new` : "You're all caught up"}
        </p>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={CheckCircle2}
            title="You're all caught up"
            description="New updates about bookings and verification will appear here."
            className="py-8"
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={cn(
                "relative rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm transition-opacity duration-[400ms]",
                fadingIds.has(item.id) && "opacity-0"
              )}
            >
              <button
                type="button"
                onClick={() => void dismissNotification(item.id)}
                className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pr-6">
                <p className="font-medium text-navy-900">{item.title}</p>
                <p className="mt-1 text-slate-600">{item.body}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
