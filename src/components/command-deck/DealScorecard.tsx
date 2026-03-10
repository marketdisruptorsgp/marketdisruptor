/**
 * Deal Scorecard / Kill Sheet
 * 
 * One-page visual verdict: "Should I buy this business?"
 * Shows go/no-go signals, red flags, and deal structure recommendation.
 * All from extracted data — no generic filler.
 */

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Target, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  DollarSign, Users, Building, TrendingUp, Shield, Zap,
} from "lucide-react";
import { extractFinancialInputs } from "@/lib/etaScoringEngine";
import { ProvenanceBadge, type ProvenanceSource } from "./ProvenanceBadge";

interface DealScorecardProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
}

interface Signal {
  label: string;
  status: "go" | "caution" | "no-go";
  detail: string;
  source: string;
  provenance: ProvenanceSource;
}

interface DealStructure {
  label: string;
  value: string;
  note?: string;
}

function buildSignals(
  inputs: ReturnType<typeof extractFinancialInputs>,
  bi: Record<string, any> | null,
): Signal[] {
  const signals: Signal[] = [];
  const eta = bi?.eta_assessment || {};

  // SDE Margin
  if (inputs.sdeMargin != null) {
    const pct = (inputs.sdeMargin * 100).toFixed(0);
    signals.push({
      label: "SDE Margin",
      status: inputs.sdeMargin >= 0.25 ? "go" : inputs.sdeMargin >= 0.15 ? "caution" : "no-go",
      detail: `${pct}% — ${inputs.sdeMargin >= 0.25 ? "Healthy margin for debt service" : inputs.sdeMargin >= 0.15 ? "Tight — limited room for surprises" : "Dangerously thin for leveraged acquisition"}`,
      source: "Financial extraction",
      provenance: "cim",
    });
  }

  // Customer concentration
  if (inputs.customerConcentration != null) {
    const pct = (inputs.customerConcentration * 100).toFixed(0);
    signals.push({
      label: "Customer Concentration",
      status: inputs.customerConcentration <= 0.10 ? "go" : inputs.customerConcentration <= 0.25 ? "caution" : "no-go",
      detail: `Top customer = ${pct}% of revenue`,
      source: "Revenue analysis",
      provenance: "cim",
    });
  }

  // Owner dependency
  if (inputs.ownerDependency) {
    const dep = inputs.ownerDependency;
    signals.push({
      label: "Owner Dependency",
      status: dep === "autonomous" || dep === "delegated" ? "go" : dep === "involved" ? "caution" : "no-go",
      detail: `${dep.replace("_", " ")} — ${dep === "autonomous" || dep === "delegated" ? "Business runs independently" : dep === "involved" ? "Owner involved but not critical" : "Owner IS the business"}`,
      source: "Operational assessment",
      provenance: "cim",
    });
  }

  // Revenue growth
  if (inputs.revenueGrowthPct != null) {
    signals.push({
      label: "Revenue Trend",
      status: inputs.revenueGrowthPct >= 5 ? "go" : inputs.revenueGrowthPct >= 0 ? "caution" : "no-go",
      detail: `${inputs.revenueGrowthPct >= 0 ? "+" : ""}${inputs.revenueGrowthPct.toFixed(0)}% — ${inputs.revenueGrowthPct >= 5 ? "Growing" : inputs.revenueGrowthPct >= 0 ? "Flat — needs investigation" : "Declining — red flag"}`,
      source: "Financial trend",
      provenance: "cim",
    });
  }

  // Recurring revenue
  if (inputs.recurringRevenuePct != null) {
    const pct = (inputs.recurringRevenuePct * 100).toFixed(0);
    signals.push({
      label: "Revenue Quality",
      status: inputs.recurringRevenuePct >= 0.50 ? "go" : inputs.recurringRevenuePct >= 0.25 ? "caution" : "no-go",
      detail: `${pct}% recurring — ${inputs.recurringRevenuePct >= 0.50 ? "Strong base" : inputs.recurringRevenuePct >= 0.25 ? "Some predictability" : "Mostly project-based"}`,
      source: "Revenue model",
      provenance: "cim",
    });
  }

  // Valuation multiple
  if (inputs.revenue && inputs.sde && inputs.askingPrice) {
    const multiple = inputs.askingPrice / inputs.sde;
    signals.push({
      label: "Valuation Multiple",
      status: multiple <= 3.5 ? "go" : multiple <= 4.5 ? "caution" : "no-go",
      detail: `${multiple.toFixed(1)}x SDE — ${multiple <= 3.5 ? "Fair market range" : multiple <= 4.5 ? "Premium — needs justification" : "Overpriced for SMB acquisition"}`,
      source: "Deal economics",
    });
  }

  // Employee count / team depth
  if (inputs.employeeCount != null) {
    signals.push({
      label: "Team Depth",
      status: inputs.employeeCount >= 10 ? "go" : inputs.employeeCount >= 5 ? "caution" : "no-go",
      detail: `${inputs.employeeCount} employees — ${inputs.employeeCount >= 10 ? "Operational redundancy" : inputs.employeeCount >= 5 ? "Thin team — key person risk" : "Micro-team — single-point failures"}`,
      source: "Operational data",
    });
  }

  // Years in business
  if (inputs.yearsInBusiness != null) {
    signals.push({
      label: "Business Maturity",
      status: inputs.yearsInBusiness >= 10 ? "go" : inputs.yearsInBusiness >= 5 ? "caution" : "no-go",
      detail: `${inputs.yearsInBusiness} years — ${inputs.yearsInBusiness >= 10 ? "Proven durability" : inputs.yearsInBusiness >= 5 ? "Established but test cycles" : "Early stage — limited track record"}`,
      source: "Business history",
    });
  }

  // Constraints as caution signals
  const constraints = Array.isArray(bi?.constraints) ? bi.constraints : [];
  const criticalConstraints = constraints.filter((c: any) => c?.confidence === "high");
  if (criticalConstraints.length > 0) {
    signals.push({
      label: "Structural Constraints",
      status: criticalConstraints.length <= 1 ? "caution" : "no-go",
      detail: `${criticalConstraints.length} high-confidence constraint${criticalConstraints.length > 1 ? "s" : ""} identified`,
      source: "Constraint analysis",
    });
  }

  return signals;
}

