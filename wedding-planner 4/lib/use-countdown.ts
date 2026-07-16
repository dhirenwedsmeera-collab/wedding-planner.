"use client";

import { useEffect, useState } from "react";
import { getCountdown, WEDDING_DATE } from "@/lib/utils";

export function useCountdown() {
  const [countdown, setCountdown] = useState(() => getCountdown(WEDDING_DATE));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(WEDDING_DATE)), 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}
