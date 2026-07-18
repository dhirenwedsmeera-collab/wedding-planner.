"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name?: string;
}

export function TaskComments({ taskId }: { taskId: string }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: rows } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      const authorIds = [...new Set((rows ?? []).map((r: any) => r.author_id))];
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("id,full_name").in("id", authorIds)
        : { data: [] };

      const withNames = (rows ?? []).map((r: any) => ({
        ...r,
        author_name: (profiles ?? []).find((p: any) => p.id === r.author_id)?.full_name ?? "Someone",
      }));
      setComments(withNames);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function post() {
    if (!body.trim() || !userId) return;
    const { data } = await supabase
      .from("task_comments")
      .insert({ task_id: taskId, author_id: userId, body: body.trim() })
      .select()
      .single();
    if (data) {
      const { data: { user } } = await supabase.auth.getUser();
      setComments((prev) => [...prev, { ...data, author_name: user?.user_metadata?.full_name ?? "You" }]);
      setBody("");
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Comments</p>
      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
      <div className="max-h-48 space-y-3 overflow-y-auto">
        {!loading && comments.length === 0 && (
          <p className="text-xs text-muted-foreground">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-gold text-[9px] font-semibold text-white">
              {initials(c.author_name ?? "?")}
            </span>
            <div className="min-w-0 rounded-xl bg-muted px-3 py-1.5">
              <p className="text-xs font-medium">{c.author_name}</p>
              <p className="text-sm">{c.body}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && post()}
          placeholder="Add a comment…"
          className="input py-2"
        />
        <button onClick={post} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
