/**
 * DISCOVERY SYSTEM AUDIT — Internal diagnostic tool
 *
 * Outputs: Systemic Components, Local Components, Unconnected Engines,
 * Evidence Coverage, Mode Coverage, Lens Coverage, Archetype Coverage.
 */

import { useMemo } from "react";
import { CheckCircle, AlertTriangle, XCircle, Layers } from "lucide-react";
import type { MetricDomain, MetricEvidence, EvidenceMode, EvidenceTier } from "@/lib/evidenceEngine";
import { flattenEvidence } from "@/lib/evidenceEngine";

interface AuditProps {
  evidence: Record<MetricDomain, MetricEvidence> | null;
}

interface AuditResult {
  label: string;
  status: "connected" | "partial" | "disconnected";
  detail: string;
}

export function DiscoverySystemAudit({ evidence }: AuditProps) {
  const audit = useMemo(() => {
    if (!evidence) return null;

    const all = flattenEvidence(evidence);
    const engines = new Set(all.map(e => e.sourceEngine).filter(Boolean));
    const modes = new Set(all.map(e => e.mode).filter(Boolean));
    const tiers = new Set(all.map(e => e.tier).filter(Boolean));
    const types = new Set(all.map(e => e.type));
    const steps = new Set(all.map(e => e.pipelineStep));

    const systemic: AuditResult[] = [
      {
        label: "Evidence Engine",
        status: all.length > 0 ? "connected" : "disconnected",
        detail: `${all.length} evidence items`,
      },
      {
        label: "Tier Discovery",
        status: tiers.size >= 2 ? "connected" : tiers.size === 1 ? "partial" : "disconnected",
        detail: `${tiers.size}/3 tiers active: ${Array.from(tiers).join(", ")}`,
      },
      {
        label: "Pipeline Coverage",
        status: steps.size >= 3 ? "connected" : steps.size >= 1 ? "partial" : "disconnected",
        detail: `${steps.size}/5 steps: ${Array.from(steps).join(", ")}`,
      },
      {
        label: "Mode Coverage",
        status: modes.size >= 1 ? "connected" : "disconnected",
        detail: `Modes: ${Array.from(modes).join(", ") || "none"}`,
      },
    ];

    const engineStatus = (name: string): AuditResult => ({
      label: name,
      status: engines.has(name.toLowerCase().replace(/ /g, "_")) ? "connected" : "disconnected",
      detail: engines.has(name.toLowerCase().replace(/ /g, "_"))
        ? `${all.filter(e => e.sourceEngine === name.toLowerCase().replace(/ /g, "_")).length} items`
        : "Not bridged",
    });

    const local: AuditResult[] = [
      engineStatus("pipeline"),
      engineStatus("innovation"),
      engineStatus("signal_detection"),
      engineStatus("financial_model"),
      engineStatus("competitor_scout"),
      engineStatus("system_intelligence"),
    ];

    const typeNames = ["signal", "assumption", "constraint", "friction", "opportunity", "leverage", "risk", "competitor"];
    const typeCoverage = typeNames.map(t => ({
      label: t,
      count: all.filter(e => e.type === t).length,
    }));

    return { systemic, local, typeCoverage, total: all.length, engines: engines.size, modes: modes.size, tiers: tiers.size };
  }, [evidence]);

  if (!audit) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No evidence data available for audit.</p>
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "connected") return <CheckCircle size={14} className="text-[hsl(var(--success))]" />;
    if (status === "partial") return <AlertTriangle size={14} className="text-[hsl(var(--warning))]" />;
    return <XCircle size={14} className="text-[hsl(var(--destructive))]" />;
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-primary" />
          <h3 className="text-sm font-extrabold text-foreground">Discovery System Audit</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{audit.total}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Evidence Items</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{audit.engines}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Engines</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{audit.modes}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Modes</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-lg font-extrabold text-foreground">{audit.tiers}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Tiers</p>
          </div>
        </div>
      </div>

      {/* Systemic Components */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Systemic Components</h4>
        <div className="space-y-2">
          {audit.systemic.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <StatusIcon status={item.status} />
              <span className="font-semibold text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Engine Connections */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Engine Connections</h4>
        <div className="space-y-2">
          {audit.local.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <StatusIcon status={item.status} />
              <span className="font-semibold text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Type Coverage */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Evidence Type Coverage</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {audit.typeCoverage.map(t => (
            <div key={t.label} className="rounded-lg bg-muted p-2 text-center">
              <p className="text-sm font-extrabold text-foreground">{t.count}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
