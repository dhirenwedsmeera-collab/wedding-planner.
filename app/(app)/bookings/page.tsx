import { createClient } from "@/lib/supabase/server";
import { BookingsClient } from "@/components/bookings/bookings-client";
import type { Booking, WeddingEvent, Profile } from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bookings }, { data: events }, { data: profile }, { data: bookingEventLinks }] = await Promise.all([
    supabase.from("bookings").select("*").order("category"),
    supabase.from("events").select("*").eq("is_archived", false).order("sort_order"),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("booking_events").select("booking_id,event_id"),
  ]);

  const bookingEventIds = new Map<string, string[]>();
  for (const link of bookingEventLinks ?? []) {
    bookingEventIds.set(link.booking_id, [...(bookingEventIds.get(link.booking_id) ?? []), link.event_id]);
  }
  const bookingsWithEvents = (bookings ?? []).map((booking) => ({
    ...booking,
    event_ids: bookingEventIds.get(booking.id) ?? (booking.event_id ? [booking.event_id] : []),
  }));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["bookings"]} />
      <div>
        <h1 className="font-display text-2xl font-semibold">Vendor Booking Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Every required booking, its status, and how urgently it needs attention.
        </p>
      </div>
      <BookingsClient
        initialBookings={bookingsWithEvents as Booking[]}
        events={(events ?? []) as WeddingEvent[]}
        isAdmin={(profile as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
