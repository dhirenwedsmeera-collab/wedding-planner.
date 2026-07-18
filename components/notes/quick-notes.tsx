"use client";

import { useEffect, useState } from "react";
import { StickyNote, Send, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  body: string;
  author_id: string;
  author_name?: string;
  created_at: string;
}

export function QuickNotes({ eventId }: { eventId?: string | null }) {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      let query = supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(20);
      query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);
      const { data: rows } = await query;

      const authorIds = [...new Set((rows ?? []).map((r: any) => r.author_id))];
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("id,full_name").in("id", authorIds)
        : { data: [] };

      setNotes((rows ?? []).map((r: any) => ({
        ...r,
        author_name: (profiles ?? []).find((p: any) => p.id === r.author_id)?.full_name ?? "Someone",
      })));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function post() {
    if (!body.trim() || !userId) return;
    const { data } = await supabase
      .from("notes")
      .insert({ event_id: eventId ?? null, author_id: userId, body: body.trim() })
      .select()
      .single();
    if (data) {
      const { data: { user } } = await supabase.auth.getUser();
      setNotes((prev) => [{ ...data, author_name: user?.user_metadata?.full_name ?? "You" }, ...prev]);
      setBody("");
    }
  }

  async function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notes").delete().eq("id", id);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <StickyNote className="h-4 w-4 text-gold-600" />
        <CardTitle>Quick Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && post()}
            placeholder="Jot something down…"
            className="input py-2"
          />
          <button onClick={post} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!loading && notes.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No notes yet.</p>}
          {notes.map((n) => (
            <div key={n.id} className="group flex items-start gap-2 rounded-xl bg-muted px-3 py-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-gold text-[9px] font-semibold text-white">
                {initials(n.author_name ?? "?")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{n.body}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{n.author_name} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
              {n.author_id === userId && (
                <button onClick={() => remove(n.id)} className="shrink-0 text-muted-foreground opacity-0 hover:text-red-600 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
