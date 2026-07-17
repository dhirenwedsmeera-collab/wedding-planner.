import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { WeddingEvent } from "@/types/domain";
import { EVENT_GRADIENTS } from "@/types/domain";
import { formatDate } from "@/lib/utils";

export function EventStatusGrid({
  events,
  progressByEvent,
}: {
  events: WeddingEvent[];
  progressByEvent: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {events.map((e, i) => {
        const pct = progressByEvent[e.id] ?? 0;
        const gradient = EVENT_GRADIENTS[e.color_theme] ?? EVENT_GRADIENTS.emerald;
        return (
          <Link key={e.id} href={`/events/${e.slug}`}>
            <Card className="gold-hover overflow-hidden">
              <div className={`h-20 ${gradient} relative p-4 text-white`}>
                <p className="font-display text-lg font-semibold">{e.name}</p>
                <p className="text-xs text-white/85">{formatDate(e.event_date)}</p>
              </div>
              <div className="p-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <ProgressBar value={pct} height="h-2" />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
