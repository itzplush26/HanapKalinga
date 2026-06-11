"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  establishUserSession,
  handleSessionConflict,
  validateClientSession
} from "@/lib/session-lock";

export function SessionGuard() {
  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;

      const result = await validateClientSession(supabase, userId);
      if (result === "conflict") {
        await handleSessionConflict(supabase);
        return;
      }

      if (result === "missing") {
        await establishUserSession(supabase, userId, navigator.userAgent);
      }
    }

    checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void checkSession();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return null;
}
