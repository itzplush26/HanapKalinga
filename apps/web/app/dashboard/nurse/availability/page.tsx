"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/availability-calendar";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  getAccountCreationWeekStart,
  getManilaDateString,
  getWeekDatesFromOffset
} from "@/lib/date-format";

export default function NurseAvailabilityPage() {
  const supabase = createClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const weekDates = useMemo(() => getWeekDatesFromOffset(weekOffset), [weekOffset]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const accountCreationDate = accountCreatedAt?.slice(0, 10) ?? null;
  const minWeekStart = accountCreationDate ? getAccountCreationWeekStart(accountCreationDate) : null;
  const currentWeekStart = weekDates[0];
  const canGoPrevious = !minWeekStart || currentWeekStart > minWeekStart;
  const todayManila = getManilaDateString();

  useEffect(() => {
    async function loadAccountCreatedAt() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", auth.user.id)
        .maybeSingle();

      setAccountCreatedAt(profile?.created_at ?? auth.user.created_at ?? null);
    }

    loadAccountCreatedAt();
  }, [supabase]);

  useEffect(() => {
    async function loadExisting() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const startDate = weekDates[0];
      const endDate = weekDates[weekDates.length - 1];

      const { data: existingSlots } = await supabase
        .from("availability")
        .select("date, shift, is_open")
        .eq("nurse_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate);

      setSlots(
        (existingSlots ?? []).map((row) => ({
          date: row.date as string,
          shift: row.shift as AvailabilitySlot["shift"],
          isOpen: Boolean(row.is_open)
        }))
      );
      setLoading(false);
    }

    loadExisting();
  }, [supabase, weekDates]);

  async function handleToggle(slot: AvailabilitySlot) {
    if (accountCreationDate && slot.date < accountCreationDate) {
      return;
    }
    if (slot.date < todayManila) {
      return;
    }

    setSlots((prev) => {
      const next = prev.filter((item) => !(item.date === slot.date && item.shift === slot.shift));
      return [...next, slot];
    });

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    if (accountCreationDate && slot.date < accountCreationDate) {
      return;
    }

    await supabase.from("availability").upsert({
      nurse_id: user.id,
      date: slot.date,
      shift: slot.shift,
      is_open: slot.isOpen
    });
  }

  return (
    <>
      <PageHeader title="Set availability" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoPrevious}
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              Previous week
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
              Next week
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-600">Loading availability...</p>
          ) : (
            <AvailabilityCalendar
              weekDates={weekDates}
              slots={slots}
              minDate={accountCreationDate ?? undefined}
              onToggle={handleToggle}
            />
          )}
        </div>
      </main>
    </>
  );
}
