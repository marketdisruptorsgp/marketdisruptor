/**
 * Due Diligence Killer Questions
 * Hard-hitting questions generated from extracted data and risk signals.
 * Organized by category with severity indicators.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair, ChevronDown, ChevronUp, AlertTriangle, Users, DollarSign,
  Shield, Building, TrendingDown, Copy, Check,
} from "lucide-react";
import { extractFinancialInputs, type ETAFinancialInputs } from "@/lib/etaScoringEngine";

interface QuestionCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  questions: DueDiligenceQuestion[];
}

interface DueDiligenceQuestion {
  question: string;
  why: string;
  severity: "critical" | "high" | "medium";
  dataTriggered: boolean;
}

interface DueDiligenceQuestionsProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
}

function generateQuestions(
  inputs: ETAFinancialInputs,
  biExtraction: Record<string, any> | null,
): QuestionCategory[] {
  const categories: QuestionCategory[] = [];
  const bi = biExtraction || {};
  const eta = bi?.eta_assessment || {};

  // ── FINANCIAL INTEGRITY ──
  const financialQs: DueDiligenceQuestion[] = [
    {
      question: "Can you provide 3 years of tax returns — not internal P&Ls — to verify stated revenue and SDE?",
      why: "Internal financials can be dressed up. Tax returns are filed under penalty of perjury.",
      severity: "critical",
      dataTriggered: true,
    },
    {
      question: "Walk me through every single addback line by line. Which ones disappear if you're not the owner?",
      why: "Inflated addbacks are the #1 way sellers overstate SDE. Each must be independently verifiable.",
      severity: "critical",
      dataTriggered: !!eta?.financial_snapshot?.claimed_addbacks?.length,
    },
  ];

  if (inputs.sdeMargin != null && inputs.sdeMargin < 0.20) {
    financialQs.push({
      question: `Your SDE margin is ${(inputs.sdeMargin * 100).toFixed(0)}%. What's preventing you from raising prices or cutting costs to improve it?`,
      why: "Thin margins leave zero room for debt service surprises, new-owner salary, or growth investment.",
      severity: "high",
      dataTriggered: true,
    });
  }

  if (inputs.revenue && inputs.sde && inputs.askingPrice) {
    const multiple = inputs.askingPrice / inputs.sde;
    if (multiple > 4) {
      financialQs.push({
        question: `At ${multiple.toFixed(1)}x SDE, what specifically justifies a premium multiple versus the industry norm of 2.5–3.5x?`,
        why: "Premium multiples require provable growth trajectory, proprietary advantages, or locked-in recurring revenue.",
        severity: "high",
        dataTriggered: true,
      });
    }
  }

  financialQs.push({
    question: "What percentage of revenue is collected in cash, and how is it tracked?",
    why: "Cash-heavy businesses may have unreported revenue — or reported revenue that doesn't actually exist.",
    severity: "high",
    dataTriggered: false,
  });

  financialQs.push({
    question: "Show me working capital needs month by month. What's the worst cash-flow gap in the last 3 years?",
    why: "Seasonal cash crunches can kill a leveraged acquisition. SBA loans don't care about your slow season.",
    severity: "medium",
    dataTriggered: false,
  });

  categories.push({
    id: "financial",
    label: "Financial Integrity",
    icon: <DollarSign size={13} />,
    questions: financialQs,
  });

  // ── CUSTOMER CONCENTRATION ──
  const customerQs: DueDiligenceQuestion[] = [];

  if (inputs.customerConcentration != null && inputs.customerConcentration > 0.15) {
    customerQs.push({
      question: `Your top customer is ${(inputs.customerConcentration * 100).toFixed(0)}% of revenue. Do they have a written contract? What's the renewal date? Have they ever threatened to leave?`,
      why: "If this customer leaves post-acquisition, the business may not cover debt service.",
      severity: "critical",
      dataTriggered: true,
    });
  }

  customerQs.push({
    question: "If I called your top 5 customers today and told them you sold the business, how many would stay?",
    why: "Customer relationships often follow the owner, not the business. This is the single biggest post-close risk.",
    severity: "critical",
    dataTriggered: false,
  });

  customerQs.push({
    question: "What's your customer churn rate? How many customers from 3 years ago are still active?",
    why: "High churn means you're on a treadmill — constantly replacing lost revenue just to stay flat.",
    severity: "high",
    dataTriggered: false,
  });

  customerQs.push({
    question: "How do new customers find you? What happens to lead flow when you're no longer the face of the business?",
    why: "If the owner IS the sales engine, the buyer is purchasing a job, not a business.",
    severity: "high",
    dataTriggered: false,
  });

  categories.push({
    id: "customers",
    label: "Customer & Revenue Risk",
    icon: <Users size={13} />,
    questions: customerQs,
  });

  // ── OWNER DEPENDENCY ──
  const ownerQs: DueDiligenceQuestion[] = [];

  const ownerDep = inputs.ownerDependency;
  if (ownerDep === "dependent" || ownerDep === "owner_critical") {
    ownerQs.push({
      question: "If you were hit by a bus tomorrow, could this business operate for 90 days without you?",
      why: "If the answer is no, the 'business' is really a well-paying job disguised as an asset.",
      severity: "critical",
      dataTriggered: true,
    });
  }

  ownerQs.push({
    question: "Which employees would quit within 6 months of a sale? Be honest.",
    why: "Key person departures post-close are a leading cause of acquisition failure in SMBs.",
    severity: "critical",
    dataTriggered: false,
  });

  ownerQs.push({
    question: "Are all vendor relationships, licenses, and contracts in the company name — or yours personally?",
    why: "Personal relationships and contracts don't transfer. If key vendor terms are owner-dependent, they're at risk.",
    severity: "high",
    dataTriggered: false,
  });

  const ownerDeps = eta?.owner_dependencies || [];
  if (ownerDeps.some((d: any) => d.severity === "critical")) {
    ownerQs.push({
      question: "What specific steps have you taken to remove yourself from day-to-day operations in the last 12 months?",
      why: "Sellers who promise 'easy transition' but haven't started delegating are selling a fantasy.",
      severity: "high",
      dataTriggered: true,
    });
  }

  categories.push({
    id: "owner",
    label: "Owner Dependency",
    icon: <Building size={13} />,
    questions: ownerQs,
  });

  // ── HIDDEN LIABILITIES ──
  const liabilityQs: DueDiligenceQuestion[] = [
    {
      question: "Are there any pending or threatened lawsuits, regulatory actions, or environmental issues?",
      why: "Hidden liabilities can surface post-close and blow up your entire return model.",
      severity: "critical",
      dataTriggered: false,
    },
    {
      question: "When was your last tax audit? Are all payroll taxes, sales taxes, and 1099s current?",
      why: "Tax liability transfers with the business in asset sales. Unpaid taxes become YOUR problem.",
      severity: "critical",
      dataTriggered: false,
    },
    {
      question: "Is any equipment leased, financed, or subject to liens? Can I see the full liability schedule?",
      why: "Hidden debt and equipment liens reduce the actual equity value you're buying.",
      severity: "high",
      dataTriggered: false,
    },
    {
      question: "Are there any deferred maintenance issues — facilities, equipment, technology — that would require immediate capital?",
      why: "Sellers often defer spending to inflate SDE in the sale year. You inherit the deferred costs.",
      severity: "high",
      dataTriggered: false,
    },
  ];

  categories.push({
    id: "liabilities",
    label: "Hidden Liabilities",
    icon: <Shield size={13} />,
    questions: liabilityQs,
  });

  // ── MARKET & COMPETITIVE ──
  const marketQs: DueDiligenceQuestion[] = [
    {
      question: "What's the biggest competitive threat to this business in the next 3 years, and what have you done about it?",
      why: "If the seller can't name specific threats, they either don't understand their market or aren't being honest.",
      severity: "high",
      dataTriggered: false,
    },
    {
      question: "Has any new competitor entered your market in the last 2 years? Did you lose any customers to them?",
      why: "New entrants signal market attractiveness — but also pricing pressure and share erosion.",
      severity: "medium",
      dataTriggered: false,
    },
    {
      question: "Could a technology shift, regulation change, or platform dependency make this business model obsolete?",
      why: "Structural disruption risk isn't reflected in historical financials. It's a forward-looking kill risk.",
      severity: "high",
      dataTriggered: false,
    },
  ];

  if (inputs.revenueGrowthPct != null && inputs.revenueGrowthPct < 0) {
    marketQs.unshift({
      question: `Revenue declined ${Math.abs(inputs.revenueGrowthPct).toFixed(0)}%. Is this a market contraction, competitive loss, or one-time event? Show me the evidence.`,
      why: "Declining revenue in a business for sale is a massive red flag. The seller may be exiting a sinking ship.",
      severity: "critical",
      dataTriggered: true,
    });
  }

  categories.push({
    id: "market",
    label: "Market & Competitive",
    icon: <TrendingDown size={13} />,
    questions: marketQs,
  });

  // ── THE KILLER QUESTION ──
  categories.push({
    id: "killer",
    label: "The Question They Don't Want to Answer",
    icon: <Crosshair size={13} />,
    questions: [
      {
        question: "If this business is as good as you say, why are you selling it?",
        why: "The answer reveals everything. Health, burnout, and retirement are valid. 'Great opportunity for someone else' is not.",
        severity: "critical",
        dataTriggered: false,
      },
      {
        question: "Would you be willing to carry 10–20% of the purchase price as a seller note with a 2-year earnout tied to performance?",
        why: "Sellers who believe in their numbers will put skin in the game. Those who won't are telling you something.",
        severity: "critical",
        dataTriggered: false,
      },
    ],
  });

  return categories;
}

const SEVERITY_STYLES = {
  critical: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.25)", text: "hsl(var(--destructive))", label: "CRITICAL" },
  high: { bg: "hsl(var(--warning, 38 92% 50%) / 0.08)", border: "hsl(var(--warning, 38 92% 50%) / 0.25)", text: "hsl(38, 92%, 45%)", label: "HIGH" },
  medium: { bg: "hsl(var(--muted) / 0.5)", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))", label: "MEDIUM" },
};

export const DueDiligenceQuestions = memo(function DueDiligenceQuestions({
  biExtraction,
  governedData,
}: DueDiligenceQuestionsProps) {
  const inputs = useMemo(
    () => extractFinancialInputs(governedData, biExtraction),
    [biExtraction, governedData],
  );
  const categories = useMemo(() => generateQuestions(inputs, biExtraction), [inputs, biExtraction]);
  const [expandedCat, setExpandedCat] = useState<string | null>("killer");
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  const totalQuestions = categories.reduce((s, c) => s + c.questions.length, 0);
  const criticalCount = categories.reduce((s, c) => s + c.questions.filter(q => q.severity === "critical").length, 0);

  const handleCopy = (question: string, id: string) => {
    navigator.clipboard.writeText(question);
    setCopiedIdx(id);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--destructive) / 0.12)" }}>
              <Crosshair size={14} style={{ color: "hsl(var(--destructive))" }} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Due Diligence Interrogation</h3>
              <p className="text-[10px] text-muted-foreground">
                {totalQuestions} questions · {criticalCount} critical · Don't buy without answers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} style={{ color: "hsl(var(--destructive))" }} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--destructive))" }}>
              Ask Before You Sign
            </span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 pb-4 space-y-1">
        {categories.map(cat => (
          <div key={cat.id} className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
            <button
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{cat.icon}</span>
                <span className="text-xs font-bold text-foreground">{cat.label}</span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  ({cat.questions.length})
                </span>
                {cat.questions.some(q => q.dataTriggered) && (
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                    DATA-TRIGGERED
                  </span>
                )}
              </div>
              {expandedCat === cat.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {expandedCat === cat.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    {cat.questions.map((q, i) => {
                      const sev = SEVERITY_STYLES[q.severity];
                      const qId = `${cat.id}-${i}`;
                      return (
                        <div
                          key={i}
                          className="rounded-lg p-3 space-y-2"
                          style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-foreground leading-snug flex-1">
                              "{q.question}"
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: sev.text, background: `${sev.text}15` }}>
                                {sev.label}
                              </span>
                              <button
                                onClick={() => handleCopy(q.question, qId)}
                                className="p-1 rounded hover:bg-muted/50 transition-colors"
                                title="Copy question"
                              >
                                {copiedIdx === qId
                                  ? <Check size={11} className="text-green-600" />
                                  : <Copy size={11} className="text-muted-foreground" />}
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-snug italic">
                            Why: {q.why}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
