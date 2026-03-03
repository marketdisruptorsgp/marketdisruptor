import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  ThumbsUp, ShieldAlert, AlertTriangle, Lightbulb,
  ChevronDown, StickyNote, Sparkles,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";

type Category = "strengths" | "complaints" | "friction" | "requests";

interface DigestNotes {
  checked: Record<string, boolean>;
  notes: Record<string, string>;
}

const CATEGORIES: { key: Category; label: string; icon: React.ElementType; dotClass: string; tabBg: string; tabActive: string }[] = [
  { key: "strengths", label: "Strengths", icon: ThumbsUp, dotClass: "bg-green-500", tabBg: "bg-green-500/10 text-green-700", tabActive: "bg-green-600 text-white" },
  { key: "complaints", label: "Complaints", icon: ShieldAlert, dotClass: "bg-red-500", tabBg: "bg-red-500/10 text-red-700", tabActive: "bg-red-500 text-white" },
  { key: "friction", label: "Friction", icon: AlertTriangle, dotClass: "bg-amber-500", tabBg: "bg-amber-500/10 text-amber-700", tabActive: "bg-amber-500 text-white" },
  { key: "requests", label: "Requests", icon: Lightbulb, dotClass: "bg-blue-500", tabBg: "bg-blue-500/10 text-blue-700", tabActive: "bg-blue-500 text-white" },
];

function extractSignals(product: Product): Record<Category, string[]> {
  const ci = (product as any).communityInsights;
  const uw = (product as any).userWorkflow;

  const strengths: string[] = [];
  if (product.keyInsight) strengths.push(product.keyInsight);
  if (product.reviews?.length) {
    product.reviews.filter((r: any) => r.sentiment === "positive").forEach((r: any) => {
      if (r.text && !strengths.includes(r.text)) strengths.push(r.text);
    });
  }
  const cs = product.confidenceScores;
  if (cs) {
    if ((cs.adoptionLikelihood ?? 0) >= 8) strengths.push(`High adoption likelihood (${cs.adoptionLikelihood}/10)`);
    if ((cs.emotionalResonance ?? 0) >= 8) strengths.push(`Strong emotional resonance (${cs.emotionalResonance}/10)`);
  }

  const complaints: string[] = ci?.topComplaints?.slice() || [];
  if (product.reviews?.length) {
    product.reviews.filter((r: any) => r.sentiment === "negative").forEach((r: any) => {
      if (r.text && !complaints.includes(r.text)) complaints.push(r.text);
    });
  }

  const friction: string[] = [];
  if (uw?.frictionPoints?.length) {
    uw.frictionPoints.forEach((fp: any) => {
      const text = typeof fp === "string" ? fp : fp.description || fp.label || fp.point || JSON.stringify(fp);
      friction.push(text);
    });
  }

  const requests: string[] = ci?.improvementRequests?.slice() || [];

  return { strengths, complaints, friction, requests };
}

export function IntelDigest({
  product,
  analysisId,
  saveStepData,
}: {
  product: Product;
  analysisId: string | null;
  saveStepData: (key: string, data: unknown) => Promise<void>;
}) {
  const signals = React.useMemo(() => extractSignals(product), [product]);
  const totalSignals = Object.values(signals).reduce((s, arr) => s + arr.length, 0);

  // Find first non-empty category
  const defaultTab = CATEGORIES.find(c => signals[c.key].length > 0)?.key || "strengths";
  const [activeTab, setActiveTab] = useState<Category>(defaultTab);
  const [digestNotes, setDigestNotes] = useState<DigestNotes>({ checked: {}, notes: {} });
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted notes
  useEffect(() => {
    if (!analysisId || loaded) return;
    (async () => {
      const { data } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", analysisId)
        .single();
      const ad = data?.analysis_data as Record<string, unknown> | null;
      if (ad?.intelDigestNotes) {
        setDigestNotes(ad.intelDigestNotes as DigestNotes);
      }
      setLoaded(true);
    })();
  }, [analysisId, loaded]);

  const persist = useCallback(
    (next: DigestNotes) => {
      setDigestNotes(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveStepData("intelDigestNotes", next);
      }, 800);
    },
    [saveStepData]
  );

  const toggleCheck = useCallback(
    (signal: string) => {
      const next = {
        ...digestNotes,
        checked: { ...digestNotes.checked, [signal]: !digestNotes.checked[signal] },
      };
      persist(next);
    },
    [digestNotes, persist]
  );

  const updateNote = useCallback(
    (signal: string, text: string) => {
      const next = {
        ...digestNotes,
        notes: { ...digestNotes.notes, [signal]: text },
      };
      persist(next);
    },
    [digestNotes, persist]
  );

  if (totalSignals === 0) return null;

  const activeSignals = signals[activeTab];
  const activeCat = CATEGORIES.find(c => c.key === activeTab)!;
  const checkedCount = Object.values(digestNotes.checked).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Intel Digest</span>
          <span className="text-xs text-muted-foreground">
            {totalSignals} signals
          </span>
        </div>
        {checkedCount > 0 && (
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {checkedCount} marked
          </span>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border">
        {CATEGORIES.map((cat) => {
          const count = signals[cat.key].length;
          const isActive = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-all ${
                isActive ? cat.tabActive : count > 0 ? cat.tabBg : "bg-muted/50 text-muted-foreground"
              }`}
              disabled={count === 0}
            >
              <cat.icon size={12} />
              {cat.label}
              {count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/25" : "bg-foreground/10"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Signal Rows */}
      <div className="divide-y divide-border">
        {activeSignals.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            No {activeCat.label.toLowerCase()} detected.
          </div>
        ) : (
          activeSignals.map((signal, idx) => {
            const isChecked = !!digestNotes.checked[signal];
            const note = digestNotes.notes[signal] || "";

            return (
              <Collapsible key={`${activeTab}-${idx}`}>
                <div className="group">
                  {/* Main row */}
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCheck(signal)}
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    {/* Dot + Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${activeCat.dotClass}`} />
                        <p className={`text-[13px] leading-relaxed text-foreground ${isChecked ? "font-semibold" : ""}`}>
                          {signal}
                        </p>
                      </div>
                    </div>

                    {/* Expand trigger */}
                    <CollapsibleTrigger asChild>
                      <button className="mt-0.5 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                        <ChevronDown size={14} className="transition-transform [[data-state=open]_&]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Expandable Note */}
                  <CollapsibleContent>
                    <div className="px-4 pb-3 pl-11">
                      <div className="flex items-start gap-2">
                        <StickyNote size={11} className="text-muted-foreground mt-1.5 flex-shrink-0" />
                        <textarea
                          className="w-full text-xs leading-relaxed text-foreground bg-muted/50 border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
                          placeholder="Add a note about this signal…"
                          rows={2}
                          value={note}
                          onChange={(e) => updateNote(signal, e.target.value)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}
