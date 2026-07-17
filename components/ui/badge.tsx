import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
        gold: "border-transparent bg-gold-100 text-gold-800 dark:bg-gold-900/40 dark:text-gold-300",
        outline: "border-border text-foreground",
        red: "border-transparent bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
        orange: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
        yellow: "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-500",
        green: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
