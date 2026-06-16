"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeeklyAvailabilityGrid } from "@/components/weekly-availability-grid";
import { AvailabilityPreviewCalendar } from "@/components/availability-preview-calendar";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  applyQuickSetPreset,
  buildWeeklyPatternMap,
  generateAvailabilityRows,
  GENERATION_HORIZON_DAYS,
  type Shift,
  weeklySlotKey
} from "@/lib/availability-schedule";
import { getManilaDateString } from "@/lib/date-format";

export default function NurseAvailabilityPage() {
  const supabase = createClient();
  const [weeklyPattern, setWeeklyPattern] = useState<Map<string, boolean>>(new Map());
  const [exceptions, setExceptions] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExceptions, setShowExceptions] = useState(false);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionOpen, setExceptionOpen] = useState(false);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: weekly }, { data: dateExceptions }] = await Promise.all([
      supabase
        .from("provider_weekly_availability")
        .select("day_of_week, shift, is_open")
        .eq("nurse_id", user.id),
      supabase
        .from("availability_date_exceptions")
        .select("date, is_open")
        .eq("nurse_id", user.id)
    ]);

    const slots = (weekly ?? []).map((row) => ({
      dayOfWeek: row.day_of_week as number,
      shift: row.shift as Shift,
      isOpen: Boolean(row.is_open)
    }));

    setWeeklyPattern(buildWeeklyPatternMap(slots));
    setExceptions(
      new Map((dateExceptions ?? []).map((row) => [row.date as string, Boolean(row.is_open)]))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const todayManila = getManilaDateString();
  const endDate = useMemo(() => {
    const [y, m, d] = todayManila.split("-").map(Number);
    const end = new Date(Date.UTC(y, m - 1, d + GENERATION_HORIZON_DAYS));
    return end.toISOString().slice(0, 10);
  }, [todayManila]);

  function handleToggle(dayOfWeek: number, shift: Shift) {
    setWeeklyPattern((prev) => {
      const next = new Map(prev);
      const key = weeklySlotKey(dayOfWeek, shift);
      next.set(key, !(next.get(key) ?? false));
      return next;
    });
    setSaved(false);
  }

  function handleQuickSet(preset: "weekdays" | "weekends" | "every_day" | "clear_all") {
    setWeeklyPattern((prev) => applyQuickSetPreset(prev, preset));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setSaving(false);
      return;
    }

    const weeklyRows = [];
    for (let day = 1; day <= 7; day += 1) {
      for (const shift of ["morning", "afternoon", "evening", "full_day"] as Shift[]) {
        weeklyRows.push({
          nurse_id: user.id,
          day_of_week: day,
          shift,
          is_open: weeklyPattern.get(weeklySlotKey(day, shift)) ?? false
        });
      }
    }

    await supabase.from("provider_weekly_availability").delete().eq("nurse_id", user.id);
    await supabase.from("provider_weekly_availability").insert(weeklyRows);

    const exceptionRows = [...exceptions.entries()].map(([date, is_open]) => ({
      nurse_id: user.id,
      date,
      is_open
    }));

    await supabase.from("availability_date_exceptions").delete().eq("nurse_id", user.id);
    if (exceptionRows.length) {
      await supabase.from("availability_date_exceptions").insert(exceptionRows);
    }

    await supabase
      .from("availability")
      .delete()
      .eq("nurse_id", user.id)
      .gte("date", todayManila)
      .lte("date", endDate);

    const generated = generateAvailabilityRows(weeklyPattern, exceptions, todayManila);
    const availabilityPayload = generated.map((row) => ({
      nurse_id: user.id,
      date: row.date,
      shift: row.shift,
      is_open: row.is_open
    }));

    for (let i = 0; i < availabilityPayload.length; i += 100) {
      await supabase.from("availability").upsert(availabilityPayload.slice(i, i + 100));
    }

    setSaving(false);
    setSaved(true);
  }

  function handleAddException() {
    if (!exceptionDate || exceptionDate < todayManila) return;
    setExceptions((prev) => new Map(prev).set(exceptionDate, exceptionOpen));
    setExceptionDate("");
    setSaved(false);
  }

  function handleRemoveException(date: string) {
    setExceptions((prev) => {
      const next = new Map(prev);
      next.delete(date);
      return next;
    });
    setSaved(false);
  }

  return (
    <>
      <PageHeader title="Set availability" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <p className="text-sm text-slate-600">
            Set your typical weekly schedule. Changes apply to the next {GENERATION_HORIZON_DAYS} days
            automatically.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-navy-900">Quick set</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSet("weekdays")}>
                Weekdays only
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSet("weekends")}>
                Weekends only
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSet("every_day")}>
                Every day
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSet("clear_all")}>
                Clear all
              </Button>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (
            <WeeklyAvailabilityGrid pattern={weeklyPattern} onToggle={handleToggle} />
          )}

          <AvailabilityPreviewCalendar weeklyPattern={weeklyPattern} exceptions={exceptions} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setShowExceptions((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold text-navy-900"
            >
              Override specific dates
              <span className="text-slate-400">{showExceptions ? "−" : "+"}</span>
            </button>

            {showExceptions ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-500">
                  Block a vacation day or open an extra shift on a date that differs from your weekly
                  pattern.
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Date</label>
                    <Input
                      type="date"
                      min={todayManila}
                      value={exceptionDate}
                      onChange={(e) => setExceptionDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={exceptionOpen ? "default" : "outline"}
                      onClick={() => setExceptionOpen(true)}
                    >
                      Available
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!exceptionOpen ? "default" : "outline"}
                      onClick={() => setExceptionOpen(false)}
                    >
                      Unavailable
                    </Button>
                  </div>
                  <Button type="button" size="sm" onClick={handleAddException}>
                    Add override
                  </Button>
                </div>
                {exceptions.size > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {[...exceptions.entries()]
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, isOpen]) => (
                        <li
                          key={date}
                          className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <span>
                            {date} — {isOpen ? "Available" : "Unavailable"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveException(date)}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => void handleSave()} disabled={saving || loading}>
              {saving ? "Saving..." : "Save weekly schedule"}
            </Button>
            {saved ? <span className="text-sm text-emerald-600">Schedule saved</span> : null}
          </div>
        </div>
      </main>
    </>
  );
}
