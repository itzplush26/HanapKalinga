"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as { notifications?: NotificationItem[] };
      setNotifications(payload.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id })
    });
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true })
    });
    setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button type="button" onClick={markAllRead} className="text-xs font-medium text-brand-700 hover:underline">
            Mark all read
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No notifications yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-xl border p-3 text-sm",
                item.read_at ? "border-slate-100 bg-slate-50" : "border-brand-100 bg-brand-50/40"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-slate-600">{item.body}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                {!item.read_at ? (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
