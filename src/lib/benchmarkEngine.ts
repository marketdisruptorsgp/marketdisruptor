/**
 * INDUSTRY BENCHMARK ENGINE
 *
 * Derives benchmark comparisons from evidence signals and playbook scores.
 * No external data — benchmarks are computed from internal signal patterns
 * and structural analysis relative to industry archetypes.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { TransformationPlaybook } from "@/lib/playbookEngine";

export interface BenchmarkMetric {
  label: string;
  rating: "above_average" | "average" | "below_average";
  rationale: string;
  score: number; // 0-10
}

export interface BenchmarkResult {
  metrics: BenchmarkMetric[];
  summary: string;
  modelType: string;
}

export interface OpportunityRadarItem {
  label: string;
  leverage: "high" | "moderate" | "low";
  score: number;
  description: string;
}

export interface StrategicNarrativeStory {
  paragraphs: string[];
  impactLine: string;
}

/* ── Benchmark Computation ── */

function ratingFromScore(score: number): "above_average" | "average" | "below_average" {
  if (score >= 7) return "above_average";
  if (score >= 4) return "average";
  return "below_average";
}

export function computeBenchmarks(
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
  playbook: TransformationPlaybook | null,
): BenchmarkResult {
  // Derive scores from evidence density per category
  const catCounts = new Map<string, number>();
  for (const e of evidence) {
    const cat = e.category || "general";
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }

  const demandStrength = Math.min(10, (catCounts.get("demand_signal") || 0) * 1.5 + 2);
  const costEfficiency = Math.min(10, 10 - (catCounts.get("cost_structure") || 0) * 0.8);
  const competitivePos = Math.min(10, (catCounts.get("competitive_pressure") || 0) * 1.2 + 3);
  const operationalEff = Math.min(10, 10 - (catCounts.get("operational_dependency") || 0) * 1.0);

  const marginScore = playbook ? playbook.impact.marginImprovement : Math.round((costEfficiency + operationalEff) / 2);
  const scalabilityScore = playbook ? playbook.impact.revenueExpansion : Math.round(demandStrength * 0.7);
  const difficultyScore = playbook ? playbook.impact.executionDifficulty : 5;

  const metrics: BenchmarkMetric[] = [
    {
      label: "Margin Potential",
      rating: ratingFromScore(marginScore),
      rationale: marginScore >= 7
        ? "Strong margin expansion signals detected in cost structure and pricing model"
        : marginScore >= 4
          ? "Moderate margin opportunity within current operational structure"
          : "Cost structure and operational dependencies limit margin expansion",
      score: marginScore,
    },
    {
      label: "Scalability",
      rating: ratingFromScore(scalabilityScore),
      rationale: scalabilityScore >= 7
        ? "Demand signals and model structure support significant scaling"
        : scalabilityScore >= 4
          ? "Some scaling potential within current delivery architecture"
          : "Current model creates scaling constraints that limit growth trajectory",
      score: scalabilityScore,
    },
    {
      label: "Execution Difficulty",
      rating: ratingFromScore(10 - difficultyScore), // Invert — lower difficulty = better
      rationale: difficultyScore <= 3
        ? "Low execution barriers — incremental changes can drive results"
        : difficultyScore <= 6
          ? "Moderate organizational change required for strategic shift"
          : "Significant structural transformation needed",
      score: difficultyScore,
    },
    {
      label: "Market Position",
      rating: ratingFromScore(competitivePos),
      rationale: competitivePos >= 7
        ? "Strong competitive signals indicate differentiated positioning"
        : competitivePos >= 4
          ? "Competitive landscape presents both threats and opportunities"
          : "Limited competitive differentiation detected in current model",
      score: competitivePos,
    },
    {
      label: "Demand Strength",
      rating: ratingFromScore(demandStrength),
      rationale: demandStrength >= 7
        ? "Strong demand indicators across customer behavior and market data"
        : demandStrength >= 4
          ? "Moderate demand signals with growth potential"
          : "Demand signals need strengthening — consider market validation",
      score: demandStrength,
    },
  ];

  const aboveCount = metrics.filter(m => m.rating === "above_average").length;
  const belowCount = metrics.filter(m => m.rating === "below_average").length;

  const modelType = narrative?.primaryConstraint
    ? `${narrative.primaryConstraint}-constrained model`
    : "Current business model";

  const summary = aboveCount >= 3
    ? `This ${modelType} shows above-average potential across most dimensions, with strong fundamentals for strategic transformation.`
    : belowCount >= 3
      ? `This ${modelType} faces structural challenges in several areas, but targeted strategic moves can address the core constraints.`
      : `This ${modelType} shows mixed signals — strong in some areas with room for improvement in others.`;

  return { metrics, summary, modelType };
}

