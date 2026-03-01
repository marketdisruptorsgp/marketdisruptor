import { useState } from "react";
import {
  Scale, MapPin, AlertTriangle, Building2, ChevronDown, ChevronUp,
  ExternalLink, FileText, Shield,
} from "lucide-react";

interface Agency {
  name: string;
  role?: string;
  url?: string;
}

interface StateVariance {
  state: string;
  status: string;
  notes?: string;
}

interface Rulemaking {
  title: string;
  agency?: string;
  status?: string;
  date?: string;
  url?: string;
}

interface RegulatoryData {
  category: string;
  agencies?: Agency[];
  state_variances?: StateVariance[];
  active_rulemaking?: Rulemaking[];
  federal_summary?: string;
  risk_level?: string;
}

interface Props {
  regulatoryData: RegulatoryData[];
}

const RISK_STYLES: Record<string, string> = {
  high: "text-destructive bg-destructive/10 border-destructive/20",
  medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  low: "text-green-600 bg-green-500/10 border-green-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  legal: "text-green-600 bg-green-500/10",
  restricted: "text-amber-600 bg-amber-500/10",
  prohibited: "text-destructive bg-destructive/10",
  pending: "text-blue-600 bg-blue-500/10",
  varies: "text-purple-600 bg-purple-500/10",
};

export function RegulatoryLandscapeCard({ regulatoryData }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    regulatoryData.length === 1 ? regulatoryData[0].category : null
  );

  if (!regulatoryData.length) return null;

  const totalAgencies = regulatoryData.reduce((s, d) => s + (d.agencies?.length || 0), 0);
  const totalRulemaking = regulatoryData.reduce((s, d) => s + (d.active_rulemaking?.length || 0), 0);
  const totalStates = regulatoryData.reduce((s, d) => s + (d.state_variances?.length || 0), 0);

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Scale size={16} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Regulatory Landscape</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
        Regulatory context extracted from your analyses — governing agencies, active rulemaking, and state-by-state legal variance for regulated categories.
      </p>
      <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
        <FileText size={10} />
        {regulatoryData.length} regulated {regulatoryData.length === 1 ? "category" : "categories"}
        {totalAgencies > 0 && <> · {totalAgencies} agencies</>}
        {totalRulemaking > 0 && <> · {totalRulemaking} active rules</>}
        {totalStates > 0 && <> · {totalStates} state entries</>}
      </p>

      <div className="space-y-3">
        {regulatoryData.map((reg) => {
          const isExpanded = expandedCategory === reg.category;
          const riskStyle = RISK_STYLES[reg.risk_level || "medium"] || RISK_STYLES.medium;

          return (
            <div key={reg.category} className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : reg.category)}
                className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <Shield size={14} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{reg.category}</span>
                    {reg.risk_level && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${riskStyle}`}>
                        {reg.risk_level} regulatory risk
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    {reg.agencies && reg.agencies.length > 0 && (
                      <span className="flex items-center gap-1"><Building2 size={9} /> {reg.agencies.length} agencies</span>
                    )}
                    {reg.active_rulemaking && reg.active_rulemaking.length > 0 && (
                      <span className="flex items-center gap-1"><AlertTriangle size={9} /> {reg.active_rulemaking.length} active rules</span>
                    )}
                    {reg.state_variances && reg.state_variances.length > 0 && (
                      <span className="flex items-center gap-1"><MapPin size={9} /> {reg.state_variances.length} states</span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/30 p-4 space-y-5">
                  {/* Federal summary */}
                  {reg.federal_summary && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Federal Overview</p>
                      <p className="text-xs text-foreground leading-relaxed">{reg.federal_summary}</p>
                    </div>
                  )}

                  {/* Agencies */}
                  {reg.agencies && reg.agencies.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Governing Agencies</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {reg.agencies.map((agency, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-card border border-border">
                            <Building2 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground">{agency.name}</p>
                              {agency.role && <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{agency.role}</p>}
                              {agency.url && (
                                <a href={agency.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1">
                                  Visit <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active rulemaking */}
                  {reg.active_rulemaking && reg.active_rulemaking.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Rulemaking</p>
                      <div className="space-y-2">
                        {reg.active_rulemaking.map((rule, i) => (
                          <div key={i} className="p-3 rounded-lg bg-card border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground">{rule.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                  {rule.agency && <span>{rule.agency}</span>}
                                  {rule.date && <span>· {rule.date}</span>}
                                </div>
                              </div>
                              {rule.status && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 flex-shrink-0">
                                  {rule.status}
                                </span>
                              )}
                            </div>
                            {rule.url && (
                              <a href={rule.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2">
                                View Rule <ExternalLink size={8} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* State-by-state variance */}
                  {reg.state_variances && reg.state_variances.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">State-by-State Variance</p>
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[80px_90px_1fr] text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 px-3 py-2 border-b border-border">
                          <span>State</span>
                          <span>Status</span>
                          <span>Notes</span>
                        </div>
                        <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
                          {reg.state_variances.map((sv, i) => {
                            const statusStyle = STATUS_STYLES[sv.status?.toLowerCase()] || "text-muted-foreground bg-muted";
                            return (
                              <div key={i} className="grid grid-cols-[80px_90px_1fr] items-center px-3 py-2 text-xs">
                                <span className="font-semibold text-foreground">{sv.state}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit capitalize ${statusStyle}`}>
                                  {sv.status}
                                </span>
                                <span className="text-muted-foreground text-[11px] leading-snug">{sv.notes || "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
