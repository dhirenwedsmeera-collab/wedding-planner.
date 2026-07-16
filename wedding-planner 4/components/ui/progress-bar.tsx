"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  trackClassName,
  height = "h-2.5",
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  height?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full rounded-full bg-muted overflow-hidden", height, trackClassName)}>
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold-500", className)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}
