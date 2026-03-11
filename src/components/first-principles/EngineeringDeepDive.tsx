/**
 * EngineeringDeepDive — Expanded single concept view with detailed engineering.
 * Shows: detailed BOM, materials, prototype plan, manufacturing process,
 * supplier categories, regulatory requirements, test plan.
 */
import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Wrench, ArrowLeft, Loader2 } from "lucide-react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { toast } from "sonner";
import type { InventionConcept, EngineeringDeepDiveData } from "./types";

interface EngineeringDeepDiveProps {
  concept: InventionConcept;
  onBack: () => void;
}

export const EngineeringDeepDive = memo(function EngineeringDeepDive({
  concept, onBack,
}: EngineeringDeepDiveProps) {
  const analysis = useAnalysis();
  const [data, setData] = useState<EngineeringDeepDiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const runDeepDive = async () => {
    setLoading(true);
    try {
      const requestBody = {
        product: analysis.selectedProduct,
        viableTransformations: [],
        allClusters: [],
        hiddenAssumptions: (analysis.disruptData as any)?.hiddenAssumptions || null,
        flippedLogic: (analysis.disruptData as any)?.flippedLogic || null,
        decomposition: analysis.decompositionData || undefined,
        // Pass the selected concept for focused deep dive
        focusConcept: concept,
        engineeringDeepDive: true,
      };

      const { data: result, error } = await invokeWithTimeout("concept-architecture", {
        body: requestBody,
      }, 180_000);

      if (error || !result?.success) {
        toast.error("Engineering deep dive failed: " + (result?.error || error?.message));
        return;
      }

      // Map the concept-architecture output to our deep dive format
      const analysis_result = result.analysis || {};
      const rc = analysis_result.redesignedConcept || {};

      const deepDiveData: EngineeringDeepDiveData = {
        concept,
        detailed_bom: rc.bomBreakdown || concept.estimated_bom || [],
        materials_deep: (concept.materials || []).map((m: string) => ({
          material: m,
          supplier_types: ["Specialty chemical", "Industrial supply"],
          cost_range: "Varies",
          notes: "",
        })),
        prototype_plan: [
          { phase: "Proof of Concept", duration: "2-4 weeks", deliverable: "Functional demo", cost_estimate: "$500-2K" },
          { phase: "Alpha Prototype", duration: "4-8 weeks", deliverable: "Near-production prototype", cost_estimate: "$2K-10K" },
          { phase: "Beta Testing", duration: "4-6 weeks", deliverable: "Field-tested units", cost_estimate: "$5K-20K" },
        ],
        manufacturing_process: [{
          step: rc.manufacturingPath || concept.manufacturing_path || "Standard manufacturing",
          equipment: "Standard tooling",
          cycle_time: "TBD",
          notes: rc.dfmNotes || concept.dfm_notes || "",
        }],
        supplier_categories: [],
        regulatory_requirements: (rc.certifications || concept.certification_considerations || []).map((c: string) => ({
          requirement: c,
          body: "Varies",
          timeline: "3-12 months",
          cost: "Varies",
        })),
        test_plan: [
          { test: "Functional Validation", method: "Lab testing", pass_criteria: "Meets spec", equipment: "Standard lab" },
          { test: "Durability", method: "Accelerated life testing", pass_criteria: "1000+ cycles", equipment: "Environmental chamber" },
          { test: "User Acceptance", method: "Field trial", pass_criteria: "80%+ satisfaction", equipment: "N/A" },
        ],
      };

      setData(deepDiveData);
      toast.success("Engineering deep dive complete!");
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger on mount
  if (!autoTriggered && !data && !loading) {
    setAutoTriggered(true);
    runDeepDive();
  }

  return (
    <div className="space-y-4">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-muted"
          style={{ border: "1px solid hsl(var(--border))" }}
        >
          <ArrowLeft size={12} />
          Back to Concepts
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(38 92% 50% / 0.1)" }}
          >
            <Wrench size={14} style={{ color: "hsl(38 92% 50%)" }} />
          </div>
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Engineering Deep Dive
          </h2>
        </div>
      </div>

      {/* Concept header */}
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <h3 className="text-lg font-black text-foreground">{concept.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{concept.tagline}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Generating engineering details…</span>
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Detailed BOM */}
          {data.detailed_bom.length > 0 && (
            <Section title="Detailed Bill of Materials">
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "hsl(var(--muted))" }}>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Component</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Material</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Process</th>
                      <th className="text-right px-2 py-1.5 font-bold text-muted-foreground">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detailed_bom.map((item, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid hsl(var(--border))" : undefined }}>
                        <td className="px-2 py-1.5 text-foreground font-semibold">{item.component}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{item.material}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{item.process}</td>
                        <td className="px-2 py-1.5 text-right text-foreground font-mono">{item.unitCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Prototype Plan */}
          {data.prototype_plan.length > 0 && (
            <Section title="Prototype Plan">
              <div className="space-y-2">
                {data.prototype_plan.map((phase, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "hsl(var(--muted) / 0.5)" }}
                  >
                    <span className="text-xs font-black text-primary w-6">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{phase.phase}</p>
                      <p className="text-xs text-muted-foreground">{phase.duration} · {phase.deliverable}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{phase.cost_estimate}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Regulatory Requirements */}
          {data.regulatory_requirements.length > 0 && (
            <Section title="Regulatory Requirements">
              <div className="space-y-1.5">
                {data.regulatory_requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-foreground">{req.requirement}</span>
                    <span className="text-muted-foreground">· {req.timeline}</span>
                    <span className="text-muted-foreground">· {req.cost}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Test Plan */}
          {data.test_plan.length > 0 && (
            <Section title="Test Plan">
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "hsl(var(--muted))" }}>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Test</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Method</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Pass Criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.test_plan.map((test, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid hsl(var(--border))" : undefined }}>
                        <td className="px-2 py-1.5 text-foreground font-semibold">{test.test}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{test.method}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{test.pass_criteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </motion.div>
      )}
    </div>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}
