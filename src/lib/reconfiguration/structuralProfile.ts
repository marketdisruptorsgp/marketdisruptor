/**
 * STRUCTURAL PROFILE — Stage 2 Output
 *
 * A typed structural diagnosis of the business being analyzed.
 * Produced from evidence and constraints; consumed by pattern qualification.
 *
 * Each dimension is a qualitative assessment derived deterministically
 * from the evidence dataset — NOT a score or ranking.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL DIMENSIONS
// ═══════════════════════════════════════════════════════════════

export type FragmentationLevel = "consolidated" | "moderate" | "fragmented" | "atomized";
export type MarginStructure = "high_margin" | "moderate_margin" | "thin_margin" | "negative_margin";
export type SwitchingCostLevel = "high" | "moderate" | "low" | "none";
export type DistributionControl = "owned" | "shared" | "intermediated" | "no_control";
export type LaborIntensity = "automated" | "mixed" | "labor_heavy" | "artisan";
export type RevenueModel = "recurring" | "mixed" | "transactional" | "project_based";
export type CustomerConcentration = "diversified" | "moderate" | "concentrated" | "single_customer";
export type AssetUtilization = "high" | "moderate" | "underutilized" | "idle";
export type RegulatorySensitivity = "none" | "light" | "moderate" | "heavy";
export type ValueChainPosition = "infrastructure" | "platform" | "application" | "end_service";

// ── ETA-Specific Dimension Types ──
export type OwnerDependencyLevel = "autonomous" | "delegatable" | "owner_reliant" | "owner_critical";
export type AcquisitionComplexityLevel = "turnkey" | "manageable" | "complex" | "prohibitive";
export type ImprovementRunwayLevel = "optimized" | "incremental" | "significant" | "transformative";

export interface StructuralProfile {
  /** How fragmented is the supply side of this market? */
  supplyFragmentation: FragmentationLevel;
  /** Current margin structure */
  marginStructure: MarginStructure;
  /** How hard is it for customers to switch away? */
  switchingCosts: SwitchingCostLevel;
  /** Who controls distribution to end customers? */
  distributionControl: DistributionControl;
  /** How labor-dependent is value delivery? */
  laborIntensity: LaborIntensity;
  /** Revenue model type */
  revenueModel: RevenueModel;
  /** Customer concentration risk */
  customerConcentration: CustomerConcentration;
  /** How well are existing assets utilized? */
  assetUtilization: AssetUtilization;
  /** Regulatory sensitivity of the market */
  regulatorySensitivity: RegulatorySensitivity;
  /** Where in the value chain does the business sit? */
  valueChainPosition: ValueChainPosition;

  // ── ETA-Specific Dimensions (populated when ETA lens is active) ──
  /** How dependent is the business on a single owner/operator? */
  ownerDependency: OwnerDependencyLevel | null;
  /** How complex would an acquisition of this business be? */
  acquisitionComplexity: AcquisitionComplexityLevel | null;
  /** How much room for operational improvement exists post-acquisition? */
  improvementRunway: ImprovementRunwayLevel | null;
  /** Whether ETA lens shaped this profile */
  etaActive: boolean;

  /** Top 2-3 binding constraints from constraint detection */
  bindingConstraints: ConstraintCandidate[];
  /** Raw evidence count for diagnosis confidence */
  evidenceDepth: number;
  /** Categories of evidence that contributed */
  evidenceCategories: string[];
}

// ═══════════════════════════════════════════════════════════════
//  DIAGNOSIS — Build StructuralProfile from Evidence
// ═══════════════════════════════════════════════════════════════

/**
 * Build a StructuralProfile from the evidence dataset and detected constraints.
 * Pure deterministic inference — no AI calls.
 */
export function diagnoseStructuralProfile(
  evidence: Evidence[],
  constraints: ConstraintCandidate[],
): StructuralProfile {
  const corpus = evidence.map(e => `${e.label} ${e.description ?? ""}`).join(" ").toLowerCase();
  const categories = [...new Set(evidence.map(e => e.category).filter(Boolean))] as string[];
  const constraintNames = new Set(constraints.map(c => c.constraintName));

  return {
    supplyFragmentation: inferFragmentation(corpus, constraintNames),
    marginStructure: inferMarginStructure(corpus, constraintNames),
    switchingCosts: inferSwitchingCosts(corpus, constraintNames),
    distributionControl: inferDistributionControl(corpus, constraintNames),
    laborIntensity: inferLaborIntensity(corpus, constraintNames),
    revenueModel: inferRevenueModel(corpus, constraintNames),
    customerConcentration: inferCustomerConcentration(corpus, constraintNames),
    assetUtilization: inferAssetUtilization(corpus, constraintNames),
    regulatorySensitivity: inferRegulatorySensitivity(corpus, constraintNames),
    valueChainPosition: inferValueChainPosition(corpus),
    bindingConstraints: constraints.slice(0, 3),
    evidenceDepth: evidence.length,
    evidenceCategories: categories,
  };
}

// ═══════════════════════════════════════════════════════════════
//  INFERENCE HELPERS — Keyword + Constraint Signal
// ═══════════════════════════════════════════════════════════════

