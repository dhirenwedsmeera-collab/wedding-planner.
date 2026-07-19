import {
  LayoutDashboard, ListChecks, CalendarHeart, ClipboardCheck,
  Wallet, ShoppingBag, Users, Store,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", fullLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", fullLabel: "Events", icon: CalendarHeart },
  { href: "/tasks", label: "Tasks", fullLabel: "Tasks", icon: ListChecks },
  { href: "/bookings", label: "Bookings", fullLabel: "Bookings", icon: ClipboardCheck },
  { href: "/budget", label: "Budget", fullLabel: "Budget", icon: Wallet },
  { href: "/shopping", label: "Shopping", fullLabel: "Shopping", icon: ShoppingBag },
  { href: "/guests", label: "Guests", fullLabel: "Guests", icon: Users },
  { href: "/vendors", label: "Vendors", fullLabel: "Vendors", icon: Store },
];
