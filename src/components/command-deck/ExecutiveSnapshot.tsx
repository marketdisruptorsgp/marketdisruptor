/**
 * ExecutiveSnapshot — Dense above-fold intelligence from ACTUAL data
 * 
 * Surfaces real product/business intel: pricing, complaints, supply chain,
 * key insights, constraints — not abstract reasoning engine outputs.
 * 6 compact panels in a 3x2 grid. Each shows real data immediately.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Package, Lightbulb,
  AlertTriangle, ChevronDown, ChevronUp,
  Users, Lock,
} from "lucide-react";
import { ProblemStatementCard } from "./ProblemStatementCard";
import { humanizeLabel } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";

interface ProductData {
  name?: string;
  keyInsight?: string;
  description?: string;
  trendAnalysis?: string;
  marketSizeEstimate?: string;
  pricingIntel?: any;
  supplyChain?: any;
  communityInsights?: any;
  customerSentiment?: any;
  userWorkflow?: any;
  userJourney?: any;
  confidenceScores?: any;
  [key: string]: any;
}

interface ExecutiveSnapshotProps {
  product: ProductData | null;
  businessData: Record<string, any> | null;
  narrative: StrategicNarrative | null;
  mode: "product" | "service" | "business";
  completedSteps: number;
  totalSteps: number;
  modeAccent: string;
  evidenceCount: number;
  onProblemLocked?: (statement: string) => void;
}

/* ── Panel wrapper ── */
function Panel({
  icon: Icon, title, accent, children, expandedContent,
}: {
  icon: React.ElementType;
  title: string;
  accent: string;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hasExpanded = !!expandedContent;
  return (
    <div
      className={`rounded-lg overflow-hidden transition-shadow ${hasExpanded ? "cursor-pointer hover:shadow-md" : ""}`}
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      onClick={() => hasExpanded && setOpen(o => !o)}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon size={13} style={{ color: accent }} className="flex-shrink-0" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground truncate">
            {title}
          </span>
          {hasExpanded && (
            <span className="ml-auto text-muted-foreground flex-shrink-0">
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </span>
          )}
        </div>
        {children}
      </div>
      <AnimatePresence>
        {open && expandedContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border px-3 py-2 overflow-hidden"
          >
            {expandedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Bullet({ text, color }: { text: string; color?: string }) {
  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color || "hsl(var(--muted-foreground))" }} />
      <span className="text-[11px] text-foreground/80 leading-snug">{text}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-[11px] text-muted-foreground italic">{text}</p>;
}

export const ExecutiveSnapshot = memo(function ExecutiveSnapshot({
  product, businessData, narrative, mode, completedSteps, totalSteps, modeAccent, evidenceCount, onProblemLocked,
}: ExecutiveSnapshotProps) {
  const p = product || {};
  const biz = businessData || {};
  const governed = (biz as any)?.governed || {};

  // Trend / Market signal (used by ProblemStatementCard)
  const trend = p.trendAnalysis || (biz as any)?.trend || null;
  const marketSize = p.marketSizeEstimate || null;


  // Pricing
  const pricing = useMemo(() => {
    const pi = p.pricingIntel || (biz as any)?.pricingIntel || (biz as any)?.pricing;
    if (!pi) return null;
    const bullets: string[] = [];
    if (pi.priceRange) bullets.push(`Price range: ${pi.priceRange}`);
    else if (pi.estimatedPrice) bullets.push(`Price: ${typeof pi.estimatedPrice === "string" ? pi.estimatedPrice.slice(0, 80) : pi.estimatedPrice}`);
    else if (pi.averagePrice) bullets.push(`Avg price: ${pi.averagePrice}`);
    if (pi.priceDirection) {
      const dir = typeof pi.priceDirection === "string" ? pi.priceDirection.slice(0, 80) : pi.priceDirection;
      bullets.push(`Trend: ${dir}`);
    }
    if (pi.strategy) bullets.push(pi.strategy);
    if (pi.marginEstimate) bullets.push(`Margin: ${pi.marginEstimate}`);
    else if (pi.margins) bullets.push(`Margins: ${typeof pi.margins === "string" ? pi.margins.slice(0, 80) : pi.margins}`);
    if (pi.competitorPricing) bullets.push(`Competitor: ${typeof pi.competitorPricing === "string" ? pi.competitorPricing : "mapped"}`);
    if (pi.pricingModel) bullets.push(pi.pricingModel);
    return bullets.length > 0 ? bullets : null;
  }, [p, biz]);

  // Community / Customer
  const community = useMemo(() => {
    const ci = p.communityInsights || p.customerSentiment || (biz as any)?.communityInsights || (biz as any)?.customerSentiment;
    const bullets: string[] = [];
    if (ci) {
      const complaints = ci.topComplaints || [];
      const requests = ci.improvementRequests || ci.marketGaps || [];
      complaints.slice(0, 2).forEach((c: any) => bullets.push(typeof c === "string" ? c : c.text || c.label || ""));
      requests.slice(0, 2).forEach((r: any) => bullets.push(typeof r === "string" ? r : r.text || r.label || ""));
      if (ci.communitySentiment || ci.redditSentiment) {
        const s = ci.communitySentiment || ci.redditSentiment;
        if (!/no direct.*found|not found/i.test(s)) bullets.unshift(s.length > 80 ? s.slice(0, 77) + "…" : s);
      }
    }
    // Fallback: extract friction points from userJourney
    if (bullets.length === 0) {
      const uj = p.userJourney || (biz as any)?.userJourney;
      const fps = uj?.frictionPoints || [];
      fps.slice(0, 3).forEach((fp: any) => {
        const text = typeof fp === "string" ? fp : fp.friction || fp.text || fp.label;
        if (text) bullets.push(text.length > 80 ? text.slice(0, 77) + "…" : text);
      });
    }
    return bullets.filter(Boolean).length > 0 ? bullets.filter(Boolean) : null;
  }, [p, biz]);

  // Supply Chain
  const supplyChain = useMemo(() => {
    const sc = p.supplyChain || (biz as any)?.supplyChain || (biz as any)?.valueChain;
    if (!sc) return null;
    const bullets: string[] = [];
    // Structured arrays
    const mfrs = sc.manufacturers || [];
    const dists = sc.distributors || [];
    mfrs.slice(0, 2).forEach((m: any) => {
      const name = typeof m === "string" ? m : m.name;
      if (name) bullets.push(`Mfr: ${name}${m.region ? ` (${m.region})` : ""}`);
    });
    dists.slice(0, 1).forEach((d: any) => {
      const name = typeof d === "string" ? d : d.name;
      if (name) bullets.push(`Dist: ${name}`);
    });
    // Flat string fields (from analyze-products output)
    if (bullets.length === 0) {
      if (sc.manufacturing) bullets.push(typeof sc.manufacturing === "string" ? sc.manufacturing.slice(0, 80) : String(sc.manufacturing));
      if (sc.materials) bullets.push(typeof sc.materials === "string" ? sc.materials.slice(0, 80) : String(sc.materials));
      if (sc.estimatedCOGS) bullets.push(`COGS: ${typeof sc.estimatedCOGS === "string" ? sc.estimatedCOGS.slice(0, 80) : sc.estimatedCOGS}`);
      if (sc.source) bullets.push(typeof sc.source === "string" ? sc.source.slice(0, 60) : String(sc.source));
    }
    return bullets.length > 0 ? bullets : null;
  }, [p, biz]);

  // Constraints (from governed data for business model, or narrative)
  const constraints = useMemo(() => {
    const items: string[] = [];
    // From governed constraint map
    const cm = governed?.constraint_map;
    if (cm?.binding_constraint?.label) items.push(cm.binding_constraint.label);
    const chains = cm?.causal_chains || [];
    chains.slice(0, 2).forEach((c: any) => {
      if (c.constraint_label) items.push(c.constraint_label);
    });
    // From narrative
    if (items.length === 0 && narrative?.primaryConstraint) {
      items.push(humanizeLabel(narrative.primaryConstraint) || narrative.primaryConstraint);
    }
    // From friction tiers
    const ft = governed?.friction_tiers;
    if (ft?.tier_1?.length > 0 && items.length < 3) {
      ft.tier_1.slice(0, 2).forEach((f: any) => {
        const label = typeof f === "string" ? f : f.label || f.name;
        if (label && !items.includes(label)) items.push(label);
      });
    }
    return items.length > 0 ? items.slice(0, 4) : null;
  }, [governed, narrative]);

  const hasAnyData = !!(pricing || community || supplyChain || constraints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      {/* ── Row 1: Problem Statement (editable + cyclable) ── */}
      <ProblemStatementCard
        product={product as Record<string, any> | null}
        businessData={businessData}
        narrative={narrative}
        governed={governed}
        modeAccent={modeAccent}
        evidenceCount={evidenceCount}
        completedSteps={completedSteps}
        totalSteps={totalSteps}
        marketSize={marketSize}
        trend={trend}
        mode={mode}
        onProblemLocked={onProblemLocked}
      />

      {/* ── Row 2: 3x2 intelligence grid from actual data ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">

        {/* 1. Pricing Intel */}
        <Panel icon={DollarSign} title="Pricing" accent={modeAccent}>
          {pricing ? (
            pricing.slice(0, 3).map((b, i) => <Bullet key={i} text={b} color={modeAccent} />)
          ) : (
            <EmptyState text="Run Understand step for pricing data" />
          )}
        </Panel>

        {/* 2. Customer / Community */}
        <Panel
          icon={Users}
          title="Customer Intel"
          accent={modeAccent}
          expandedContent={community && community.length > 3 ? (
            <div>{community.slice(3).map((b, i) => <Bullet key={i} text={b} color="hsl(var(--warning))" />)}</div>
          ) : undefined}
        >
          {community ? (
            community.slice(0, 3).map((b, i) => <Bullet key={i} text={b} color="hsl(var(--warning))" />)
          ) : (
            <EmptyState text="Run Understand step for customer data" />
          )}
        </Panel>

        {/* 3. Constraints / Friction */}
        <Panel icon={AlertTriangle} title="Constraints" accent="hsl(var(--destructive))">
          {constraints ? (
            constraints.slice(0, 3).map((c, i) => <Bullet key={i} text={c} color="hsl(var(--destructive))" />)
          ) : (
            <EmptyState text="Run Disrupt step to identify constraints" />
          )}
        </Panel>

        {/* 4. Supply Chain / Value Chain */}
        <Panel icon={Package} title={mode === "business" ? "Value Chain" : "Supply Chain"} accent={modeAccent}>
          {supplyChain ? (
            supplyChain.map((b, i) => <Bullet key={i} text={b} color={modeAccent} />)
          ) : (
            <EmptyState text={`Run Understand step for ${mode === "business" ? "value chain" : "supply chain"}`} />
          )}
        </Panel>

        {/* 5. Trapped Value (from reasoning — shows when available) */}
        <Panel icon={Lock} title="Trapped Value" accent={modeAccent}>
          {narrative?.trappedValue ? (
            <>
              <p className="text-[11px] text-foreground/80 leading-snug">{narrative.trappedValue}</p>
              {narrative.trappedValueEstimate && (
                <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: modeAccent }}>{narrative.trappedValueEstimate}</span>
              )}
            </>
          ) : (
            <EmptyState text="Emerges after Disrupt + Reimagine steps" />
          )}
        </Panel>

        {/* 6. Opportunities / Ideas */}
        <Panel icon={Lightbulb} title="Opportunities" accent="hsl(var(--success))">
          {narrative?.breakthroughOpportunity ? (
            <Bullet text={humanizeLabel(narrative.breakthroughOpportunity) || narrative.breakthroughOpportunity} color="hsl(var(--success))" />
          ) : (
            <EmptyState text="Run Reimagine step to generate opportunities" />
          )}
          {narrative?.strategicPathway && (
            <Bullet text={humanizeLabel(narrative.strategicPathway) || narrative.strategicPathway} color="hsl(var(--success))" />
          )}
        </Panel>

      </div>
    </motion.div>
  );
});
