"use client";

import { useCallback, useState } from "react";

export type ToastVariant = "success" | "error";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const Toast = toast ? (
    <div
      className={
        toast.variant === "success"
          ? "fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg"
          : "fixed bottom-5 right-5 z-50 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-lg"
      }
    >
      {toast.message}
    </div>
  ) : null;

  return { showToast, Toast };
}
