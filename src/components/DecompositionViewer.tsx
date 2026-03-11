/**
 * DECOMPOSITION VIEWER — Visualizes structural primitives from the
 * first-principles decomposition stage.
 *
 * Renders mode-specific views:
 *   Product  → Component tree, cost breakdown, tech primitives, constraints
 *   Service  → Task graph, labor inputs, tools, coordination, time constraints
 *   Business → Value creation/capture, cost structure, distribution, scaling
 */

import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  Layers, CircleDollarSign, Cpu, ShieldAlert, Target,
  Users, Wrench, Clock, ArrowRight, Zap, Network,
} from "lucide-react";
import type {
  StructuralDecompositionData,
  ProductDecomposition,
  ServiceDecomposition,
  BusinessModelDecomposition,
  ConstraintPrimitive,
} from "@/lib/structuralDecomposition";
import { PipelineProcessingState } from "@/components/PipelineProcessingState";

// ── Shared sub-components ──

function SectionHeader({ icon: Icon, label, count }: { icon: any; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-primary" />
      <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">{label}</span>
      {count != null && (
        <span className="text-xs font-bold tabular-nums text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

function ConstraintList({ constraints }: { constraints: ConstraintPrimitive[] }) {
  if (!constraints?.length) return null;
  return (
    <div className="space-y-2">
      {constraints.map((c) => (
        <div key={c.id} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-foreground leading-relaxed flex-1">{c.constraint}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: c.challengeable ? "hsl(var(--primary) / 0.1)" : "hsl(var(--destructive) / 0.1)",
                  color: c.challengeable ? "hsl(var(--primary))" : "hsl(var(--destructive))",
                }}>
                {c.challengeable ? "Challengeable" : "Hard constraint"}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{
                color: c.bindingStrength >= 8 ? "hsl(var(--destructive))" : c.bindingStrength >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))",
              }}>
                {c.bindingStrength}/10
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase text-muted-foreground mt-1 inline-block">{c.type}</span>
        </div>
      ))}
    </div>
  );
}

// ── Product View ──

