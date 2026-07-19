import Link from "next/link";
import { Users, Shirt, Sparkles as DecorIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { WeddingEvent } from "@/types/domain";
import { EVENT_GRADIENTS } from "@/types/domain";
import { formatDate } from "@/lib/utils";

export function EventStatusGrid({
  events, progressByEvent, guestCountByEvent, confirmedGuestByEvent, outfitPctByEvent, decorPctByEvent,
}: {
  events: WeddingEvent[];
  progressByEvent: Record<string, number>;
  guestCountByEvent?: Record<string, number>;
  confirmedGuestByEvent?: Record<string, number>;
  outfitPctByEvent?: Record<string, number>;
  decorPctByEvent?: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {events.map((e) => {
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
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {guestCountByEvent && guestCountByEvent[e.id] > 0 && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {confirmedGuestByEvent?.[e.id] ?? 0}/{guestCountByEvent[e.id]}</span>
                  )}
                  {outfitPctByEvent && outfitPctByEvent[e.id] >= 0 && (
                    <span className="flex items-center gap-1"><Shirt className="h-3 w-3" /> {outfitPctByEvent[e.id]}%</span>
                  )}
                  {decorPctByEvent && decorPctByEvent[e.id] >= 0 && (
                    <span className="flex items-center gap-1"><DecorIcon className="h-3 w-3" /> {decorPctByEvent[e.id]}%</span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
