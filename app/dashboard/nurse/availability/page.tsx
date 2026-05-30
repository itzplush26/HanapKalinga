"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvailabilityCalendar, AvailabilitySlot } from "@/components/availability-calendar";

function getWeekDates() {
  const today = new Date();
  return Array.from({ length: 4 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export default function NurseAvailabilityPage() {
  const supabase = createClient();
  const weekDates = useMemo(() => getWeekDates(), []);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

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
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Set availability</h1>
        <AvailabilityCalendar weekDates={weekDates} slots={slots} onToggle={handleToggle} />
      </div>
    </main>
  );
}
