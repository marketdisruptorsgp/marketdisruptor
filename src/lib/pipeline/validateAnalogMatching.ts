/**
 * Analog Matching Validation Pipeline
 * 
 * Validates that the Concept Evaluation Engine correctly identifies
 * structural analogs and applies meaningful scoring.
 */

import type {
  EvaluableConcept,
  EvaluableAnalog,
  EvaluationContext,
  StructuralFeatures,
  ConceptEvaluationResult,
} from "../conceptEvaluation/types";
import { evaluateConceptBatch } from "../conceptEvaluation";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface DimensionOverlap {
  dimension: string;
  conceptValue: string | undefined;
  analogValue: string | undefined;
  matches: boolean;
  weight: number;
}

interface AnalogMatchDetail {
  analogName: string;
  similarity: number;
  outcome: string;
  dimensionOverlaps: DimensionOverlap[];
  matchingDimensions: string[];
  missingDimensions: string[];
  sanityCheckPassed: boolean;
  sanityCheckReason: string;
}

interface ConceptValidationResult {
  conceptTitle: string;
  conceptType: string;
  feasibilityScore: number;
  weightedComposite: number;
  verdict: string;
  analogMatches: AnalogMatchDetail[];
}

interface IndustryValidationResult {
  industry: string;
  archetype: string;
  conceptCount: number;
  concepts: ConceptValidationResult[];
}

interface ValidationSummary {
  totalConcepts: number;
  averageFeasibilityScore: number;
  averageAnalogSimilarity: number;
  strongAnalogSupport: number;  // >0.7 similarity
  moderateAnalogSupport: number; // 0.4-0.7
  weakAnalogSupport: number;    // <0.4
  sanityCheckPassRate: number;
  topAnalogs: { name: string; matchCount: number }[];
}