/* ── Opportunity Radar ── */

export function computeOpportunityRadar(
  playbooks: TransformationPlaybook[],
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
): OpportunityRadarItem[] {
  const items: OpportunityRadarItem[] = [];

  // From playbooks
  for (const pb of playbooks) {
    const leverage: "high" | "moderate" | "low" =
      pb.impact.leverageScore >= 7 ? "high"
        : pb.impact.leverageScore >= 4 ? "moderate"
          : "low";
    items.push({
      label: pb.title,
      leverage,
      score: pb.impact.leverageScore,
      description: pb.strategicThesis.length > 80
        ? pb.strategicThesis.slice(0, 77) + "…"
        : pb.strategicThesis,
    });
  }

  // Add structural opportunities from narrative
  if (narrative?.breakthroughOpportunity && !items.some(i => i.label.includes(narrative.breakthroughOpportunity!.slice(0, 20)))) {
    items.push({
      label: narrative.breakthroughOpportunity,
      leverage: "high",
      score: 8,
      description: "Breakthrough opportunity identified from structural analysis",
    });
  }

  // Sort by score descending
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, 6);
}

/* ── Strategic Narrative Story ── */

export function generateStrategicStory(
  narrative: StrategicNarrative | null,
  playbook: TransformationPlaybook | null,
  evidence: Evidence[],
): StrategicNarrativeStory {
  if (!narrative) {
    return {
      paragraphs: ["Collecting evidence to form a strategic narrative. Complete more analysis steps to generate a comprehensive strategy story."],
      impactLine: "Impact projection will appear once sufficient evidence is gathered.",
    };
  }

  const paragraphs: string[] = [];

  // P1 — The constraint
  if (narrative.primaryConstraint) {
    paragraphs.push(
      `The current model is constrained by ${narrative.primaryConstraint.toLowerCase()}.`
    );
  }

  // P2 — The evidence context
  const demandEvidence = evidence.filter(e => e.category === "demand_signal");
  const costEvidence = evidence.filter(e => e.category === "cost_structure");
  const opEvidence = evidence.filter(e => e.category === "operational_dependency");

  if (demandEvidence.length > 0 && (costEvidence.length > 0 || opEvidence.length > 0)) {
    const demandPhrase = demandEvidence.length >= 3 ? "Demand signals are strong" : "Demand signals are emerging";
    const constraintPhrase = opEvidence.length > 0
      ? "delivery depends on operational capacity"
      : "the cost structure limits scaling efficiency";
    paragraphs.push(`${demandPhrase}, but ${constraintPhrase}.`);
  }

  // P3 — The consequence
  if (narrative.trappedValue) {
    paragraphs.push(
      `This creates ${narrative.trappedValueEstimate ? `an estimated ${narrative.trappedValueEstimate} in` : ""} trapped value that limits expansion potential.`
    );
  } else if (narrative.primaryConstraint) {
    paragraphs.push(
      "This creates a structural ceiling that limits growth and margin expansion."
    );
  }

  // P4 — The strategic direction
  if (narrative.strategicVerdict) {
    paragraphs.push(
      `The most promising move is to ${narrative.strategicVerdict.toLowerCase()}.`
    );
  } else if (playbook) {
    paragraphs.push(
      `The most promising move is to ${playbook.strategicShift.toLowerCase()}.`
    );
  }

  // P5 — The mechanism
  if (playbook) {
    paragraphs.push(
      `This would shift the model toward ${playbook.whyThisWorks[0]?.toLowerCase() || "scalable delivery"} and unlock higher margins.`
    );
  }

  // Impact line
  let impactLine = "Impact assessment pending additional evidence.";
  if (playbook) {
    const rev = playbook.impact.revenueExpansion;
    const margin = playbook.impact.marginImprovement;
    if (rev >= 7 && margin >= 7) {
      impactLine = "Significant revenue and margin expansion potential with improved unit economics.";
    } else if (rev >= 5) {
      impactLine = `${Math.round(1 + rev / 3)}–${Math.round(2 + rev / 2)}× revenue potential with improved operational leverage.`;
    } else {
      impactLine = "Moderate improvement in operational efficiency and margin structure.";
    }
  }

  return { paragraphs, impactLine };
}
