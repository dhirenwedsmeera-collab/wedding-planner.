"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { KeyDecision } from "@/types/domain";

export function KeyDecisionsWidget({ initialDecisions, isAdmin }: { initialDecisions: KeyDecision[]; isAdmin: boolean }) {
  const [decisions, setDecisions] = useState(initialDecisions);
  const supabase = createClient();
  const decidedCount = decisions.filter((d) => d.status === "decided").length;

  async function toggle(d: KeyDecision) {
    if (!isAdmin) return;
    const newStatus = d.status === "decided" ? "pending" : "decided";
    setDecisions((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: newStatus } : x)));
    await supabase.from("key_decisions").update({ status: newStatus }).eq("id", d.id);
  }

  async function saveAnswer(d: KeyDecision, answer: string) {
    const status = answer.trim() ? "decided" : d.status;
    setDecisions((prev) => prev.map((x) => (x.id === d.id ? { ...x, answer, status } : x)));
    await supabase.from("key_decisions").update({ answer, status }).eq("id", d.id);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Key Decisions</CardTitle>
        <span className="text-xs text-muted-foreground">{decidedCount}/{decisions.length} decided</span>
      </CardHeader>
      <CardContent className="space-y-2">
        {decisions.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No open decisions — nice!</p>}
        {decisions
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((d) => (
            <DecisionRow key={d.id} decision={d} isAdmin={isAdmin} onToggle={() => toggle(d)} onSaveAnswer={(a) => saveAnswer(d, a)} />
          ))}
        {isAdmin && <AddDecisionDialog onCreated={(d) => setDecisions((prev) => [...prev, d])} nextOrder={decisions.length} />}
      </CardContent>
    </Card>
  );
}

function DecisionRow({
  decision, isAdmin, onToggle, onSaveAnswer,
}: { decision: KeyDecision; isAdmin: boolean; onToggle: () => void; onSaveAnswer: (a: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(decision.answer ?? "");
  const decided = decision.status === "decided";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${decided ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-border"}`}>
      <div className="flex items-start gap-2.5">
        <button onClick={onToggle} disabled={!isAdmin} className="mt-0.5 shrink-0 disabled:cursor-default">
          {decided ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm ${decided ? "font-medium" : ""}`}>{decision.label}</p>
            {decision.category && <Badge variant="outline">{decision.category}</Badge>}
          </div>
          {editing ? (
            <div className="mt-1.5 flex gap-2">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (onSaveAnswer(answer), setEditing(false))}
                placeholder="Add the answer once decided…"
                className="input py-1.5 text-xs"
                autoFocus
              />
              <Button size="sm" onClick={() => { onSaveAnswer(answer); setEditing(false); }}>Save</Button>
            </div>
          ) : decision.answer ? (
            <button onClick={() => isAdmin && setEditing(true)} className="mt-0.5 text-left text-xs text-emerald-700 hover:underline dark:text-emerald-400">
              {decision.answer}
            </button>
          ) : (
            isAdmin && (
              <button onClick={() => setEditing(true)} className="mt-0.5 text-left text-xs text-muted-foreground hover:underline">
                + add answer
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function AddDecisionDialog({ onCreated, nextOrder }: { onCreated: (d: KeyDecision) => void; nextOrder: number }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");

  async function create() {
    if (!label.trim()) return;
    const { data, error } = await supabase
      .from("key_decisions")
      .insert({ label, category: category || null, sort_order: nextOrder })
      .select()
      .single();
    if (!error && data) onCreated(data as KeyDecision);
    setOpen(false);
    setLabel(""); setCategory("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:border-gold-400 hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add a decision to track
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a decision</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input className="input" placeholder="e.g. Photographer booking" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="input" placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Button className="w-full" onClick={create}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
