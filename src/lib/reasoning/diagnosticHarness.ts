/**
 * REASONING PIPELINE DIAGNOSTIC HARNESS
 * 
 * Comprehensive diagnostic analysis across representative business domains.
 * Evaluates pipeline quality at each stage and produces actionable insights.
 */

import type { Evidence, EvidenceTier, EvidenceType, EvidencePipelineStep } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicInsightType } from "@/lib/strategicEngine";
import { detectCandidateConstraints, type ConstraintCandidate } from "@/lib/constraintDetectionEngine";
import {
  extractBaseline,
  identifyActiveDimensions,
  generateOpportunityVectors,
  applyQualificationGates,
  clusterIntoZones,
  resetCounters,
  type BusinessBaseline,
  type OpportunityVector,
  type OpportunityZone,
  type DimensionAlternative,
} from "@/lib/opportunityDesignEngine";

// ═══════════════════════════════════════════════════════════════
//  HELPER TO CREATE EVIDENCE
// ═══════════════════════════════════════════════════════════════

function makeEvidence(
  id: string,
  label: string,
  description: string,
  category: string,
  sourceCount: number
): Evidence {
  return {
    id,
    label,
    description,
    category,
    sourceCount,
    type: "signal" as EvidenceType,
    pipelineStep: "report" as EvidencePipelineStep,
    tier: "system" as EvidenceTier,
  };
}

// ═══════════════════════════════════════════════════════════════
//  TEST DOMAIN DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface TestDomainInput {
  name: string;
  description: string;
  evidence: Evidence[];
  expectedConstraints: string[];
  expectedTransformations: string[];
}

