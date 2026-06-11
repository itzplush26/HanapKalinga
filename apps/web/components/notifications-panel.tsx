"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as { notifications?: NotificationItem[] };
      const unread = (payload.notifications ?? []).filter((item) => !item.read_at);
      setNotifications(unread);
      if (unread.length > 0) {
        setOpen(true);
      }
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

  const summary =
    notifications.length > 0 ? `${notifications.length} new` : "You're all caught up";

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
          <p className="text-xs text-text-muted">{summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {notifications.length > 0 ? (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
              {notifications.length}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-muted transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-border px-3 pb-3 pt-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up"
              description="New updates about bookings and verification will appear here."
              className="border-0 bg-surface-alt py-4"
              compact
            />
          ) : (
            <ul className="space-y-2">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "relative rounded-xl border border-info-border bg-info-bg/40 p-2.5 text-sm transition-opacity duration-[400ms]",
                    fadingIds.has(item.id) && "opacity-0"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void dismissNotification(item.id)}
                    className="absolute right-1.5 top-1.5 rounded-lg p-1 text-text-muted hover:bg-surface hover:text-text-secondary"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="pr-6">
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{item.body}</p>
                    <p className="mt-1.5 text-[11px] text-text-muted">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
