"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/availability-calendar";
import { Button } from "@/components/ui/button";

function getWeekDates(weekOffset: number) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export default function NurseAvailabilityPage() {
  const supabase = createClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

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
    setSlots((prev) => {
      const next = prev.filter((item) => !(item.date === slot.date && item.shift === slot.shift));
      return [...next, slot];
    });

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    await supabase.from("availability").upsert({
      nurse_id: user.id,
      date: slot.date,
      shift: slot.shift,
      is_open: slot.isOpen
    });
  }

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Set availability</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
              Previous week
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
              Next week
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-600">Loading availability...</p>
        ) : (
          <AvailabilityCalendar weekDates={weekDates} slots={slots} onToggle={handleToggle} />
        )}
      </div>
    </main>
  );
}
