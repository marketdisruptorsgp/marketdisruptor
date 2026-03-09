import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ArrowLeft, RefreshCw, BarChart3, AlertTriangle, Sparkles, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ThesisClassification = "structural_reconfiguration" | "solid_conventional" | "generic_pattern" | "unclassified";

interface ParsedThesis {
  analysisId: string;
  analysisTitle: string;
  analysisType: string;
  createdAt: string;
  evidenceCount: number;
  constraintCount: number;
  opportunityCount: number;
  aiGateResult: string | null;
  computedAt: string | null;
  structuralProfile: any;
  qualifiedPatterns: any[];
  deepenedOpportunities: any[];
  pipelineEvents: string[];
}

const CLASSIFICATION_COLORS: Record<ThesisClassification, string> = {
  structural_reconfiguration: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  solid_conventional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  generic_pattern: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  unclassified: "bg-muted text-muted-foreground border-border",
};

const CLASSIFICATION_LABELS: Record<ThesisClassification, string> = {
  structural_reconfiguration: "Structural Reconfiguration",
  solid_conventional: "Solid Conventional",
  generic_pattern: "Generic Pattern",
  unclassified: "Unclassified",
};

export default function ThesisAuditPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<ParsedThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Record<string, ThesisClassification>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterClass, setFilterClass] = useState<ThesisClassification | "all">("all");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("id, title, analysis_type, created_at, analysis_data")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      console.error("[ThesisAudit] Fetch error:", error);
      setLoading(false);
      return;
    }

    const parsed: ParsedThesis[] = [];
    for (const row of data) {
      const ad = row.analysis_data as any;
      const se = ad?.strategicEngine;
      if (!se) continue;
      parsed.push({
        analysisId: row.id,
        analysisTitle: row.title,
        analysisType: row.analysis_type,
        createdAt: row.created_at,
        evidenceCount: se.evidenceCount ?? 0,
        constraintCount: se.constraintCount ?? 0,
        opportunityCount: se.opportunityCount ?? 0,
        aiGateResult: se.aiGateResult ?? null,
        computedAt: se.computedAt ?? null,
        structuralProfile: se.structuralProfile ?? null,
        qualifiedPatterns: se.qualifiedPatterns ?? [],
        deepenedOpportunities: se.deepenedOpportunities ?? [],
        pipelineEvents: se.pipelineEvents ?? [],
      });
    }
    setAnalyses(parsed);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const classify = (analysisId: string, thesisIdx: number, cls: ThesisClassification) => {
    setClassifications(prev => ({ ...prev, [`${analysisId}:${thesisIdx}`]: cls }));
  };

  const filteredAnalyses = useMemo(() => {
    if (filterClass === "all") return analyses;
    return analyses.filter(a =>
      a.deepenedOpportunities.some((_, i) =>
        (classifications[`${a.analysisId}:${i}`] ?? "unclassified") === filterClass
      )
    );
  }, [analyses, filterClass, classifications]);

  // Aggregate stats
  const stats = useMemo(() => {
    let total = 0, structural = 0, conventional = 0, generic = 0, unclassified = 0;
    let withLens = 0, withoutLens = 0;
    for (const a of analyses) {
      for (let i = 0; i < a.deepenedOpportunities.length; i++) {
        total++;
        const cls = classifications[`${a.analysisId}:${i}`] ?? "unclassified";
        if (cls === "structural_reconfiguration") structural++;
        else if (cls === "solid_conventional") conventional++;
        else if (cls === "generic_pattern") generic++;
        else unclassified++;
      }
      if (a.structuralProfile) {
        // Check if any lens-related data exists
        const hasLens = a.pipelineEvents.some((e: string) => typeof e === "string" && e.toLowerCase().includes("lens"));
        if (hasLens) withLens += a.deepenedOpportunities.length;
        else withoutLens += a.deepenedOpportunities.length;
      }
    }
    return { total, structural, conventional, generic, unclassified, withLens, withoutLens };
  }, [analyses, classifications]);

  const totalTheses = analyses.reduce((sum, a) => sum + a.deepenedOpportunities.length, 0);

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thesis Quality Audit</h1>
            <p className="text-sm text-muted-foreground">
              {analyses.length} analyses with persisted theses · {totalTheses} total theses
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Theses</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.structural}</div>
            <div className="text-xs text-muted-foreground">Structural</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.conventional}</div>
            <div className="text-xs text-muted-foreground">Conventional</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.generic}</div>
            <div className="text-xs text-muted-foreground">Generic</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.unclassified}</div>
            <div className="text-xs text-muted-foreground">Unclassified</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-4">
        {(["all", "structural_reconfiguration", "solid_conventional", "generic_pattern", "unclassified"] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filterClass === f ? "default" : "outline"}
            onClick={() => setFilterClass(f)}
            className="text-xs"
          >
            {f === "all" ? "All" : CLASSIFICATION_LABELS[f]}
          </Button>
        ))}
      </div>

      {/* Empty State */}
      {!loading && analyses.length === 0 && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No thesis data persisted yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Run analyses to start accumulating thesis outputs. The strategic engine will now persist
              structural profiles, qualified patterns, and deepened opportunities for each analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Table */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-3">
          {filteredAnalyses.map(a => {
            const isExpanded = expandedRows.has(a.analysisId);
            return (
              <Card key={a.analysisId} className="border-border/50">
                <Collapsible open={isExpanded} onOpenChange={() => toggleRow(a.analysisId)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <div>
                            <CardTitle className="text-sm font-semibold">{a.analysisTitle}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">{a.analysisType}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(a.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span title="Evidence">{a.evidenceCount} ev</span>
                          <span title="Constraints">{a.constraintCount} con</span>
                          <span title="Opportunities">{a.opportunityCount} opp</span>
                          <span title="Deepened theses">{a.deepenedOpportunities.length} theses</span>
                          {a.aiGateResult && (
                            <Badge variant="outline" className="text-[10px]">
                              {a.aiGateResult === "PASSED" ? <Sparkles className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                              AI {a.aiGateResult}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-4 pb-4 pt-0 space-y-4">
                      {/* Structural Profile Summary */}
                      {a.structuralProfile && (
                        <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                            <Layers className="w-3 h-3" /> Structural Profile
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {["supplyFragmentation", "marginStructure", "switchingCosts", "distributionControl", "laborIntensity", "revenueModel"].map(key => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                                <span className="font-mono text-foreground">{a.structuralProfile[key] ?? "—"}</span>
                              </div>
                            ))}
                          </div>
                          {a.structuralProfile.bindingConstraints?.length > 0 && (
                            <div className="mt-2 text-xs">
                              <span className="text-muted-foreground">Binding constraints: </span>
                              {a.structuralProfile.bindingConstraints.map((c: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] mr-1">{c.constraintName || c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Qualified Patterns */}
                      {a.qualifiedPatterns.length > 0 && (
                        <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Qualified Patterns ({a.qualifiedPatterns.length})</div>
                          <div className="space-y-1">
                            {a.qualifiedPatterns.map((qp: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-[10px]">{qp.patternName}</Badge>
                                <span className="text-muted-foreground">density: {qp.signalDensity?.toFixed(2)}</span>
                                {qp.strategicBet?.contrarianBelief && (
                                  <span className="text-foreground/70 italic truncate max-w-xs">"{qp.strategicBet.contrarianBelief}"</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deepened Theses */}
                      {a.deepenedOpportunities.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-xs font-semibold text-muted-foreground">Deepened Theses ({a.deepenedOpportunities.length})</div>
                          {a.deepenedOpportunities.map((d: any, i: number) => {
                            const key = `${a.analysisId}:${i}`;
                            const cls = classifications[key] ?? "unclassified";
                            return (
                              <div key={i} className="rounded-lg border border-border/50 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-[10px] ${CLASSIFICATION_COLORS[cls]}`}>
                                      {CLASSIFICATION_LABELS[cls]}
                                    </Badge>
                                    <span className="text-sm font-medium text-foreground">{d.reconfigurationLabel || "Untitled thesis"}</span>
                                    {d.aiDeepened && <Sparkles className="w-3 h-3 text-amber-400" />}
                                  </div>
                                  <div className="flex gap-1">
                                    {(["structural_reconfiguration", "solid_conventional", "generic_pattern"] as ThesisClassification[]).map(c => (
                                      <Button
                                        key={c}
                                        size="sm"
                                        variant={cls === c ? "default" : "ghost"}
                                        className="text-[10px] h-6 px-2"
                                        onClick={() => classify(a.analysisId, i, c)}
                                      >
                                        {c === "structural_reconfiguration" ? "Structural" : c === "solid_conventional" ? "Conventional" : "Generic"}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Causal Chain */}
                                {d.causalChain && (
                                  <div className="text-xs space-y-1 pl-3 border-l-2 border-primary/30">
                                    <div><span className="text-muted-foreground">Constraint:</span> <span className="text-foreground">{d.causalChain.constraint}</span></div>
                                    {d.causalChain.mechanism && <div><span className="text-muted-foreground">Mechanism:</span> <span className="text-foreground">{d.causalChain.mechanism}</span></div>}
                                    {d.causalChain.outcome && <div><span className="text-muted-foreground">Outcome:</span> <span className="text-foreground">{d.causalChain.outcome}</span></div>}
                                  </div>
                                )}

                                {/* Economic Mechanism */}
                                {d.economicMechanism && (
                                  <div className="text-xs pl-3 border-l-2 border-emerald-500/30">
                                    <span className="text-muted-foreground">Value Creation:</span> <span className="text-foreground">{d.economicMechanism.valueCreation}</span>
                                    {d.economicMechanism.captureModel && (
                                      <div><span className="text-muted-foreground">Capture:</span> <span className="text-foreground">{d.economicMechanism.captureModel}</span></div>
                                    )}
                                  </div>
                                )}

                                {/* First Move */}
                                {d.firstMove && (
                                  <div className="text-xs pl-3 border-l-2 border-blue-500/30">
                                    <span className="text-muted-foreground">First Move:</span> <span className="text-foreground">{d.firstMove.action}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">No deepened theses produced</div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
