"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, CalendarCheck } from "lucide-react";
import { useCountdown } from "@/lib/use-countdown";
import { getPlanningElapsedPct } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";
import { createClient } from "@/lib/supabase/client";

export function DashboardHero({
  firstName, overallPct, weddingDate, isAdmin,
}: { firstName: string; overallPct: number; weddingDate: string | null; isAdmin: boolean }) {
  const target = weddingDate ? new Date(`${weddingDate}T00:00:00`) : null;
  const { days, weeks, hours, minutes, seconds, isTbd } = useCountdown(target);
  const elapsedPct = getPlanningElapsedPct(undefined, target);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const [editing, setEditing] = useState(false);
  const [dateInput, setDateInput] = useState(weddingDate ?? "");
  const supabase = createClient();

  async function saveDate() {
    await supabase.from("wedding_settings").update({ wedding_date: dateInput || null, wedding_date_is_confirmed: !!dateInput }).eq("id", true);
    setEditing(false);
    window.location.reload();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-emerald-gold p-6 text-white shadow-soft-lg lg:p-8"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 15% 30%, white 0, transparent 35%), radial-gradient(circle at 90% 10%, white 0, transparent 30%)"
      }} />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-white/80">{greeting},</p>
          <h1 className="font-display text-3xl font-semibold lg:text-4xl">{firstName} ✨</h1>

          {isTbd ? (
            <div className="mt-2 max-w-md">
              <p className="flex items-center gap-1.5 text-sm text-white/85">
                <CalendarCheck className="h-4 w-4" /> Wedding date is still TBD — shortlisting an auspicious date.
              </p>
              {isAdmin && (
                editing ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="rounded-lg border-0 px-2.5 py-1.5 text-xs text-foreground outline-none"
                    />
                    <button onClick={saveDate} className="rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-medium hover:bg-white/30">Save</button>
                    <button onClick={() => setEditing(false)} className="text-xs text-white/70 hover:text-white">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)} className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium hover:bg-white/25">
                    <Pencil className="h-3 w-3" /> Set wedding date
                  </button>
                )
              )}
            </div>
          ) : (
            <p className="mt-2 max-w-md text-sm text-white/85">
              {days > 0
                ? `${days} days to go until the wedding — every task you finish brings the celebration closer.`
                : "Today is the day! 🎉"}
            </p>
          )}

          {!isTbd && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {[
                { v: weeks, l: "weeks" },
                { v: days, l: "days" },
                { v: hours, l: "hrs" },
                { v: minutes, l: "min" },
                { v: seconds, l: "sec" },
              ].map((u) => (
                <div key={u.l} className="min-w-[62px] rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
                  <p className="font-display text-xl font-semibold tabular-nums">{u.v}</p>
                  <p className="text-[10px] uppercase tracking-wide text-white/75">{u.l}</p>
                </div>
              ))}
              {isAdmin && !editing && (
                <button onClick={() => setEditing(true)} className="flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-2.5 text-[11px] font-medium hover:bg-white/20">
                  <Pencil className="h-3 w-3" /> Edit date
                </button>
              )}
              {isAdmin && editing && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="rounded-lg border-0 px-2.5 py-1.5 text-xs text-foreground outline-none"
                  />
                  <button onClick={saveDate} className="rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-medium hover:bg-white/30">Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs text-white/70 hover:text-white">Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 self-center rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div className="text-center">
            <ProgressRing value={overallPct} size={104} strokeWidth={9} label={`${overallPct}%`} sublabel="planned" />
          </div>
          <div className="text-center">
            <ProgressRing value={elapsedPct} size={104} strokeWidth={9} label={`${elapsedPct}%`} sublabel="time used" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
