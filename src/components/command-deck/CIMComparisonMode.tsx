/**
 * CIM Comparison Mode
 * 
 * Side-by-side comparison of 2-3 saved analyses.
 * Highlights which deal has better risk/reward on key dimensions.
 */

import { memo, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GitCompare, ChevronDown, ChevronUp, Trophy, AlertTriangle,
  CheckCircle2, XCircle, Minus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractFinancialInputs, type ETAFinancialInputs } from "@/lib/etaScoringEngine";
import { ProvenanceBadge } from "./ProvenanceBadge";

interface CIMComparisonModeProps {
  currentAnalysisId: string;
  currentBiExtraction: Record<string, any> | null;
  currentGovernedData: Record<string, any> | null;
}

interface ComparisonRow {
  label: string;
  values: (string | null)[];
  winner: number | null; // index, null = tie
  direction: "higher_better" | "lower_better" | "neutral";
}

interface AnalysisSummary {
  id: string;
  title: string;
  inputs: ETAFinancialInputs;
  bi: Record<string, any> | null;
}

function formatVal(v: number | undefined | null, type: "currency" | "pct" | "multiple" | "count" | "years"): string | null {
  if (v == null) return null;
  switch (type) {
    case "currency": return v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1e3).toFixed(0)}K`;
    case "pct": return `${(v * 100).toFixed(0)}%`;
    case "multiple": return `${v.toFixed(1)}x`;
    case "count": return `${v}`;
    case "years": return `${v} yrs`;
  }
}

function buildComparison(analyses: AnalysisSummary[]): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // Revenue
  const revs = analyses.map(a => a.inputs.revenue);
  rows.push({
    label: "Revenue",
    values: revs.map(r => formatVal(r, "currency")),
    winner: findWinner(revs, "higher_better"),
    direction: "higher_better",
  });

  // SDE
  const sdes = analyses.map(a => a.inputs.sde);
  rows.push({
    label: "SDE",
    values: sdes.map(s => formatVal(s, "currency")),
    winner: findWinner(sdes, "higher_better"),
    direction: "higher_better",
  });

  // SDE Margin
  const margins = analyses.map(a => a.inputs.sdeMargin);
  rows.push({
    label: "SDE Margin",
    values: margins.map(m => formatVal(m, "pct")),
    winner: findWinner(margins, "higher_better"),
    direction: "higher_better",
  });

  // Asking Price
  const prices = analyses.map(a => a.inputs.askingPrice);
  rows.push({
    label: "Asking Price",
    values: prices.map(p => formatVal(p, "currency")),
    winner: findWinner(prices, "lower_better"),
    direction: "lower_better",
  });

  // Multiple
  const multiples = analyses.map(a =>
    a.inputs.askingPrice && a.inputs.sde ? a.inputs.askingPrice / a.inputs.sde : null
  );
  rows.push({
    label: "Valuation Multiple",
    values: multiples.map(m => m != null ? formatVal(m, "multiple") : null),
    winner: findWinner(multiples as (number | undefined)[], "lower_better"),
    direction: "lower_better",
  });

  // Customer Concentration
  const conc = analyses.map(a => a.inputs.customerConcentration);
  rows.push({
    label: "Customer Concentration",
    values: conc.map(c => formatVal(c, "pct")),
    winner: findWinner(conc, "lower_better"),
    direction: "lower_better",
  });

  // Employees
  const emps = analyses.map(a => a.inputs.employeeCount);
  rows.push({
    label: "Team Size",
    values: emps.map(e => formatVal(e, "count")),
    winner: findWinner(emps, "higher_better"),
    direction: "higher_better",
  });

  // Years in Business
  const yrs = analyses.map(a => a.inputs.yearsInBusiness);
  rows.push({
    label: "Years in Business",
    values: yrs.map(y => formatVal(y, "years")),
    winner: findWinner(yrs, "higher_better"),
    direction: "higher_better",
  });

  // Recurring Revenue
  const rec = analyses.map(a => a.inputs.recurringRevenuePct);
  rows.push({
    label: "Recurring Revenue",
    values: rec.map(r => formatVal(r, "pct")),
    winner: findWinner(rec, "higher_better"),
    direction: "higher_better",
  });

  return rows.filter(r => r.values.some(v => v != null));
}

function findWinner(values: (number | undefined | null)[], direction: "higher_better" | "lower_better"): number | null {
  const valid = values.map((v, i) => v != null ? { v, i } : null).filter(Boolean) as { v: number; i: number }[];
  if (valid.length < 2) return null;
  valid.sort((a, b) => direction === "higher_better" ? b.v - a.v : a.v - b.v);
  if (valid[0].v === valid[1].v) return null;
  return valid[0].i;
}

export const CIMComparisonMode = memo(function CIMComparisonMode({
  currentAnalysisId, currentBiExtraction, currentGovernedData,
}: CIMComparisonModeProps) {
  const [expanded, setExpanded] = useState(false);
  const [otherAnalyses, setOtherAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [available, setAvailable] = useState<{ id: string; title: string }[]>([]);

  const currentInputs = useMemo(() => extractFinancialInputs(currentGovernedData, currentBiExtraction), [currentBiExtraction, currentGovernedData]);
  const currentTitle = currentBiExtraction?.business_overview?.company_name || "Current Analysis";

  // Load available analyses
  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    supabase
      .from("saved_analyses")
      .select("id, title")
      .neq("id", currentAnalysisId)
      .eq("analysis_type", "business_model")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAvailable((data || []).map(d => ({ id: d.id, title: d.title })));
        setLoading(false);
      });
  }, [expanded, currentAnalysisId]);

  // Load selected analyses data
  useEffect(() => {
    if (selectedIds.length === 0) { setOtherAnalyses([]); return; }
    Promise.all(selectedIds.map(async (id) => {
      const { data } = await supabase.from("saved_analyses").select("id, title, analysis_data").eq("id", id).single();
      if (!data) return null;
      const ad = data.analysis_data as Record<string, any> | null;
      const bi = ad?.biExtraction || null;
      const gov = ad?.governedData || null;
      return {
        id: data.id,
        title: data.title,
        inputs: extractFinancialInputs(gov, bi),
        bi,
      } as AnalysisSummary;
    })).then(results => setOtherAnalyses(results.filter(Boolean) as AnalysisSummary[]));
  }, [selectedIds]);

  const allAnalyses: AnalysisSummary[] = [
    { id: currentAnalysisId, title: currentTitle, inputs: currentInputs, bi: currentBiExtraction },
    ...otherAnalyses,
  ];
  const comparison = useMemo(() => allAnalyses.length >= 2 ? buildComparison(allAnalyses) : [], [allAnalyses]);

  // Win counts
  const winCounts = allAnalyses.map((_, i) => comparison.filter(r => r.winner === i).length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(262, 83%, 58% / 0.12)" }}>
            <GitCompare size={14} style={{ color: "hsl(262, 83%, 58%)" }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-foreground">Compare Deals</h3>
            <p className="text-[10px] text-muted-foreground">Side-by-side CIM comparison</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-4 space-y-3"
        >
          {/* Selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select analyses to compare (up to 2)</p>
            {loading ? (
              <p className="text-[10px] text-muted-foreground">Loading...</p>
            ) : available.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">No other business analyses found. Run more CIM analyses to compare.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {available.slice(0, 10).map(a => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        if (isSelected) setSelectedIds(prev => prev.filter(id => id !== a.id));
                        else if (selectedIds.length < 2) setSelectedIds(prev => [...prev, a.id]);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: isSelected ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.3)",
                        color: isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                        border: `1px solid ${isSelected ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
                      }}
                    >
                      {a.title.slice(0, 30)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comparison Table */}
          {comparison.length > 0 && (
            <div className="space-y-2">
              {/* Headers */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `140px repeat(${allAnalyses.length}, 1fr)` }}>
                <div />
                {allAnalyses.map((a, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] font-black text-foreground truncate">{a.title.slice(0, 20)}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Trophy size={9} style={{ color: "hsl(38, 92%, 50%)" }} />
                      <span className="text-[9px] font-bold" style={{ color: "hsl(38, 92%, 50%)" }}>{winCounts[i]} wins</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {comparison.map((row, ri) => (
                <div
                  key={ri}
                  className="grid gap-2 rounded-lg p-2"
                  style={{
                    gridTemplateColumns: `140px repeat(${allAnalyses.length}, 1fr)`,
                    background: ri % 2 === 0 ? "hsl(var(--muted) / 0.15)" : "transparent",
                  }}
                >
                  <span className="text-[10px] font-bold text-muted-foreground self-center">{row.label}</span>
                  {row.values.map((v, vi) => (
                    <div key={vi} className="flex items-center justify-center gap-1">
                      <span className={`text-[11px] font-bold ${row.winner === vi ? "text-foreground" : "text-muted-foreground"}`}>
                        {v || "—"}
                      </span>
                      {row.winner === vi && <CheckCircle2 size={10} style={{ color: "hsl(142, 71%, 45%)" }} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});
