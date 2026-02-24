import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronUp, ChevronDown, StickyNote, Sparkles,
  ChevronRight, Target, Loader2,
} from "lucide-react";

interface ActionItem {
  id: string;
  user_id: string;
  analysis_id: string | null;
  text: string;
  notes: string | null;
  position: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface SavedAnalysis {
  id: string;
  title: string;
  avg_revival_score: number;
  analysis_data?: any;
  analysis_type?: string;
  products?: any[];
}

interface AISuggestion {
  text: string;
  projectTitle: string;
  projectId: string;
  priority: "high" | "medium" | "low";
}

export function ActionItemsPanel({ analyses }: { analyses: SavedAnalysis[] }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [newText, setNewText] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<{ id: string; value: string } | null>(null);
  const [editingText, setEditingText] = useState<{ id: string; value: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [generating, setGenerating] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("portfolio_action_items") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    if (data) setItems(data);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const generateAISuggestions = async () => {
    if (analyses.length === 0) {
      toast.info("Run some analyses first to get AI-powered suggestions.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-action-items", {
        body: { analyses: analyses.slice(0, 10) },
      });
      if (error) throw error;
      if (data?.items) {
        setAiSuggestions(data.items);
        if (data.items.length === 0) toast.info("No new suggestions — your portfolio looks well-covered.");
      } else {
        throw new Error(data?.error || "No suggestions returned");
      }
    } catch (err: any) {
      console.error("AI suggestions error:", err);
      const msg = err?.message || "Failed to generate suggestions";
      if (msg.includes("Rate limit")) toast.error("Rate limit reached — try again in a moment.");
      else if (msg.includes("credits")) toast.error("AI credits exhausted. Add credits to continue.");
      else toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const addItem = async (text: string, analysisId?: string) => {
    if (!user || !text.trim()) return;
    const maxPos = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 0;
    const optimistic: ActionItem = {
      id: crypto.randomUUID(),
      user_id: user.id,
      analysis_id: analysisId || null,
      text: text.trim(),
      notes: null,
      position: maxPos,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItems(prev => [...prev, optimistic]);
    setNewText("");
    // Remove from AI suggestions
    setAiSuggestions(prev => prev.filter(s => s.text !== text));
    await (supabase.from("portfolio_action_items") as any).insert({
      user_id: user.id,
      analysis_id: analysisId || null,
      text: text.trim(),
      position: maxPos,
    });
    fetchItems();
  };

  const toggleComplete = async (item: ActionItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    await (supabase.from("portfolio_action_items") as any)
      .update({ completed: !item.completed, updated_at: new Date().toISOString() })
      .eq("id", item.id);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await (supabase.from("portfolio_action_items") as any).delete().eq("id", id);
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const newItems = [...items];
    const posA = newItems[index].position;
    const posB = newItems[swapIdx].position;
    newItems[index] = { ...newItems[index], position: posB };
    newItems[swapIdx] = { ...newItems[swapIdx], position: posA };
    newItems.sort((a, b) => a.position - b.position);
    setItems(newItems);
    await Promise.all([
      (supabase.from("portfolio_action_items") as any).update({ position: posB }).eq("id", items[index].id),
      (supabase.from("portfolio_action_items") as any).update({ position: posA }).eq("id", items[swapIdx].id),
    ]);
  };

  const saveNote = async (id: string, notes: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
    setEditingNote(null);
    await (supabase.from("portfolio_action_items") as any)
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  const saveText = async (id: string, text: string) => {
    if (!text.trim()) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, text } : i));
    setEditingText(null);
    await (supabase.from("portfolio_action_items") as any)
      .update({ text: text.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  const getProjectName = (analysisId: string | null) => {
    if (!analysisId) return null;
    return analyses.find(a => a.id === analysisId)?.title || null;
  };

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  // Filter AI suggestions that haven't already been added
  const visibleSuggestions = aiSuggestions.filter(s => !items.some(i => i.text === s.text));

  const priorityColor = (p: string) => {
    if (p === "high") return { bg: "hsl(0 84% 60% / 0.1)", text: "hsl(0 84% 40%)" };
    if (p === "medium") return { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)" };
    return { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" };
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Action Items</span>
          {activeItems.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              {activeItems.length}
            </span>
          )}
        </div>
        <ChevronRight size={14} className={`text-muted-foreground transition-transform ${collapsed ? "" : "rotate-90"}`} />
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* AI Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI Suggestions</p>
              <button
                onClick={generateAISuggestions}
                disabled={generating || analyses.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors disabled:opacity-40"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
              >
                {generating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {generating ? "Analyzing…" : visibleSuggestions.length > 0 ? "Refresh" : "Generate Suggestions"}
              </button>
            </div>

            {visibleSuggestions.length > 0 && (
              <div className="space-y-1">
                {visibleSuggestions.map((s, idx) => {
                  const pc = priorityColor(s.priority);
                  return (
                    <button
                      key={idx}
                      onClick={() => addItem(s.text, s.projectId)}
                      className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] transition-colors hover:border-primary/40"
                      style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
                    >
                      <Plus size={12} className="text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-relaxed">{s.text}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-muted-foreground">→ {s.projectTitle}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: pc.bg, color: pc.text }}>
                            {s.priority}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!generating && visibleSuggestions.length === 0 && aiSuggestions.length === 0 && analyses.length > 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-1">
                Click "Generate Suggestions" to get AI-powered strategic action items from your analyses.
              </p>
            )}
          </div>

          {/* Add new */}
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem(newText)}
              placeholder="Add action item…"
              className="h-8 text-xs"
            />
            <button
              onClick={() => addItem(newText)}
              disabled={!newText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {/* Active items */}
          {activeItems.length === 0 && completedItems.length === 0 && visibleSuggestions.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-3">No action items yet. Add one or generate AI suggestions.</p>
          )}

          <div className="space-y-1">
            {activeItems.map((item, idx) => (
              <div key={item.id} className="group rounded-lg border border-border p-2 space-y-1" style={{ background: "hsl(var(--background))" }}>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleComplete(item)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {editingText?.id === item.id ? (
                      <Input
                        value={editingText.value}
                        onChange={e => setEditingText({ id: item.id, value: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") saveText(item.id, editingText.value); if (e.key === "Escape") setEditingText(null); }}
                        onBlur={() => saveText(item.id, editingText.value)}
                        className="h-6 text-xs px-1"
                        autoFocus
                      />
                    ) : (
                      <button onClick={() => setEditingText({ id: item.id, value: item.text })} className="text-left text-xs font-medium text-foreground hover:text-primary transition-colors w-full">
                        {item.text}
                      </button>
                    )}
                    {getProjectName(item.analysis_id) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">→ {getProjectName(item.analysis_id)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setExpandedNotes(prev => {
                      const next = new Set(prev);
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                      return next;
                    })} className="p-1 rounded hover:bg-muted" title="Notes">
                      <StickyNote size={11} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => moveItem(idx, "up")} disabled={idx === 0} className="p-1 rounded hover:bg-muted disabled:opacity-20">
                      <ChevronUp size={11} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => moveItem(idx, "down")} disabled={idx === activeItems.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-20">
                      <ChevronDown size={11} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-1 rounded hover:bg-destructive/10">
                      <Trash2 size={11} className="text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Expanded notes */}
                {expandedNotes.has(item.id) && (
                  <div className="ml-6">
                    {editingNote?.id === item.id ? (
                      <div className="space-y-1">
                        <Textarea
                          value={editingNote.value}
                          onChange={e => setEditingNote({ id: item.id, value: e.target.value })}
                          placeholder="Add notes…"
                          className="min-h-[50px] text-xs"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button onClick={() => saveNote(item.id, editingNote.value)} className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Save</button>
                          <button onClick={() => setEditingNote(null)} className="text-[10px] px-2 py-0.5 rounded text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setEditingNote({ id: item.id, value: item.notes || "" })} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-left">
                        {item.notes || "Click to add notes…"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Completed */}
          {completedItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Completed ({completedItems.length})</p>
              {completedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg opacity-50">
                  <Checkbox checked={true} onCheckedChange={() => toggleComplete(item)} className="mt-0" />
                  <span className="text-xs text-muted-foreground line-through flex-1">{item.text}</span>
                  <button onClick={() => deleteItem(item.id)} className="p-1 rounded hover:bg-destructive/10">
                    <Trash2 size={10} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