function hits(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

function inferFragmentation(corpus: string, constraints: Set<string>): FragmentationLevel {
  if (constraints.has("supply_fragmentation")) return "fragmented";
  const fragSignals = hits(corpus, /fragment|scatter|many\s*small|independ|cottage|dispersed|niche\s*player|local\s*shop/g);
  const consolSignals = hits(corpus, /consolidat|monopol|dominant|oligopol|market\s*leader|incumbent/g);
  if (fragSignals >= 3) return "atomized";
  if (fragSignals >= 1) return "fragmented";
  if (consolSignals >= 2) return "consolidated";
  return "moderate";
}

function inferMarginStructure(corpus: string, constraints: Set<string>): MarginStructure {
  if (constraints.has("margin_compression")) return "thin_margin";
  if (constraints.has("commoditized_pricing")) return "thin_margin";
  const thinSignals = hits(corpus, /thin\s*margin|low\s*margin|razor|commod|price\s*war|race\s*to\s*bottom/g);
  const highSignals = hits(corpus, /high\s*margin|premium|luxury|pricing\s*power|monopol/g);
  if (thinSignals >= 2) return "thin_margin";
  if (highSignals >= 2) return "high_margin";
  return "moderate_margin";
}

function inferSwitchingCosts(corpus: string, constraints: Set<string>): SwitchingCostLevel {
  if (constraints.has("switching_friction")) return "high";
  if (constraints.has("legacy_lock_in")) return "high";
  const highSignals = hits(corpus, /lock.?in|switching\s*cost|contract|stickiness|integrat|embed/g);
  const lowSignals = hits(corpus, /easy\s*to\s*switch|no\s*contract|plug.?and.?play|interchange/g);
  if (highSignals >= 2) return "high";
  if (lowSignals >= 1) return "low";
  return "moderate";
}

function inferDistributionControl(corpus: string, constraints: Set<string>): DistributionControl {
  if (constraints.has("channel_dependency")) return "intermediated";
  const ownedSignals = hits(corpus, /direct\s*sales|own\s*channel|dtc|direct.?to.?consumer|proprietary\s*channel/g);
  const intermedSignals = hits(corpus, /intermediar|broker|dealer|reseller|wholesal|distributor|agent|middl/g);
  if (intermedSignals >= 2) return "intermediated";
  if (ownedSignals >= 2) return "owned";
  return "shared";
}

function inferLaborIntensity(corpus: string, constraints: Set<string>): LaborIntensity {
  if (constraints.has("labor_intensity") || constraints.has("owner_dependency")) return "labor_heavy";
  if (constraints.has("manual_process") || constraints.has("skill_scarcity")) return "labor_heavy";
  const laborSignals = hits(corpus, /manual|hand.?craft|bespoke|custom|artisan|labor|hourly|consult|hands.?on/g);
  const autoSignals = hits(corpus, /automat|software|algorithm|self.?serv|digital|platform|scalable/g);
  if (laborSignals >= 3) return "artisan";
  if (laborSignals >= 1 && autoSignals >= 1) return "mixed";
  if (autoSignals >= 2) return "automated";
  return "mixed";
}

function inferRevenueModel(corpus: string, constraints: Set<string>): RevenueModel {
  if (constraints.has("transactional_revenue")) return "transactional";
  const recurSignals = hits(corpus, /subscript|recurring|mrr|arr|monthly|annual\s*fee|retention/g);
  const transSignals = hits(corpus, /one.?time|transact|project.?based|per.?unit|spot|episod|per.?job/g);
  if (recurSignals >= 2) return "recurring";
  if (transSignals >= 2) return "project_based";
  return "mixed";
}

function inferCustomerConcentration(corpus: string, constraints: Set<string>): CustomerConcentration {
  if (constraints.has("revenue_concentration")) return "concentrated";
  const concSignals = hits(corpus, /concentrat|single\s*client|key\s*account|whale|top\s*customer|few\s*clients/g);
  if (concSignals >= 2) return "concentrated";
  return "diversified";
}

function inferAssetUtilization(corpus: string, constraints: Set<string>): AssetUtilization {
  if (constraints.has("asset_underutilization")) return "underutilized";
  if (constraints.has("capacity_ceiling")) return "high";
  const underSignals = hits(corpus, /idle|underutil|excess\s*capacity|empty|unused|dead\s*asset/g);
  if (underSignals >= 1) return "underutilized";
  return "moderate";
}

function inferRegulatorySensitivity(corpus: string, constraints: Set<string>): RegulatorySensitivity {
  if (constraints.has("regulatory_barrier")) return "heavy";
  const regSignals = hits(corpus, /regulat|compliance|licens|permit|fda|hipaa|legal|certif/g);
  if (regSignals >= 3) return "heavy";
  if (regSignals >= 1) return "moderate";
  return "none";
}

function inferValueChainPosition(corpus: string): ValueChainPosition {
  const infraSignals = hits(corpus, /infrastructure|utility|commodity|raw\s*material|supply|backbone/g);
  const platformSignals = hits(corpus, /platform|marketplace|ecosystem|api|developer|integration/g);
  const appSignals = hits(corpus, /app|tool|software|product|widget|feature/g);
  const serviceSignals = hits(corpus, /service|consult|agency|deliver|custom\s*work|bespoke/g);

  const max = Math.max(infraSignals, platformSignals, appSignals, serviceSignals);
  if (max === 0) return "application";
  if (max === infraSignals) return "infrastructure";
  if (max === platformSignals) return "platform";
  if (max === serviceSignals) return "end_service";
  return "application";
}
