"use client";

import { useEffect } from "react";

interface ScrollToHashProps {
  hash?: string;
}

export function ScrollToHash({ hash = "chat" }: ScrollToHashProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${hash}`) return;
    const target = document.getElementById(hash);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return null;
}
