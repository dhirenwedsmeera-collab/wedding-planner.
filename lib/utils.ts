import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, differenceInSeconds } from "date-fns";
import type { BookingCategory } from "@/types/domain";
import { BOOKING_LEAD_TIME_DAYS } from "@/types/domain";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Fallback only — the real, admin-editable date lives in the `wedding_settings`
 * table since the actual date is TBD until an auspicious date is chosen. */
export const FALLBACK_WEDDING_DATE = new Date(
  process.env.NEXT_PUBLIC_WEDDING_DATE || "2028-07-01T00:00:00"
);
/** @deprecated use FALLBACK_WEDDING_DATE, or better, wedding_settings.wedding_date from the database */
export const WEDDING_DATE = FALLBACK_WEDDING_DATE;

/** Planning is assumed to start the day the app went live / project kicked off. */
export const PLANNING_START_DATE = new Date("2026-01-01T00:00:00");

export function getCountdown(target: Date | null) {
  if (!target) return { totalSeconds: 0, days: 0, weeks: 0, hours: 0, minutes: 0, seconds: 0, isTbd: true as const };
  const now = new Date();
  const totalSeconds = Math.max(0, differenceInSeconds(target, now));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const weeks = Math.floor(days / 7);
  return { totalSeconds, days, weeks, hours, minutes, seconds, isTbd: false as const };
}

export function getPlanningElapsedPct(
  start: Date = PLANNING_START_DATE,
  end: Date | null = FALLBACK_WEDDING_DATE
) {
  if (!end) return 0;
  const total = differenceInCalendarDays(end, start);
  const elapsed = differenceInCalendarDays(new Date(), start);
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/** Task urgency: Red/Orange/Yellow/Green based on days until due. */
export type UrgencyLevel = "critical" | "urgent" | "upcoming" | "can_wait" | "overdue";

export function getTaskUrgency(dueDate: string | null, status?: string): UrgencyLevel {
  if (!dueDate) return "can_wait";
  if (status === "completed" || status === "cancelled") return "can_wait";
  const days = differenceInCalendarDays(new Date(dueDate), new Date());
  if (days < 0) return "overdue";
  if (days <= 3) return "critical";
  if (days <= 7) return "urgent";
  if (days <= 21) return "upcoming";
  return "can_wait";
}

export const URGENCY_STYLES: Record<UrgencyLevel, { label: string; dot: string; bg: string; text: string; border: string }> = {
  overdue: { label: "Overdue", dot: "bg-red-600", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900" },
  critical: { label: "Critical", dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900" },
  urgent: { label: "Urgent", dot: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-900" },
  upcoming: { label: "Upcoming", dot: "bg-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-500", border: "border-yellow-200 dark:border-yellow-900" },
  can_wait: { label: "Can Wait", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900" },
};

/** Booking urgency for an UNBOOKED vendor: compares days remaining to that category's ideal lead time. */
export function getBookingUrgency(category: BookingCategory, status: string): UrgencyLevel {
  if (status !== "not_booked" && status !== "enquired" && status !== "negotiating") return "can_wait";
  const daysUntilWedding = differenceInCalendarDays(WEDDING_DATE, new Date());
  const leadTime = BOOKING_LEAD_TIME_DAYS[category];

  // "Ideal booking-by" date = wedding date minus lead time.
  // If today is already past that date and still not booked -> overdue.
  const idealBookByDaysFromNow = daysUntilWedding - leadTime;
  if (idealBookByDaysFromNow < 0) return "overdue";
  if (idealBookByDaysFromNow <= 30) return "critical";
  if (idealBookByDaysFromNow <= 60) return "urgent";
  if (idealBookByDaysFromNow <= 120) return "upcoming";
  return "can_wait";
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function whatsappLink(phone: string | null | undefined, message = "") {
  if (!phone) return "#";
  const digits = phone.replace(/[^\d]/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}${text ? `?text=${text}` : ""}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
