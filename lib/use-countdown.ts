"use client";

import { useEffect, useState } from "react";
import { getCountdown } from "@/lib/utils";

/** Pass null while the wedding date is still TBD (pending an auspicious date). */
export function useCountdown(targetDate: Date | null) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));

  useEffect(() => {
    setCountdown(getCountdown(targetDate));
    if (!targetDate) return;
    const interval = setInterval(() => setCountdown(getCountdown(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate?.getTime()]);

  return countdown;
}