function ProductView({ data }: { data: ProductDecomposition }) {
  const totalCostDrivers = data.costDrivers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Job to be Done */}
      {data.jobToBeDone && (
        <div>
          <SectionHeader icon={Target} label="Job to Be Done" />
          <div className="rounded-xl p-4" style={{ background: "hsl(var(--primary) / 0.05)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{data.jobToBeDone.coreJob}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {[
                { label: "Functional", items: data.jobToBeDone.functionalNeeds, color: "hsl(var(--primary))" },
                { label: "Emotional", items: data.jobToBeDone.emotionalNeeds, color: "hsl(330 80% 50%)" },
                { label: "Social", items: data.jobToBeDone.socialNeeds, color: "hsl(271 81% 56%)" },
              ].map(({ label, items, color }) => (
                <div key={label}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
                  {items?.map((item, i) => (
                    <p key={i} className="text-xs text-foreground/80 leading-relaxed">• {item}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Functional Components */}
      {data.functionalComponents?.length > 0 && (
        <div>
          <SectionHeader icon={Layers} label="Functional Components" count={data.functionalComponents.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.functionalComponents.map((comp) => (
              <div key={comp.id} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${comp.isIrreducible ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <p className="text-xs font-bold text-foreground">{comp.label}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{comp.description}</p>
                {comp.dependencies?.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Depends on: {comp.dependencies.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {totalCostDrivers > 0 && (
        <div>
          <SectionHeader icon={CircleDollarSign} label="Cost Drivers" count={totalCostDrivers} />
          <div className="space-y-1.5">
            {data.costDrivers.map((cd) => {
              const pct = parseInt(cd.proportionEstimate?.replace(/[^0-9]/g, "") || "0");
              return (
                <div key={cd.id} className="flex items-center gap-3 rounded-lg p-2.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground truncate">{cd.driver}</p>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
                        {cd.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted-foreground) / 0.15)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: "hsl(var(--primary))" }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground w-10 text-right">{cd.proportionEstimate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technology Primitives */}
      {data.technologyPrimitives?.length > 0 && (
        <div>
          <SectionHeader icon={Cpu} label="Technology Primitives" count={data.technologyPrimitives.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.technologyPrimitives.map((tp) => (
              <div key={tp.id} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-foreground">{tp.technology}</p>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                    background: tp.maturityLevel === "frontier" ? "hsl(var(--destructive) / 0.1)" : tp.maturityLevel === "emerging" ? "hsl(38 92% 50% / 0.1)" : "hsl(152 60% 44% / 0.1)",
                    color: tp.maturityLevel === "frontier" ? "hsl(var(--destructive))" : tp.maturityLevel === "emerging" ? "hsl(38 92% 50%)" : "hsl(152 60% 44%)",
                  }}>
                    {tp.maturityLevel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tp.role}</p>
                {tp.alternatives?.length > 0 && (
                  <p className="text-[10px] text-primary mt-1">Alternatives: {tp.alternatives.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Physical Constraints */}
      {data.physicalConstraints?.length > 0 && (
        <div>
          <SectionHeader icon={ShieldAlert} label="Physical Constraints" count={data.physicalConstraints.length} />
          <ConstraintList constraints={data.physicalConstraints} />
        </div>
      )}
    </div>
  );
}

// ── Service View ──

function ServiceView({ data }: { data: ServiceDecomposition }) {
  return (
    <div className="space-y-6">
      {/* Outcome */}
      {data.outcome && (
        <div>
          <SectionHeader icon={Target} label="Service Outcome" />
          <div className="rounded-xl p-4" style={{ background: "hsl(var(--primary) / 0.05)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">Promised</p>
                <p className="text-xs text-foreground leading-relaxed">{data.outcome.promisedOutcome}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Actual</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{data.outcome.actualOutcome}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3">
              <span className="text-[10px] font-bold text-muted-foreground">Measurability: {data.outcome.outcomeMeasurability}</span>
              <span className="text-[10px] font-bold text-muted-foreground">Time to value: {data.outcome.timeToValue}</span>
            </div>
          </div>
        </div>
      )}

      {/* Task Graph */}
      {data.taskGraph?.length > 0 && (
        <div>
          <SectionHeader icon={Network} label="Task Graph" count={data.taskGraph.length} />
          <div className="space-y-1">
            {data.taskGraph.sort((a, b) => a.sequencePosition - b.sequencePosition).map((task, i) => (
              <div key={task.id}>
                <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground w-5">{task.sequencePosition}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{task.task}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                        background: task.performer === "customer" ? "hsl(38 92% 50% / 0.1)" : "hsl(var(--primary) / 0.08)",
                        color: task.performer === "customer" ? "hsl(38 92% 50%)" : "hsl(var(--primary))",
                      }}>{task.performer}</span>
                      {task.eliminable && <span className="text-[10px] font-bold text-destructive">Eliminable</span>}
                      {task.parallelizable && <span className="text-[10px] font-bold text-primary">Parallelizable</span>}
                    </div>
                  </div>
                </div>
                {i < data.taskGraph.length - 1 && (
                  <div className="flex justify-center py-0.5"><ArrowRight size={10} className="text-muted-foreground rotate-90" /></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labor Inputs */}
      {data.laborInputs?.length > 0 && (
        <div>
          <SectionHeader icon={Users} label="Labor Inputs" count={data.laborInputs.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.laborInputs.map((li) => (
              <div key={li.id} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-xs font-bold text-foreground">{li.role}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>{li.skillLevel}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                    background: li.scarcity === "scarce" ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--muted-foreground) / 0.1)",
                    color: li.scarcity === "scarce" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                  }}>{li.scarcity}</span>
                  {li.automatable && <span className="text-[10px] font-bold text-primary">Automatable</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{li.costWeight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {data.tools?.length > 0 && (
        <div>
          <SectionHeader icon={Wrench} label="Tools" count={data.tools.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.tools.map((t) => (
              <div key={t.id} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-xs font-bold text-foreground">{t.tool}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.purpose}</p>
                <span className="text-[10px] font-bold uppercase text-muted-foreground mt-1 inline-block">{t.ownershipModel?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coordination */}
      {data.coordinationRequirements?.length > 0 && (
        <div>
          <SectionHeader icon={Zap} label="Coordination Requirements" count={data.coordinationRequirements.length} />
          <div className="space-y-2">
            {data.coordinationRequirements.map((cr) => (
              <div key={cr.id} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-xs font-bold text-foreground">{cr.requirement}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Parties: {cr.parties?.join(", ")}</span>
                  <span className="text-[10px] font-bold uppercase" style={{
                    color: cr.complexity === "complex" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                  }}>{cr.complexity}</span>
                </div>
                <p className="text-[10px] text-destructive/80 mt-1">Failure: {cr.failureMode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Constraints */}
      {data.timeConstraints?.length > 0 && (
        <div>
          <SectionHeader icon={Clock} label="Time Constraints" count={data.timeConstraints.length} />
          <ConstraintList constraints={data.timeConstraints} />
        </div>
      )}
    </div>
  );
}

// ── Business View ──

function BusinessView({ data }: { data: BusinessModelDecomposition }) {
  return (
    <div className="space-y-6">
      {/* Value Creation */}
      {data.valueCreation && (
        <div>
          <SectionHeader icon={Zap} label="Value Creation" />
          <div className="rounded-xl p-4" style={{ background: "hsl(var(--primary) / 0.05)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
            <p className="text-sm font-semibold text-foreground leading-relaxed mb-2">{data.valueCreation.mechanism}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">Core Activity</p>
                <p className="text-xs text-foreground/80">{data.valueCreation.coreActivity}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">Defensibility</p>
                <p className="text-xs text-foreground/80">{data.valueCreation.defensibility}</p>
              </div>
            </div>
            {data.valueCreation.keyResources?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Key Resources</p>
                <div className="flex flex-wrap gap-1">
                  {data.valueCreation.keyResources.map((r, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Value Capture */}
      {data.valueCapture && (
        <div>
          <SectionHeader icon={CircleDollarSign} label="Value Capture" />
          <div className="rounded-xl p-4" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-xs font-bold text-foreground mb-2">{data.valueCapture.mechanism}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground/80">
              <div><span className="font-bold text-muted-foreground">Pricing: </span>{data.valueCapture.pricingModel}</div>
              <div><span className="font-bold text-muted-foreground">WTP Driver: </span>{data.valueCapture.willingness_to_pay_driver}</div>
              <div><span className="font-bold text-muted-foreground">Capture Efficiency: </span>{data.valueCapture.captureEfficiency}</div>
            </div>
            {data.valueCapture.leakagePoints?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-destructive mb-1">Value Leakage</p>
                {data.valueCapture.leakagePoints.map((lp, i) => (
                  <p key={i} className="text-xs text-foreground/80">• {lp}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost Structure */}
      {data.costStructure && (
        <div>
          <SectionHeader icon={CircleDollarSign} label="Cost Structure" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.costStructure.fixedCosts?.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground mb-2">Fixed Costs</p>
                {data.costStructure.fixedCosts.map((fc, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b last:border-0" style={{ borderColor: "hsl(var(--border))" }}>
                    <span className="text-xs text-foreground/80">{fc.item}</span>
                    <span className="text-xs font-bold tabular-nums text-foreground">{fc.proportion}</span>
                  </div>
                ))}
              </div>
            )}
            {data.costStructure.variableCosts?.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground mb-2">Variable Costs</p>
                {data.costStructure.variableCosts.map((vc, i) => (
                  <div key={i} className="py-1.5 border-b last:border-0" style={{ borderColor: "hsl(var(--border))" }}>
                    <span className="text-xs font-bold text-foreground">{vc.item}</span>
                    <p className="text-[10px] text-muted-foreground">{vc.scalingBehavior}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {(data.costStructure.costAdvantage || data.costStructure.breakEvenDynamics) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {data.costStructure.costAdvantage && (
                <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Cost Advantage</p>
                  <p className="text-xs text-foreground/80">{data.costStructure.costAdvantage}</p>
                </div>
              )}
              {data.costStructure.breakEvenDynamics && (
                <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Break-Even</p>
                  <p className="text-xs text-foreground/80">{data.costStructure.breakEvenDynamics}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Distribution */}
      {data.distribution && (
        <div>
          <SectionHeader icon={Network} label="Distribution" />
          {data.distribution.channels?.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {data.distribution.channels.map((ch, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{ch.channel}</p>
                    <p className="text-[10px] text-muted-foreground">{ch.reachEfficiency}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>{ch.control}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.distribution.networkEffects && (
              <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Network Effects</p>
                <p className="text-xs text-foreground/80">{data.distribution.networkEffects}</p>
              </div>
            )}
            {data.distribution.switchingCosts && (
              <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Switching Costs</p>
                <p className="text-xs text-foreground/80">{data.distribution.switchingCosts}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scaling Constraints */}
      {data.scalingConstraints?.length > 0 && (
        <div>
          <SectionHeader icon={ShieldAlert} label="Scaling Constraints" count={data.scalingConstraints.length} />
          <ConstraintList constraints={data.scalingConstraints} />
        </div>
      )}
    </div>
  );
}

// ── Main Viewer ──

export function DecompositionViewer() {
  const { decompositionData } = useAnalysis();
  const data = decompositionData as StructuralDecompositionData | null;

  if (!data) {
    return (
      <div className="py-8">
        <PipelineProcessingState stepKey="decompose" title="Extracting structural primitives" />
      </div>
    );
  }

  const modeLabel = data.mode === "service" ? "Service" : data.mode === "business" ? "Business Model" : "Product";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Layers size={15} className="text-primary" />
        <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">{modeLabel} Decomposition</span>
        <span className="text-xs text-muted-foreground">— Irreducible structural primitives</span>
      </div>

      {data.mode === "product" && <ProductView data={data as ProductDecomposition} />}
      {data.mode === "service" && <ServiceView data={data as ServiceDecomposition} />}
      {data.mode === "business" && <BusinessView data={data as BusinessModelDecomposition} />}
    </div>
  );
}
