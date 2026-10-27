import { createClient } from "@/lib/supabase/server";
import { GuestsClient } from "@/components/guests/guests-client";
import type {
  Guest,
  Profile,
  WeddingEvent,
  GuestEventLink,
} from "@/types/domain";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: guests, error: guestsError },
    { data: me, error: profileError },
    { data: events, error: eventsError },
    { data: guestEvents, error: guestEventsError },
  ] = await Promise.all([
    supabase.from("guests").select("*").order("full_name"),
    user
      ? supabase.from("profiles").select("*").eq("id", user.id).single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("events")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order"),
    supabase.from("guest_events").select("*"),
  ]);

  const isAdmin = (me as Profile | null)?.role === "admin";

  if (guestsError) {
    console.error("[GuestsPage] Failed to load guests:", {
      code: guestsError.code,
      message: guestsError.message,
      details: guestsError.details,
      hint: guestsError.hint,
    });
  }

  if (profileError) {
    console.error("[GuestsPage] Failed to load profile:", profileError.message);
  }

  if (eventsError) {
    console.error("[GuestsPage] Failed to load events:", eventsError.message);
  }

  if (guestEventsError) {
    console.error(
      "[GuestsPage] Failed to load guest-event links:",
      guestEventsError.message
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher tables={["guests", "guest_events"]} />

      <div>
        <h1 className="font-display text-2xl font-semibold">Guest List</h1>
        <p className="text-sm text-muted-foreground">
          RSVPs, invitations, and food preferences.
        </p>
      </div>

      {guestsError && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
        >
          <p className="font-semibold">
            We couldn't load the guest list.
          </p>
          <p className="mt-1">
            {isAdmin
              ? `Supabase error ${guestsError.code || "unknown"}: ${guestsError.message}`
              : "Please contact an administrator to investigate this loading problem."}
          </p>
          {isAdmin && guestsError.hint && (
            <p className="mt-1">Hint: {guestsError.hint}</p>
          )}
          <p className="mt-2">
            Your guest records have not been deleted by this page.
          </p>
        </div>
      )}

      {isAdmin && !guestsError && profileError && (
        <p role="alert" className="rounded-lg border p-3 text-sm">
          The guest list query succeeded, but your profile could not be
          loaded. Check the server logs for details.
        </p>
      )}

      <GuestsClient
        initialGuests={(guests ?? []) as Guest[]}
        events={(events ?? []) as WeddingEvent[]}
        initialGuestEvents={(guestEvents ?? []) as GuestEventLink[]}
        isAdmin={isAdmin}
      />
    </div>
  );
}
