import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types/domain";
import { getBookingUrgency } from "@/lib/utils";

export function BookingStatusWidget({ bookings }: { bookings: Booking[] }) {
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "booked").length;
  const overdue = bookings.filter((b) => getBookingUrgency(b.category, b.status) === "overdue").length;
  const pending = total - confirmed;
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Booking Status</CardTitle>
        <Link href="/bookings" className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          Open tracker
        </Link>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{confirmed} of {total} confirmed</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-950/40">
            <p className="font-display text-lg font-semibold text-emerald-700 dark:text-emerald-400">{confirmed}</p>
            <p className="text-[10px] text-muted-foreground">Confirmed</p>
          </div>
          <div className="rounded-xl bg-yellow-50 p-2 dark:bg-yellow-950/40">
            <p className="font-display text-lg font-semibold text-yellow-700 dark:text-yellow-500">{pending}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-xl bg-red-50 p-2 dark:bg-red-950/40">
            <p className="font-display text-lg font-semibold text-red-700 dark:text-red-400">{overdue}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>
        {overdue > 0 && (
          <div className="mt-3">
            <Badge variant="red">⚠ {overdue} vendor{overdue > 1 ? "s" : ""} past ideal booking window</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