function buildTestDomains(): TestDomainInput[] {
  return [
    // ── 1. DENTAL PRACTICE ──
    {
      name: "Dental Practice",
      description: "Traditional fee-for-service dental office with chair utilization as primary capacity metric",
      expectedConstraints: ["capacity_ceiling", "geographic_constraint", "transactional_revenue", "labor_intensity"],
      expectedTransformations: ["membership pricing", "tele-dentistry triage", "insurance payment cycle smoothing"],
      evidence: [
        makeEvidence("dent-1", "Chair utilization averages 68% with peaks during lunch hours", "Most chairs sit idle during off-peak hours; scheduling inefficiency limits revenue capture", "cost_structure", 3),
        makeEvidence("dent-2", "Insurance reimbursement delays average 45 days", "Cash flow gaps between service delivery and payment create working capital pressure", "pricing_model", 4),
        makeEvidence("dent-3", "Patient acquisition relies on local referrals and walk-ins", "No systematic marketing; growth limited by word-of-mouth in 5-mile radius", "distribution_channel", 2),
        makeEvidence("dent-4", "Hygienist scheduling creates bottleneck", "Hygienists fully booked 3 weeks out; dentist time underutilized waiting for cleanings", "operational_dependency", 3),
        makeEvidence("dent-5", "Per-visit pricing model dominant", "Patients pay per procedure; no recurring relationship incentivizes preventive care", "pricing_model", 5),
        makeEvidence("dent-6", "High no-show rate (15-20%)", "Patients frequently miss appointments; no financial commitment reduces reliability", "customer_behavior", 2),
        makeEvidence("dent-7", "Competition from DSOs intensifying", "Corporate dental service organizations acquiring local practices; pricing pressure increasing", "competitive_pressure", 3),
      ],
    },
    // ── 2. SAAS PROJECT MANAGEMENT TOOL ──
    {
      name: "SaaS Project Management Tool",
      description: "B2B software for team collaboration with freemium model and seat-based pricing",
      expectedConstraints: ["switching_friction", "commoditized_pricing", "revenue_concentration"],
      expectedTransformations: ["usage-based pricing", "vertical specialization", "workflow automation"],
      evidence: [
        makeEvidence("saas-1", "Free tier users rarely convert to paid", "95% of users stay on free tier; conversion bottleneck limits revenue growth", "pricing_model", 4),
        makeEvidence("saas-2", "Seat-based pricing creates expansion friction", "Customers resist adding seats; per-user model limits adoption within organizations", "pricing_model", 3),
        makeEvidence("saas-3", "Feature parity with competitors high", "Core features identical to Asana, Monday, ClickUp; no defensible differentiation", "competitive_pressure", 5),
        makeEvidence("saas-4", "Enterprise deals require 6-month sales cycles", "Large contracts take extended negotiations; CAC payback extends beyond 18 months", "distribution_channel", 2),
        makeEvidence("saas-5", "Integration ecosystem underdeveloped", "Limited third-party integrations compared to market leaders; reduces stickiness", "technology_dependency", 3),
        makeEvidence("saas-6", "Monthly churn at 4.5%", "Users switching to alternatives; weak retention indicates low switching costs", "customer_behavior", 4),
        makeEvidence("saas-7", "Top 10 customers represent 35% of ARR", "Revenue concentration risk; loss of major account would significantly impact growth", "demand_signal", 2),
      ],
    },
    // ── 3. LOCAL RESTAURANT ──
    {
      name: "Local Restaurant",
      description: "Neighborhood casual dining establishment with fixed seating and location-based demand",
      expectedConstraints: ["capacity_ceiling", "geographic_constraint", "inventory_burden", "labor_intensity"],
      expectedTransformations: ["ghost kitchen expansion", "subscription meal service", "delivery-first model"],
      evidence: [
        makeEvidence("rest-1", "Peak hour waits exceed 45 minutes on weekends", "Lost customers during high-demand periods; capacity ceiling limits revenue capture", "operational_dependency", 3),
        makeEvidence("rest-2", "Food waste at 12% of inventory", "Perishable ingredients expire before use; variable demand creates spoilage", "cost_structure", 4),
        makeEvidence("rest-3", "Staff turnover at 80% annually", "High replacement cost and training burden; service quality inconsistent", "operational_dependency", 3),
        makeEvidence("rest-4", "Delivery platform fees consuming 25% of order value", "Third-party delivery erodes margins; no direct customer relationship", "distribution_channel", 5),
        makeEvidence("rest-5", "Location draws primarily from 2-mile radius", "Customer base geographically limited; expansion requires new locations", "demand_signal", 2),
        makeEvidence("rest-6", "Average check declining as customers trade down", "Economic pressure reducing per-visit spend; traffic steady but revenue per guest down", "pricing_model", 3),
        makeEvidence("rest-7", "Kitchen equipment underutilized during off-peak", "Fixed costs continue during slow periods; 3-4 hour daily utilization gap", "cost_structure", 2),
      ],
    },
    // ── 4. LOGISTICS / TRUCKING COMPANY ──
    {
      name: "Logistics / Trucking Company",
      description: "Regional freight carrier with owner-operator model and spot market exposure",
      expectedConstraints: ["asset_underutilization", "labor_intensity", "channel_dependency", "margin_compression"],
      expectedTransformations: ["digital freight matching", "dedicated fleet contracts", "asset-light brokerage"],
      evidence: [
        makeEvidence("log-1", "Empty miles at 22% of total distance", "Trucks returning without cargo; deadhead drives up per-load costs", "cost_structure", 5),
        makeEvidence("log-2", "Driver shortage limiting fleet expansion", "Cannot hire qualified CDL drivers; growth capped by labor availability", "operational_dependency", 4),
        makeEvidence("log-3", "Spot market rates volatile (±30% quarterly)", "Revenue unpredictable; capacity-demand imbalance creates pricing swings", "pricing_model", 3),
        makeEvidence("log-4", "Broker relationships capture 15% margin", "Intermediaries take significant cut; direct shipper access limited", "distribution_channel", 4),
        makeEvidence("log-5", "Fuel costs represent 35% of operating expense", "Commodity price exposure creates margin volatility; hedging complex", "cost_structure", 3),
        makeEvidence("log-6", "Fleet average age 7 years", "Maintenance costs rising; older trucks less fuel efficient", "technology_dependency", 2),
        makeEvidence("log-7", "Insurance premiums increasing 12% annually", "Regulatory and liability costs escalating; compressing already thin margins", "regulatory_constraint", 3),
      ],
    },
    // ── 5. GYM / FITNESS STUDIO ──
    {
      name: "Gym / Fitness Studio",
      description: "Boutique fitness studio with class-based model and membership recurring revenue",
      expectedConstraints: ["capacity_ceiling", "geographic_constraint", "labor_intensity", "switching_friction"],
      expectedTransformations: ["hybrid digital-physical", "franchise expansion", "corporate wellness B2B"],
      evidence: [
        makeEvidence("gym-1", "Peak classes at 95% capacity, off-peak at 40%", "Demand concentrated in morning and evening; midday slots underutilized", "operational_dependency", 4),
        makeEvidence("gym-2", "Instructor quality drives 70% of member satisfaction", "Key person dependency; popular instructors attract loyal following", "operational_dependency", 3),
        makeEvidence("gym-3", "Member acquisition cost $150, churn at 5% monthly", "High CAC with moderate retention; LTV:CAC ratio borderline", "customer_behavior", 3),
        makeEvidence("gym-4", "Members travel max 15 minutes to studio", "Catchment area limited by commute tolerance; expansion requires new locations", "demand_signal", 2),
        makeEvidence("gym-5", "Equipment refresh cycle every 5 years", "Capital expenditure burden; members expect modern equipment", "cost_structure", 2),
        makeEvidence("gym-6", "Subscription fatigue reducing new signups", "Market saturated with fitness apps and subscriptions; harder to acquire", "competitive_pressure", 4),
        makeEvidence("gym-7", "Corporate wellness programs underexplored", "B2B opportunity exists but sales motion undeveloped", "distribution_channel", 2),
      ],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
//  MOCK INSIGHTS FOR BASELINE EXTRACTION
// ═══════════════════════════════════════════════════════════════

function generateMockInsights(evidence: Evidence[], domainKey: string): { constraints: StrategicInsight[]; leverage: StrategicInsight[] } {
  const constraints: StrategicInsight[] = [];
  const leverage: StrategicInsight[] = [];
  const now = Date.now();
  
  const costEvidence = evidence.filter(e => e.category === "cost_structure");
  const pricingEvidence = evidence.filter(e => e.category === "pricing_model");
  const distributionEvidence = evidence.filter(e => e.category === "distribution_channel");
  const operationalEvidence = evidence.filter(e => e.category === "operational_dependency");
  
  if (costEvidence.length >= 2) {
    constraints.push({
      id: `${domainKey}-constraint-cost`,
      analysisId: "diagnostic",
      label: "Cost structure pressure",
      description: "Operating costs creating margin compression",
      insightType: "constraint_cluster" as StrategicInsightType,
      tier: "structural",
      mode: "business_model",
      evidenceIds: costEvidence.map(e => e.id),
      relatedInsightIds: [],
      impact: 7,
      confidence: 0.7,
      createdAt: now,
    });
  }
  
  if (operationalEvidence.length >= 2) {
    constraints.push({
      id: `${domainKey}-constraint-ops`,
      analysisId: "diagnostic",
      label: "Operational bottleneck",
      description: "Process limitations constraining throughput",
      insightType: "constraint_cluster" as StrategicInsightType,
      tier: "system",
      mode: "service",
      evidenceIds: operationalEvidence.map(e => e.id),
      relatedInsightIds: [],
      impact: 8,
      confidence: 0.8,
      createdAt: now,
    });
  }
  
  if (pricingEvidence.length >= 2) {
    leverage.push({
      id: `${domainKey}-leverage-pricing`,
      analysisId: "diagnostic",
      label: "Pricing model opportunity",
      description: "Potential to restructure revenue model",
      insightType: "leverage_point" as StrategicInsightType,
      tier: "system",
      mode: "business_model",
      evidenceIds: pricingEvidence.map(e => e.id),
      relatedInsightIds: [],
      impact: 6,
      confidence: 0.6,
      createdAt: now,
    });
  }
  
  if (distributionEvidence.length >= 2) {
    leverage.push({
      id: `${domainKey}-leverage-dist`,
      analysisId: "diagnostic",
      label: "Distribution expansion",
      description: "Channel optimization potential",
      insightType: "leverage_point" as StrategicInsightType,
      tier: "optimization",
      mode: "service",
      evidenceIds: distributionEvidence.map(e => e.id),
      relatedInsightIds: [],
      impact: 5,
      confidence: 0.5,
      createdAt: now,
    });
  }
  
  return { constraints, leverage };
}

// ═══════════════════════════════════════════════════════════════
//  MOCK AI ALTERNATIVES
// ═══════════════════════════════════════════════════════════════

function generateMockAlternatives(baseline: BusinessBaseline, domainName: string): DimensionAlternative[] {
  const alternatives: DimensionAlternative[] = [];
  
  for (const dim of Object.values(baseline)) {
    if (dim.status === "inactive") continue;
    const domainAlts = getDomainSpecificAlternatives(domainName, dim.category, dim.currentValue);
    for (const alt of domainAlts) {
      alternatives.push({
        dimensionId: dim.id,
        value: alt.value,
        rationale: alt.rationale,
      });
    }
  }
  
  return alternatives;
}

function getDomainSpecificAlternatives(domain: string, category: string, _currentValue: string): { value: string; rationale: string }[] {
  const altMap: Record<string, Record<string, { value: string; rationale: string }[]>> = {
    dental: {
      pricing_model: [
        { value: "Membership subscription with preventive care included", rationale: "Smooths revenue, increases retention, encourages preventive visits" },
        { value: "Insurance-free direct primary care model", rationale: "Eliminates reimbursement delays, simplifies operations" },
      ],
      operational_dependency: [
        { value: "Hygienist-led preventive care pods", rationale: "Maximizes hygienist utilization, frees dentist for complex procedures" },
        { value: "Extended hours with flexible scheduling", rationale: "Captures demand outside traditional 9-5" },
      ],
      customer_behavior: [
        { value: "Prepaid appointment bundles with no-show penalties", rationale: "Reduces cancellations, improves capacity planning" },
      ],
    },
    saas: {
      pricing_model: [
        { value: "Usage-based pricing on active projects", rationale: "Removes seat friction, aligns cost with value delivered" },
        { value: "Outcome-based pricing tied to project completion", rationale: "Differentiates from commodity competitors" },
      ],
      competitive_pressure: [
        { value: "Vertical specialization for construction industry", rationale: "Depth over breadth, builds switching costs" },
        { value: "AI-powered workflow automation as core differentiator", rationale: "Creates feature gap competitors cannot easily close" },
      ],
      customer_behavior: [
        { value: "Embedded collaboration reducing need to switch tools", rationale: "Increases stickiness through workflow integration" },
      ],
    },
    restaurant: {
      operational_dependency: [
        { value: "Ghost kitchen for delivery-only menu expansion", rationale: "Increases capacity without new real estate" },
        { value: "Prep kitchen centralization across multiple locations", rationale: "Reduces per-location labor, improves consistency" },
      ],
      distribution_channel: [
        { value: "Direct delivery fleet with loyalty integration", rationale: "Captures margin currently lost to platforms" },
        { value: "Subscription meal service for regular customers", rationale: "Predictable demand, reduced waste, recurring revenue" },
      ],
      cost_structure: [
        { value: "Dynamic menu pricing based on ingredient costs", rationale: "Protects margins during commodity volatility" },
      ],
    },
    logistics: {
      cost_structure: [
        { value: "Digital freight matching to reduce empty miles", rationale: "Uses backhaul marketplace to improve utilization" },
        { value: "Fuel hedging and route optimization AI", rationale: "Reduces commodity exposure and operating costs" },
      ],
      distribution_channel: [
        { value: "Direct shipper contracts replacing broker dependency", rationale: "Captures margin, builds shipper relationships" },
        { value: "Asset-light brokerage model complementing owned fleet", rationale: "Variable capacity without capital commitment" },
      ],
      operational_dependency: [
        { value: "Owner-operator network with guaranteed minimums", rationale: "Addresses driver shortage through contractor model" },
      ],
    },
    fitness: {
      operational_dependency: [
        { value: "Hybrid digital classes extending instructor reach", rationale: "Monetizes off-peak and expands geographic reach" },
        { value: "Instructor equity/profit share model", rationale: "Retains top talent, aligns incentives" },
      ],
      demand_signal: [
        { value: "Corporate wellness B2B program", rationale: "Higher LTV, employer-paid acquisition" },
        { value: "Franchise model for geographic expansion", rationale: "Capital-light growth, proven playbook replication" },
      ],
      customer_behavior: [
        { value: "Commitment contracts with accountability features", rationale: "Reduces churn through behavioral design" },
      ],
    },
  };
  
  const domainKey = domain.toLowerCase().includes("dental") ? "dental" :
                    domain.toLowerCase().includes("saas") ? "saas" :
                    domain.toLowerCase().includes("restaurant") ? "restaurant" :
                    domain.toLowerCase().includes("logistics") ? "logistics" :
                    domain.toLowerCase().includes("gym") || domain.toLowerCase().includes("fitness") ? "fitness" : "";
  
  return altMap[domainKey]?.[category] || [
    { value: `Alternative ${category} approach`, rationale: "Generic transformation (fallback)" },
  ];
}

// ═══════════════════════════════════════════════════════════════
//  DIAGNOSTIC RESULT TYPES
// ═══════════════════════════════════════════════════════════════

export interface PipelineTrace {
  structuralModel: {
    dimensionCount: number;
    activeDimensions: { name: string; status: string; evidenceCount: number }[];
    hotCount: number;
    warmCount: number;
  };
  constraintDetection: {
    detected: ConstraintCandidate[];
    expectedHits: string[];
    expectedMisses: string[];
    accuracy: number;
  };
  transformations: {
    generated: OpportunityVector[];
    constraintDriven: number;
    adjacencyDriven: number;
  };
  zones: OpportunityZone[];
}

export interface TransformationQuality {
  id: string;
  shift: string;
  grade: "A" | "B" | "C" | "D";
  reason: string;
  llmReproducibility: "clearly_novel" | "possibly_reproducible" | "very_likely_generic";
}

export interface DomainDiagnostic {
  domain: string;
  trace: PipelineTrace;
  constraintDiagnosis: {
    correctIdentifications: string[];
    falsePositives: string[];
    missedConstraints: string[];
    diagnosisNotes: string[];
  };
  transformationReview: TransformationQuality[];
  analogValidation: {
    note: string;
    issue: string;
  };
  structuralImportReview: {
    note: string;
  };
  opportunityQuality: {
    coherent: number;
    actionable: number;
    evidenceSupported: number;
    llmDifferentiation: { novel: number; possible: number; generic: number };
  };
}

export interface SystemicAnalysis {
  recurringWeakTransformations: string[];
  recurringMissedConstraints: string[];
  recurringAnalogIssues: string[];
  recurringReasoningGaps: string[];
}

export interface DiagnosticReport {
  timestamp: string;
  domainResults: DomainDiagnostic[];
  systemicAnalysis: SystemicAnalysis;
  recommendedFixes: string[];
}

// ═══════════════════════════════════════════════════════════════
//  MAIN DIAGNOSTIC RUNNER
// ═══════════════════════════════════════════════════════════════

function gradeTransformation(
  vector: OpportunityVector,
  expectedTransformations: string[],
  _domain: string
): TransformationQuality {
  const shiftText = vector.changedDimensions.map(d => `${d.dimension}: ${d.from} → ${d.to}`).join("; ");
  
  const isSpecific = vector.rationale.length > 50 && 
                     !vector.rationale.includes("Generic") &&
                     vector.changedDimensions.some(d => d.to.length > 20);
  
  const hasConstraintLinkage = vector.explorationMode === "constraint" && vector.triggerIds.length > 0;
  
  const matchesExpected = expectedTransformations.some(exp => 
    shiftText.toLowerCase().includes(exp.toLowerCase().split(" ")[0])
  );
  
  let grade: "A" | "B" | "C" | "D";
  let reason: string;
  let llmReproducibility: "clearly_novel" | "possibly_reproducible" | "very_likely_generic";
  
  if (isSpecific && hasConstraintLinkage && matchesExpected) {
    grade = "A";
    reason = "High-quality: specific, constraint-linked, domain-appropriate";
    llmReproducibility = "clearly_novel";
  } else if (isSpecific && (hasConstraintLinkage || matchesExpected)) {
    grade = "B";
    reason = "Reasonable: specific but missing some causal linkage";
    llmReproducibility = "possibly_reproducible";
  } else if (isSpecific || matchesExpected) {
    grade = "C";
    reason = "Weak: generic or obvious transformation";
    llmReproducibility = "very_likely_generic";
  } else {
    grade = "D";
    reason = "Illogical: no clear constraint connection or domain relevance";
    llmReproducibility = "very_likely_generic";
  }
  
  return { id: vector.id, shift: shiftText, grade, reason, llmReproducibility };
}

function runDomainDiagnostic(testDomain: TestDomainInput): DomainDiagnostic {
  resetCounters();
  
  const evidence = testDomain.evidence;
  const domainKey = testDomain.name.toLowerCase().replace(/\s+/g, "_");
  const { constraints, leverage } = generateMockInsights(evidence, domainKey);
  
  // Stage 1: Constraint Detection
  const detectedConstraints = detectCandidateConstraints(evidence);
  
  // Stage 2: Baseline Extraction
  const rawBaseline = extractBaseline(evidence, constraints, leverage);
  const baseline = identifyActiveDimensions(rawBaseline, constraints, leverage);
  
  // Stage 3: Generate Alternatives
  const alternatives = generateMockAlternatives(baseline, testDomain.name);
  
  // Stage 4: Generate Vectors
  const vectors = generateOpportunityVectors(baseline, alternatives, constraints, leverage);
  
  // Stage 5: Qualification Gates
  const qualifiedVectors = applyQualificationGates(vectors, constraints, evidence, baseline);
  
  // Stage 6: Clustering
  const zones = clusterIntoZones(qualifiedVectors);
  
  // Build trace
  const trace: PipelineTrace = {
    structuralModel: {
      dimensionCount: Object.keys(baseline).length,
      activeDimensions: Object.values(baseline).map(d => ({ 
        name: d.name, 
        status: d.status, 
        evidenceCount: d.evidenceCount 
      })),
      hotCount: Object.values(baseline).filter(d => d.status === "hot").length,
      warmCount: Object.values(baseline).filter(d => d.status === "warm").length,
    },
    constraintDetection: {
      detected: detectedConstraints,
      expectedHits: testDomain.expectedConstraints.filter(exp => 
        detectedConstraints.some(d => d.constraintName.includes(exp) || exp.includes(d.constraintName))
      ),
      expectedMisses: testDomain.expectedConstraints.filter(exp => 
        !detectedConstraints.some(d => d.constraintName.includes(exp) || exp.includes(d.constraintName))
      ),
      accuracy: detectedConstraints.length > 0 
        ? testDomain.expectedConstraints.filter(exp => 
            detectedConstraints.some(d => d.constraintName.includes(exp) || exp.includes(d.constraintName))
          ).length / testDomain.expectedConstraints.length
        : 0,
    },
    transformations: {
      generated: qualifiedVectors,
      constraintDriven: qualifiedVectors.filter(v => v.explorationMode === "constraint").length,
      adjacencyDriven: qualifiedVectors.filter(v => v.explorationMode === "adjacency").length,
    },
    zones,
  };
  
  // Constraint diagnosis
  const detectedNames = detectedConstraints.map(d => d.constraintName);
  const correctIdentifications = testDomain.expectedConstraints.filter(exp =>
    detectedNames.some(name => name.includes(exp) || exp.includes(name))
  );
  const falsePositives = detectedNames.filter(name =>
    !testDomain.expectedConstraints.some(exp => name.includes(exp) || exp.includes(name))
  );
  const missedConstraints = testDomain.expectedConstraints.filter(exp =>
    !detectedNames.some(name => name.includes(exp) || exp.includes(name))
  );
  
  const diagnosisNotes: string[] = [];
  if (missedConstraints.length > 0) {
    diagnosisNotes.push(`WEAKNESS: Missed ${missedConstraints.length} expected constraints. Cause: evidence keywords don't match rule patterns for ${missedConstraints.join(", ")}`);
  }
  if (falsePositives.length > 0) {
    diagnosisNotes.push(`ISSUE: ${falsePositives.length} false positives detected. Cause: overly broad keyword matching or missing facet specificity`);
  }
  if (detectedConstraints.filter(c => c.confidence === "limited").length > detectedConstraints.length * 0.5) {
    diagnosisNotes.push(`ISSUE: >50% of detected constraints have limited confidence. Cause: insufficient evidence depth or weak facet coverage`);
  }
  
  // Transformation review
  const transformationReview = qualifiedVectors.map(v => 
    gradeTransformation(v, testDomain.expectedTransformations, testDomain.name)
  );
  
  // Opportunity quality
  const gradeA = transformationReview.filter(t => t.grade === "A").length;
  const gradeB = transformationReview.filter(t => t.grade === "B").length;
  
  return {
    domain: testDomain.name,
    trace,
    constraintDiagnosis: {
      correctIdentifications,
      falsePositives,
      missedConstraints,
      diagnosisNotes,
    },
    transformationReview,
    analogValidation: {
      note: "CRITICAL GAP: No analog dataset integrated. Current implementation cannot validate transformations against precedent.",
      issue: "Analog matching exists in conceptEvaluation module but is not wired into the constraint/opportunity pipeline.",
    },
    structuralImportReview: {
      note: "NOT IMPLEMENTED: Structural imports (cross-industry pattern transfer) not yet built. Current transformations are single-dimension shifts only.",
    },
    opportunityQuality: {
      coherent: gradeA + gradeB,
      actionable: gradeA + gradeB,
      evidenceSupported: qualifiedVectors.filter(v => v.evidenceIds.length >= 2).length,
      llmDifferentiation: {
        novel: transformationReview.filter(t => t.llmReproducibility === "clearly_novel").length,
        possible: transformationReview.filter(t => t.llmReproducibility === "possibly_reproducible").length,
        generic: transformationReview.filter(t => t.llmReproducibility === "very_likely_generic").length,
      },
    },
  };
}

export function runFullDiagnostic(): DiagnosticReport {
  const testDomains = buildTestDomains();
  const domainResults = testDomains.map(runDomainDiagnostic);
  
  const allMissedConstraints = domainResults.flatMap(d => d.constraintDiagnosis.missedConstraints);
  const weakTransformations = domainResults.flatMap(d => 
    d.transformationReview.filter(t => t.grade === "C" || t.grade === "D")
  );
  
  const systemicAnalysis: SystemicAnalysis = {
    recurringWeakTransformations: [
      weakTransformations.length > 5 
        ? `${weakTransformations.length} weak/generic transformations across domains — transformation generation lacks domain-specific heuristics`
        : "Transformation quality acceptable",
    ],
    recurringMissedConstraints: [
      ...new Set(allMissedConstraints).values()
    ].length > 3 
      ? [`Recurring misses: ${[...new Set(allMissedConstraints)].join(", ")} — detection rules need expansion`]
      : ["Constraint detection coverage acceptable"],
    recurringAnalogIssues: [
      "CRITICAL: Analog validation not integrated — all transformations lack precedent backing",
      "Analog dataset exists but is not queried during constraint refinement or opportunity scoring",
    ],
    recurringReasoningGaps: [
      "No two-pass analog matching (scan → validate)",
      "No structural imports (cross-industry pattern transfer)",
      "No failure pattern surfacing",
      "No constraint stack ranking (primary/secondary/tertiary)",
      "No status quo explanation (why current structure persists)",
    ],
  };
  
  const recommendedFixes: string[] = [
    "1. PRIORITY: Wire analog dataset into constraint refinement stage — surface typical constraints from similar businesses",
    "2. PRIORITY: Add analog validation pass after transformation generation — check precedent for each proposed shift",
    "3. Expand constraint detection rules with industry-specific patterns (dental: insurance cycles, logistics: deadhead, etc.)",
    "4. Implement structural imports — identify cross-industry patterns that could transfer",
    "5. Add failure pattern surfacing — flag transformations that historically failed in similar contexts",
    "6. Build constraint stack ranking — distinguish primary binding constraint from secondary",
    "7. Add status quo explanation — articulate why current structure persists despite inefficiency",
    "8. Increase transformation specificity — current rationales too generic for differentiation",
  ];
  
  return {
    timestamp: new Date().toISOString(),
    domainResults,
    systemicAnalysis,
    recommendedFixes,
  };
}

// ═══════════════════════════════════════════════════════════════
//  CONSOLE OUTPUT FORMATTER
// ═══════════════════════════════════════════════════════════════

export function printDiagnosticReport(report: DiagnosticReport): void {
  console.log("\n" + "═".repeat(80));
  console.log("  STRATEGIC REASONING PIPELINE — DIAGNOSTIC REPORT");
  console.log("  " + report.timestamp);
  console.log("═".repeat(80) + "\n");
  
  for (const domain of report.domainResults) {
    console.log("\n" + "─".repeat(80));
    console.log(`  📊 ${domain.domain.toUpperCase()}`);
    console.log("─".repeat(80));
    
    console.log("\n  PIPELINE TRACE:");
    console.log(`    Structural Model: ${domain.trace.structuralModel.dimensionCount} dimensions (${domain.trace.structuralModel.hotCount} hot, ${domain.trace.structuralModel.warmCount} warm)`);
    console.log(`    Constraints Detected: ${domain.trace.constraintDetection.detected.length}`);
    console.log(`    Constraint Accuracy: ${(domain.trace.constraintDetection.accuracy * 100).toFixed(0)}%`);
    console.log(`    Transformations Generated: ${domain.trace.transformations.generated.length} (${domain.trace.transformations.constraintDriven} constraint-driven, ${domain.trace.transformations.adjacencyDriven} adjacency)`);
    console.log(`    Zones Created: ${domain.trace.zones.length}`);
    
    console.log("\n  CONSTRAINT DIAGNOSIS:");
    console.log(`    ✓ Correct: ${domain.constraintDiagnosis.correctIdentifications.join(", ") || "none"}`);
    console.log(`    ✗ Missed: ${domain.constraintDiagnosis.missedConstraints.join(", ") || "none"}`);
    console.log(`    ⚠ False Positives: ${domain.constraintDiagnosis.falsePositives.join(", ") || "none"}`);
    for (const note of domain.constraintDiagnosis.diagnosisNotes) {
      console.log(`    → ${note}`);
    }
    
    console.log("\n  TRANSFORMATION QUALITY:");
    const grades = { A: 0, B: 0, C: 0, D: 0 };
    for (const t of domain.transformationReview) {
      grades[t.grade]++;
    }
    console.log(`    Grade A (High-quality): ${grades.A}`);
    console.log(`    Grade B (Reasonable): ${grades.B}`);
    console.log(`    Grade C (Weak/Generic): ${grades.C}`);
    console.log(`    Grade D (Illogical): ${grades.D}`);
    
    console.log("\n  LLM DIFFERENTIATION:");
    console.log(`    Clearly Novel: ${domain.opportunityQuality.llmDifferentiation.novel}`);
    console.log(`    Possibly Reproducible: ${domain.opportunityQuality.llmDifferentiation.possible}`);
    console.log(`    Very Likely Generic: ${domain.opportunityQuality.llmDifferentiation.generic}`);
    
    console.log("\n  GAPS:");
    console.log(`    ${domain.analogValidation.note}`);
    console.log(`    ${domain.structuralImportReview.note}`);
  }
  
  console.log("\n" + "═".repeat(80));
  console.log("  SYSTEMIC WEAKNESS ANALYSIS");
  console.log("═".repeat(80));
  for (const weakness of report.systemicAnalysis.recurringWeakTransformations) {
    console.log(`  • ${weakness}`);
  }
  for (const missed of report.systemicAnalysis.recurringMissedConstraints) {
    console.log(`  • ${missed}`);
  }
  for (const issue of report.systemicAnalysis.recurringAnalogIssues) {
    console.log(`  • ${issue}`);
  }
  for (const gap of report.systemicAnalysis.recurringReasoningGaps) {
    console.log(`  • ${gap}`);
  }
  
  console.log("\n" + "═".repeat(80));
  console.log("  RECOMMENDED FIXES");
  console.log("═".repeat(80));
  for (const fix of report.recommendedFixes) {
    console.log(`  ${fix}`);
  }
  
  console.log("\n" + "═".repeat(80) + "\n");
}