function buildDealStructure(inputs: ReturnType<typeof extractFinancialInputs>): DealStructure[] {
  const structure: DealStructure[] = [];

  if (inputs.askingPrice) {
    structure.push({ label: "Asking Price", value: `$${(inputs.askingPrice / 1e6).toFixed(2)}M` });
  }
  if (inputs.sde) {
    structure.push({ label: "SDE", value: `$${(inputs.sde / 1e3).toFixed(0)}K` });
  }

  // SBA 7(a) modeling
  if (inputs.askingPrice && inputs.sde) {
    const sbaDown = inputs.askingPrice * 0.10;
    const sbaLoan = inputs.askingPrice * 0.80;
    const sellerNote = inputs.askingPrice * 0.10;
    const annualDebtService = sbaLoan * 0.094; // ~9.4% amortized over 10yr
    const dscr = inputs.sde / annualDebtService;

    structure.push({ label: "Suggested Down Payment (10%)", value: `$${(sbaDown / 1e3).toFixed(0)}K` });
    structure.push({ label: "SBA 7(a) Loan (80%)", value: `$${(sbaLoan / 1e3).toFixed(0)}K`, note: "10-year term, ~9-10% rate" });
    structure.push({ label: "Seller Note (10%)", value: `$${(sellerNote / 1e3).toFixed(0)}K`, note: "2-year standby, 6% interest" });
    structure.push({
      label: "Est. DSCR",
      value: dscr.toFixed(2) + "x",
      note: dscr >= 1.25 ? "✓ Meets SBA minimum" : "⚠ Below SBA 1.25x requirement",
    });
  }

  return structure;
}

const STATUS_ICON = {
  go: <CheckCircle2 size={14} style={{ color: "hsl(142, 71%, 45%)" }} />,
  caution: <AlertTriangle size={14} style={{ color: "hsl(38, 92%, 50%)" }} />,
  "no-go": <XCircle size={14} style={{ color: "hsl(var(--destructive))" }} />,
};

