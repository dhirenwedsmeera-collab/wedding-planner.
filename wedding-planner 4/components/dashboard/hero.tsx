"use client";

import { motion } from "framer-motion";
import { useCountdown } from "@/lib/use-countdown";
import { getPlanningElapsedPct } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";

export function DashboardHero({ firstName, overallPct }: { firstName: string; overallPct: number }) {
  const { days, weeks, hours, minutes, seconds } = useCountdown();
  const elapsedPct = getPlanningElapsedPct();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
          <p className="mt-2 max-w-md text-sm text-white/85">
            {days > 0
              ? `${days} days to go until the Nikah — every task you finish brings the celebration closer.`
              : "Today is the day! 🎉"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
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
          </div>
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
