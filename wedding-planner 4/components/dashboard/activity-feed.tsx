import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, PlusCircle, MessageSquare, DollarSign, ShoppingBag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

const ICONS: Record<string, any> = {
  task_completed: CheckCircle2,
  task_created: PlusCircle,
  comment_added: MessageSquare,
  budget_updated: DollarSign,
  shopping_updated: ShoppingBag,
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No activity yet — start checking off tasks!</p>}
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? PlusCircle;
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm">{item.message}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
