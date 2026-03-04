import { useState } from "react";
import { Calendar, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, Zap, Target, Rocket, TrendingUp } from "lucide-react";
import { InfoExplainer } from "./InfoExplainer";

export interface PlaybookPhase {
  timeframe: string;
  title: string;
  objective: string;
  actions: string[];
  milestone: string;
  risks: string[];
}

export interface OwnerDependency {
  area: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  mitigation: string;
}

export interface OwnershipPlaybookData {
  transitionRiskScore: number;
  ownerDependencies: OwnerDependency[];
  phases: PlaybookPhase[];
  quickWins: string[];
  dueDiligenceQuestions: string[];
}

const SEVERITY_COLORS = {
  critical: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.3)", text: "hsl(var(--destructive))" },
  high: { bg: "hsl(var(--destructive) / 0.06)", border: "hsl(var(--destructive) / 0.2)", text: "hsl(var(--destructive))" },
  medium: { bg: "hsl(38 92% 50% / 0.06)", border: "hsl(38 92% 50% / 0.25)", text: "hsl(38 92% 35%)" },
  low: { bg: "hsl(142 70% 45% / 0.06)", border: "hsl(142 70% 45% / 0.25)", text: "hsl(142 70% 30%)" },
};

const PHASE_ICONS = [Clock, Zap, Target, Rocket, TrendingUp];

export function OwnershipPlaybook({ data }: { data: OwnershipPlaybookData }) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [showAllDeps, setShowAllDeps] = useState(false);

  const riskColor = data.transitionRiskScore >= 7 ? "hsl(var(--destructive))" : data.transitionRiskScore >= 4 ? "hsl(38 92% 35%)" : "hsl(142 70% 30%)";

  return (
    <div className="space-y-4">
      {/* Transition Risk Score */}
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
        <div className="text-center">
          <p className="text-3xl font-black tabular-nums" style={{ color: riskColor }}>{data.transitionRiskScore}</p>
          <p className="typo-status-label text-muted-foreground">/10</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="typo-card-title">Transition Risk Score</p>
            <InfoExplainer text="How likely is value destruction during ownership transition? 1 = smooth handoff, 10 = business heavily depends on current owner. Scores above 6 require significant mitigation planning." />
          </div>
          <p className="typo-card-meta text-muted-foreground mt-0.5">
            {data.transitionRiskScore >= 7 ? "High risk — requires extensive transition planning and seller involvement" : data.transitionRiskScore >= 4 ? "Moderate risk — manageable with structured transition" : "Low risk — business operates independently of owner"}
          </p>
        </div>
      </div>

      {/* Owner Dependencies */}
      {data.ownerDependencies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: "hsl(var(--destructive))" }} />
            <p className="typo-card-eyebrow" style={{ color: "hsl(var(--destructive))" }}>Owner Dependencies</p>
            <InfoExplainer text="Areas where the business depends on the current owner's relationships, knowledge, or decisions. Each must be addressed before or during transition." />
          </div>
          {(showAllDeps ? data.ownerDependencies : data.ownerDependencies.slice(0, 3)).map((dep, i) => {
            const col = SEVERITY_COLORS[dep.severity];
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold" style={{ color: col.text }}>{dep.area}</p>
                  <span className="px-2 py-0.5 rounded-full typo-status-label uppercase" style={{ color: col.text }}>{dep.severity}</span>
                </div>
                <p className="typo-card-body text-foreground/80 mb-1">{dep.description}</p>
                <div className="flex items-start gap-1.5 mt-1">
                  <CheckCircle2 size={10} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 2 }} />
                  <p className="typo-card-meta" style={{ color: "hsl(var(--primary))" }}>{dep.mitigation}</p>
                </div>
              </div>
            );
          })}
          {data.ownerDependencies.length > 3 && (
            <button onClick={() => setShowAllDeps(!showAllDeps)} className="typo-card-meta font-medium text-primary">
              {showAllDeps ? "Show less" : `+${data.ownerDependencies.length - 3} more dependencies`}
            </button>
          )}
        </div>
      )}

      {/* Quick Wins */}
      {data.quickWins.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.04)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} style={{ color: "hsl(142 70% 30%)" }} />
            <p className="typo-card-eyebrow" style={{ color: "hsl(142 70% 30%)" }}>Quick Wins (First 30 Days)</p>
          </div>
          <div className="space-y-1.5">
            {data.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                <span className="text-foreground/80">{win}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phased Playbook */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: "hsl(var(--primary))" }} />
          <p className="typo-card-eyebrow" style={{ color: "hsl(var(--primary))" }}>100-Day Playbook</p>
        </div>
        {data.phases.map((phase, i) => {
          const isExpanded = expandedPhase === i;
          const Icon = PHASE_ICONS[i] || Calendar;
          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
              <button onClick={() => setExpandedPhase(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="typo-card-meta font-bold text-foreground">{phase.timeframe}</p>
                  <p className="typo-card-meta text-muted-foreground truncate">{phase.title}</p>
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="typo-card-body text-foreground/80">{phase.objective}</p>
                  <div className="space-y-1.5">
                    {phase.actions.map((action, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={10} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 2 }} />
                        <span className="text-foreground/80">{action}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                    <p className="typo-card-meta font-semibold" style={{ color: "hsl(142 70% 30%)" }}>
                      ✓ Milestone: {phase.milestone}
                    </p>
                  </div>
                  {phase.risks.length > 0 && (
                    <div className="space-y-1">
                      <p className="typo-status-label text-muted-foreground">Watch Out For:</p>
                      {phase.risks.map((r, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs">
                          <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                          <span className="text-foreground/70">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Due Diligence Questions */}
      {data.dueDiligenceQuestions.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="typo-card-eyebrow" style={{ color: "hsl(var(--primary))" }}>Ask the Broker / Seller</p>
            <InfoExplainer text="Critical questions that CIMs typically don't answer or answer evasively. Get clear answers to these before submitting an LOI." />
          </div>
          <div className="space-y-2">
            {data.dueDiligenceQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center typo-status-label font-bold flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                <span className="text-foreground/80 leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
