import { useState } from "react";
import { ChevronDown, Zap, Wrench, Layers, Target } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export interface ActionPlan {
  initiative: string;
  objective?: string;
  leverage_type: "optimization" | "structural_improvement" | "redesign";
  mechanism: string;
  complexity?: "low" | "medium" | "high";
  time_horizon?: "near_term" | "mid_term" | "long_term";
  risk?: { execution?: string; adoption?: string; market?: string };
  validation?: string;
  decision_readiness?: number;
  confidence?: "high" | "medium" | "exploratory";
}

const LEVERAGE_STYLES: Record<ActionPlan["leverage_type"], { icon: typeof Zap; color: string; label: string }> = {
  optimization:            { icon: Zap,    color: "hsl(142 70% 30%)",       label: "Optimization" },
  structural_improvement:  { icon: Wrench, color: "hsl(var(--primary))",    label: "Structural" },
  redesign:                { icon: Layers, color: "hsl(38 92% 35%)",        label: "Redesign" },
};

const COMPLEXITY_COLORS: Record<string, string> = {
  low: "hsl(142 70% 30%)",
  medium: "hsl(38 92% 35%)",
  high: "hsl(var(--destructive))",
};

const HORIZON_LABELS: Record<string, string> = {
  near_term: "Near-term",
  mid_term: "Mid-term",
  long_term: "Long-horizon",
};

function ReadinessDots({ score }: { score?: number }) {
  if (!score || score < 1 || score > 5) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">Ready</span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="w-2 h-2 rounded-full" style={{
          background: i < score ? "hsl(var(--primary))" : "hsl(var(--border))",
        }} />
      ))}
    </div>
  );
}

export function ActionPlanCard({ plan }: { plan: ActionPlan }) {
  const [open, setOpen] = useState(false);
  const lt = LEVERAGE_STYLES[plan.leverage_type] || LEVERAGE_STYLES.optimization;
  const Icon = lt.icon;
  const hasDetails = plan.risk || plan.validation || plan.objective;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
      <div className="px-4 py-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${lt.color}14` }}>
              <Icon size={13} style={{ color: lt.color }} />
            </div>
            <p className="text-sm font-bold text-foreground leading-tight truncate">{plan.initiative}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: lt.color, background: `${lt.color}10`, border: `1px solid ${lt.color}25` }}>
            {lt.label}
          </span>
        </div>

        {/* Mechanism */}
        <p className="text-xs text-foreground/80 leading-relaxed">{plan.mechanism}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3">
          {plan.complexity && (
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COMPLEXITY_COLORS[plan.complexity] || "hsl(var(--muted-foreground))" }}>
              {plan.complexity} complexity
            </span>
          )}
          {plan.time_horizon && (
            <span className="text-[10px] font-semibold text-muted-foreground">
              {HORIZON_LABELS[plan.time_horizon] || plan.time_horizon}
            </span>
          )}
          {plan.confidence && (
            <span className="text-[10px] font-semibold text-muted-foreground capitalize">
              {plan.confidence} confidence
            </span>
          )}
          <ReadinessDots score={plan.decision_readiness} />
        </div>
      </div>

      {/* Expandable details */}
      {hasDetails && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer transition-colors hover:text-foreground"
            style={{ borderTop: "1px solid hsl(var(--border))" }}>
            Details
            <ChevronDown size={10} className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-3 space-y-2">
            {plan.objective && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Objective</p>
                <p className="text-xs text-foreground/80">{plan.objective}</p>
              </div>
            )}
            {plan.risk && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {plan.risk.execution && (
                  <div className="p-2 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Execution Risk</p>
                    <p className="text-[11px] text-foreground/80">{plan.risk.execution}</p>
                  </div>
                )}
                {plan.risk.adoption && (
                  <div className="p-2 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Adoption Risk</p>
                    <p className="text-[11px] text-foreground/80">{plan.risk.adoption}</p>
                  </div>
                )}
                {plan.risk.market && (
                  <div className="p-2 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Market Risk</p>
                    <p className="text-[11px] text-foreground/80">{plan.risk.market}</p>
                  </div>
                )}
              </div>
            )}
            {plan.validation && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Validation Strategy</p>
                <p className="text-xs text-foreground/80">{plan.validation}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function ActionPlanList({ plans }: { plans?: ActionPlan[] }) {
  if (!plans?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          <Target size={12} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Action Plans</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          {plans.length}
        </span>
      </div>
      {plans.map((plan, i) => (
        <ActionPlanCard key={i} plan={plan} />
      ))}
    </div>
  );
}