export interface ValidationReport {
  industries: IndustryValidationResult[];
  summary: ValidationSummary;
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════
//  DIMENSION WEIGHTS (must match diversity.ts)
// ═══════════════════════════════════════════════════════════════

const DIMENSION_WEIGHTS: Record<string, number> = {
  concept_type: 0.30,
  distribution: 0.25,
  customer: 0.20,
  function: 0.15,
  pricing_model: 0.10,
  workflow_stage: 0.08,
  regulatory_class: 0.05,
  capital_intensity: 0.05,
};

const MAJOR_DIMENSIONS = ["concept_type", "distribution", "customer", "function"];

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL OVERLAP ANALYSIS
// ═══════════════════════════════════════════════════════════════

function analyzeStructuralOverlap(
  conceptFeatures: StructuralFeatures,
  analogFeatures: StructuralFeatures
): DimensionOverlap[] {
  const overlaps: DimensionOverlap[] = [];
  
  for (const [dimension, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const conceptVal = conceptFeatures[dimension];
    const analogVal = analogFeatures[dimension];
    
    const matches = !!(
      conceptVal &&
      analogVal &&
      conceptVal.toLowerCase() === analogVal.toLowerCase()
    );
    
    overlaps.push({
      dimension,
      conceptValue: conceptVal,
      analogValue: analogVal,
      matches,
      weight,
    });
  }
  
  return overlaps.sort((a, b) => b.weight - a.weight);
}

// ═══════════════════════════════════════════════════════════════
//  SANITY CHECKS
// ═══════════════════════════════════════════════════════════════

function runSanityCheck(
  similarity: number,
  overlaps: DimensionOverlap[]
): { passed: boolean; reason: string } {
  const matchingMajor = overlaps.filter(
    (o) => MAJOR_DIMENSIONS.includes(o.dimension) && o.matches
  );
  
  // High similarity (>0.75): should share concept_type AND distribution
  if (similarity > 0.75) {
    const hasConceptType = overlaps.find((o) => o.dimension === "concept_type")?.matches;
    const hasDistribution = overlaps.find((o) => o.dimension === "distribution")?.matches;
    
    if (hasConceptType && hasDistribution) {
      return { passed: true, reason: "High similarity with matching concept_type + distribution" };
    }
    return {
      passed: false,
      reason: `High similarity (${(similarity * 100).toFixed(0)}%) but missing concept_type or distribution match`,
    };
  }
  
  // Moderate similarity (0.5-0.75): should share at least one major dimension
  if (similarity >= 0.5) {
    if (matchingMajor.length >= 1) {
      return {
        passed: true,
        reason: `Moderate similarity with ${matchingMajor.length} major dimension match(es)`,
      };
    }
    return {
      passed: false,
      reason: `Moderate similarity (${(similarity * 100).toFixed(0)}%) but no major dimension matches`,
    };
  }
  
  // Low similarity (<0.5): no specific expectation, always passes
  return { passed: true, reason: "Low similarity — no structural expectation" };
}

// ═══════════════════════════════════════════════════════════════
//  MOCK DATA GENERATORS
// ═══════════════════════════════════════════════════════════════

interface TestIndustry {
  name: string;
  archetype: string;
  concepts: EvaluableConcept[];
}

function generateTestIndustries(): TestIndustry[] {
  return [
    {
      name: "HVAC Services",
      archetype: "roll_up",
      concepts: [
        {
          id: "hvac-rollup-1",
          domain: "hvac_services",
          concept_type: "roll_up",
          structural_features: {
            function: "operations",
            customer: "smb",
            workflow_stage: "service_delivery",
            pricing_model: "recurring",
            distribution: "direct_sales",
            regulatory_class: "light",
            capital_intensity: "moderate",
            concept_type: "roll_up",
          },
        },
        {
          id: "hvac-saas-1",
          domain: "hvac_services",
          concept_type: "vertical_saas",
          structural_features: {
            function: "scheduling",
            customer: "smb",
            workflow_stage: "operations",
            pricing_model: "subscription",
            distribution: "plg",
            regulatory_class: "light",
            capital_intensity: "low",
            concept_type: "vertical_saas",
          },
        },
        {
          id: "hvac-marketplace-1",
          domain: "hvac_services",
          concept_type: "marketplace",
          structural_features: {
            function: "lead_generation",
            customer: "smb",
            workflow_stage: "acquisition",
            pricing_model: "transaction_fee",
            distribution: "network_effects",
            regulatory_class: "light",
            capital_intensity: "low",
            concept_type: "marketplace",
          },
        },
      ],
    },
    {
      name: "Dental Labs",
      archetype: "productization",
      concepts: [
        {
          id: "dental-prod-1",
          domain: "dental_labs",
          concept_type: "productized_service",
          structural_features: {
            function: "manufacturing",
            customer: "smb",
            workflow_stage: "fulfillment",
            pricing_model: "per_unit",
            distribution: "direct_sales",
            regulatory_class: "moderate",
            capital_intensity: "moderate",
            concept_type: "productized_service",
          },
        },
        {
          id: "dental-saas-1",
          domain: "dental_labs",
          concept_type: "vertical_saas",
          structural_features: {
            function: "order_management",
            customer: "smb",
            workflow_stage: "operations",
            pricing_model: "subscription",
            distribution: "direct_sales",
            regulatory_class: "moderate",
            capital_intensity: "low",
            concept_type: "vertical_saas",
          },
        },
      ],
    },
    {
      name: "Property Management",
      archetype: "vertical_saas",
      concepts: [
        {
          id: "propman-saas-1",
          domain: "property_management",
          concept_type: "vertical_saas",
          structural_features: {
            function: "property_management",
            customer: "smb",
            workflow_stage: "operations",
            pricing_model: "subscription",
            distribution: "direct_sales",
            regulatory_class: "moderate",
            capital_intensity: "low",
            concept_type: "vertical_saas",
          },
        },
        {
          id: "propman-fintech-1",
          domain: "property_management",
          concept_type: "embedded_fintech",
          structural_features: {
            function: "payments",
            customer: "smb",
            workflow_stage: "settlement",
            pricing_model: "transaction_fee",
            distribution: "embedded",
            regulatory_class: "heavy",
            capital_intensity: "moderate",
            concept_type: "embedded_fintech",
          },
        },
      ],
    },
    {
      name: "Commercial Roofing",
      archetype: "roll_up",
      concepts: [
        {
          id: "roofing-rollup-1",
          domain: "commercial_roofing",
          concept_type: "roll_up",
          structural_features: {
            function: "operations",
            customer: "enterprise",
            workflow_stage: "service_delivery",
            pricing_model: "project_based",
            distribution: "direct_sales",
            regulatory_class: "moderate",
            capital_intensity: "high",
            concept_type: "roll_up",
          },
        },
        {
          id: "roofing-saas-1",
          domain: "commercial_roofing",
          concept_type: "vertical_saas",
          structural_features: {
            function: "estimation",
            customer: "smb",
            workflow_stage: "sales",
            pricing_model: "subscription",
            distribution: "plg",
            regulatory_class: "light",
            capital_intensity: "low",
            concept_type: "vertical_saas",
          },
        },
      ],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
//  VALIDATION RUNNER
// ═══════════════════════════════════════════════════════════════

export async function runAnalogValidation(
  analogs: EvaluableAnalog[]
): Promise<ValidationReport> {
  const industries = generateTestIndustries();
  const industryResults: IndustryValidationResult[] = [];
  
  const allAnalogMatches: { name: string; similarity: number }[] = [];
  const allFeasibilityScores: number[] = [];
  const allSanityResults: boolean[] = [];
  const analogMatchCounts: Record<string, number> = {};
  
  console.log("\n" + "═".repeat(70));
  console.log("  ANALOG MATCHING VALIDATION");
  console.log("═".repeat(70));
  console.log(`\n  Analogs loaded: ${analogs.length}`);
  console.log(`  Industries to test: ${industries.length}`);
  
  for (const industry of industries) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`  INDUSTRY: ${industry.name.toUpperCase()}`);
    console.log(`  Archetype: ${industry.archetype}`);
    console.log(`  Test concepts: ${industry.concepts.length}`);
    console.log("─".repeat(70));
    
    const context: EvaluationContext = {
      zone: null,
      marketSignals: null,
      marketContext: null,
      analogs,
      priorConcepts: [],
    };
    
    const results = evaluateConceptBatch(industry.concepts, context);
    const conceptResults: ConceptValidationResult[] = [];
    
    for (const result of results) {
      const concept = industry.concepts.find((c) => c.id === result.conceptId)!;
      const analogMatches: AnalogMatchDetail[] = [];
      
      console.log(`\n  📋 Concept: ${concept.id}`);
      console.log(`     Type: ${concept.concept_type}`);
      console.log(`     Feasibility: ${(result.feasibility.score * 100).toFixed(1)}%`);
      console.log(`     Weighted Composite: ${(result.weightedComposite * 100).toFixed(1)}%`);
      console.log(`     Verdict: ${result.verdict}`);
      
      allFeasibilityScores.push(result.feasibility.score);
      
      if (result.feasibility.nearestAnalogs.length > 0) {
        console.log(`\n     Nearest Analogs:`);
        
        for (const match of result.feasibility.nearestAnalogs) {
          const analog = analogs.find((a) => a.id === match.analogId);
          if (!analog) continue;
          
          const overlaps = analyzeStructuralOverlap(
            concept.structural_features,
            analog.structural_features
          );
          
          const sanityResult = runSanityCheck(match.similarity, overlaps);
          allSanityResults.push(sanityResult.passed);
          
          const matchingDims = overlaps
            .filter((o) => o.matches)
            .map((o) => o.dimension);
          const missingDims = overlaps
            .filter((o) => !o.matches && o.conceptValue && o.analogValue)
            .map((o) => o.dimension);
          
          analogMatches.push({
            analogName: match.name,
            similarity: match.similarity,
            outcome: match.outcome,
            dimensionOverlaps: overlaps,
            matchingDimensions: matchingDims,
            missingDimensions: missingDims,
            sanityCheckPassed: sanityResult.passed,
            sanityCheckReason: sanityResult.reason,
          });
          
          // Track for summary
          allAnalogMatches.push({ name: match.name, similarity: match.similarity });
          analogMatchCounts[match.name] = (analogMatchCounts[match.name] || 0) + 1;
          
          // Log details
          const sanityIcon = sanityResult.passed ? "✓" : "✗";
          console.log(`\n       → ${match.name} (${(match.similarity * 100).toFixed(0)}% similar, ${match.outcome})`);
          console.log(`         Sanity check: ${sanityIcon} ${sanityResult.reason}`);
          console.log(`         Matching dimensions: ${matchingDims.join(", ") || "none"}`);
          
          // Show dimension breakdown for top analog
          if (result.feasibility.nearestAnalogs.indexOf(match) === 0) {
            console.log(`         Dimension breakdown:`);
            for (const overlap of overlaps.slice(0, 5)) {
              const matchIcon = overlap.matches ? "✓" : "·";
              const conceptVal = overlap.conceptValue || "—";
              const analogVal = overlap.analogValue || "—";
              console.log(
                `           ${matchIcon} ${overlap.dimension} (w=${overlap.weight.toFixed(2)}): "${conceptVal}" vs "${analogVal}"`
              );
            }
          }
        }
      } else {
        console.log(`     ⚠ No analog matches found`);
      }
      
      conceptResults.push({
        conceptTitle: concept.id,
        conceptType: concept.concept_type || "unknown",
        feasibilityScore: result.feasibility.score,
        weightedComposite: result.weightedComposite,
        verdict: result.verdict,
        analogMatches,
      });
    }
    
    industryResults.push({
      industry: industry.name,
      archetype: industry.archetype,
      conceptCount: industry.concepts.length,
      concepts: conceptResults,
    });
  }
  
  // ─── SUMMARY ───────────────────────────────────────────────────
  const avgFeasibility =
    allFeasibilityScores.length > 0
      ? allFeasibilityScores.reduce((a, b) => a + b, 0) / allFeasibilityScores.length
      : 0;
  
  const avgSimilarity =
    allAnalogMatches.length > 0
      ? allAnalogMatches.reduce((a, b) => a + b.similarity, 0) / allAnalogMatches.length
      : 0;
  
  const strongSupport = allAnalogMatches.filter((m) => m.similarity > 0.7).length;
  const moderateSupport = allAnalogMatches.filter(
    (m) => m.similarity >= 0.4 && m.similarity <= 0.7
  ).length;
  const weakSupport = allAnalogMatches.filter((m) => m.similarity < 0.4).length;
  
  const sanityPassRate =
    allSanityResults.length > 0
      ? allSanityResults.filter((r) => r).length / allSanityResults.length
      : 0;
  
  const topAnalogs = Object.entries(analogMatchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, matchCount: count }));
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (avgSimilarity < 0.3) {
    recommendations.push(
      "Average similarity is very low — consider adding more diverse analogs or adjusting feature weights"
    );
  }
  
  if (sanityPassRate < 0.7) {
    recommendations.push(
      `Sanity check pass rate (${(sanityPassRate * 100).toFixed(0)}%) is below threshold — review dimension weighting`
    );
  }
  
  if (weakSupport > strongSupport + moderateSupport) {
    recommendations.push(
      "Most concepts have weak analog support — analog dataset may need expansion"
    );
  }
  
  if (topAnalogs.length > 0 && topAnalogs[0].matchCount > allAnalogMatches.length * 0.5) {
    recommendations.push(
      `Single analog (${topAnalogs[0].name}) dominates matches — consider adding more diverse examples`
    );
  }
  
  const summary: ValidationSummary = {
    totalConcepts: allFeasibilityScores.length,
    averageFeasibilityScore: Math.round(avgFeasibility * 1000) / 1000,
    averageAnalogSimilarity: Math.round(avgSimilarity * 1000) / 1000,
    strongAnalogSupport: strongSupport,
    moderateAnalogSupport: moderateSupport,
    weakAnalogSupport: weakSupport,
    sanityCheckPassRate: Math.round(sanityPassRate * 1000) / 1000,
    topAnalogs,
  };
  
  // Print summary
  console.log("\n" + "═".repeat(70));
  console.log("  VALIDATION SUMMARY");
  console.log("═".repeat(70));
  console.log(`\n  Total concepts evaluated: ${summary.totalConcepts}`);
  console.log(`  Average feasibility score: ${(summary.averageFeasibilityScore * 100).toFixed(1)}%`);
  console.log(`  Average analog similarity: ${(summary.averageAnalogSimilarity * 100).toFixed(1)}%`);
  console.log(`\n  Analog support distribution:`);
  console.log(`    Strong (>70%):   ${summary.strongAnalogSupport}`);
  console.log(`    Moderate (40-70%): ${summary.moderateAnalogSupport}`);
  console.log(`    Weak (<40%):     ${summary.weakAnalogSupport}`);
  console.log(`\n  Sanity check pass rate: ${(summary.sanityCheckPassRate * 100).toFixed(1)}%`);
  console.log(`\n  Most matched analogs:`);
  for (const analog of summary.topAnalogs) {
    console.log(`    - ${analog.name}: ${analog.matchCount} matches`);
  }
  
  if (recommendations.length > 0) {
    console.log(`\n  ⚠ Recommendations:`);
    for (const rec of recommendations) {
      console.log(`    • ${rec}`);
    }
  } else {
    console.log(`\n  ✓ No issues detected — analog matching appears healthy`);
  }
  
  console.log("\n" + "═".repeat(70) + "\n");
  
  return {
    industries: industryResults,
    summary,
    recommendations,
  };
}

// ═══════════════════════════════════════════════════════════════
//  TOP-N ANALOG CONFIRMATION
// ═══════════════════════════════════════════════════════════════

/**
 * NOTE: The Concept Evaluation Engine (scorers.ts) uses ONLY the top 3
 * nearest analogs for feasibility scoring. This is intentional to prevent
 * distant analogs from diluting the signal.
 * 
 * See: scoreAnalogFeasibility() → `const top3 = scored.slice(0, 3)`
 * 
 * The scoring formula is:
 *   score = avg(similarity × outcome_weight) for top 3 analogs
 * 
 * Outcome weights:
 *   - successful: 1.0
 *   - acquired: 0.9
 *   - unknown: 0.5
 *   - failed: -0.15
 */
export const ANALOG_USAGE_NOTE = {
  topN: 3,
  reason: "Only top 3 nearest analogs are used to prevent distant cases from diluting signal",
  scoringFormula: "avg(similarity × outcome_weight)",
};