const STATUS_BG = {
  go: "hsl(142, 71%, 45% / 0.06)",
  caution: "hsl(38, 92%, 50% / 0.06)",
  "no-go": "hsl(var(--destructive) / 0.06)",
};

const STATUS_BORDER = {
  go: "hsl(142, 71%, 45% / 0.2)",
  caution: "hsl(38, 92%, 50% / 0.2)",
  "no-go": "hsl(var(--destructive) / 0.2)",
};

export const DealScorecard = memo(function DealScorecard({
  biExtraction,
  governedData,
}: DealScorecardProps) {
  const inputs = useMemo(() => extractFinancialInputs(governedData, biExtraction), [biExtraction, governedData]);
  const signals = useMemo(() => buildSignals(inputs, biExtraction), [inputs, biExtraction]);
  const dealStructure = useMemo(() => buildDealStructure(inputs), [inputs]);
  const [showStructure, setShowStructure] = useState(false);

  const companyName = biExtraction?.business_overview?.company_name || "This Business";

  const goCount = signals.filter(s => s.status === "go").length;
  const cautionCount = signals.filter(s => s.status === "caution").length;
  const noGoCount = signals.filter(s => s.status === "no-go").length;

  // Overall verdict
  const verdict = noGoCount >= 3
    ? { label: "WALK AWAY", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)", desc: "Too many critical risks. This deal needs significant price reduction or structural changes." }
    : noGoCount >= 1
    ? { label: "PROCEED WITH CAUTION", color: "hsl(38, 92%, 45%)", bg: "hsl(38, 92%, 50% / 0.08)", desc: "Red flags present. Negotiate hard on price and get every answer in writing before LOI." }
    : cautionCount >= 3
    ? { label: "NEGOTIATE HARDER", color: "hsl(38, 92%, 45%)", bg: "hsl(38, 92%, 50% / 0.08)", desc: "Solid foundation but multiple caution areas. Use these as leverage to negotiate a better deal." }
    : { label: "STRONG CANDIDATE", color: "hsl(142, 71%, 45%)", bg: "hsl(142, 71%, 45% / 0.08)", desc: "Fundamentals look solid. Move to LOI stage — but complete full due diligence first." };

  if (signals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Header + Verdict */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Target size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Deal Scorecard</h3>
            <p className="text-[10px] text-muted-foreground">{companyName} — {signals.length} signals analyzed</p>
          </div>
        </div>

        {/* Verdict Banner */}
        <div className="rounded-lg p-4" style={{ background: verdict.bg, border: `1px solid ${verdict.color}30` }}>
          <div className="flex items-center gap-3">
            <div className="text-lg font-black tracking-tight" style={{ color: verdict.color }}>
              {verdict.label}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "hsl(142, 71%, 45%)" }}>
                <CheckCircle2 size={10} /> {goCount} Go
              </span>
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "hsl(38, 92%, 50%)" }}>
                <AlertTriangle size={10} /> {cautionCount} Caution
              </span>
              <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                <XCircle size={10} /> {noGoCount} No-Go
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{verdict.desc}</p>
        </div>
      </div>

      {/* Signal Grid */}
      <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {signals.map((s, i) => (
          <div
            key={i}
            className="rounded-lg p-3 flex items-start gap-2.5"
            style={{ background: STATUS_BG[s.status], border: `1px solid ${STATUS_BORDER[s.status]}` }}
          >
            <div className="mt-0.5 flex-shrink-0">{STATUS_ICON[s.status]}</div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{s.detail}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{s.source}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Deal Structure */}
      {dealStructure.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowStructure(!showStructure)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors border border-border"
          >
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <DollarSign size={12} className="text-muted-foreground" />
              Suggested Deal Structure
            </span>
            {showStructure ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>

          {showStructure && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 rounded-lg p-3 space-y-2"
              style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
            >
              {dealStructure.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-foreground">{item.value}</span>
                    {item.note && (
                      <span className="text-[9px] text-muted-foreground ml-1.5">{item.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
});
