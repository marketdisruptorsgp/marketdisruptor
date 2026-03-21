import { describe, it, expect } from "vitest";
import { PRODUCT_DIRECTIONS, selectRelevantDirections } from "./strategicDirections";
import type { StructuralProfile } from "./structuralProfile";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeConstraint(name: string, explanation: string): ConstraintCandidate {
  return {
    constraintId: `C-TEST-${name.replace(/\W/g, "_")}`,
    constraintName: name,
    explanation,
    tier: 1,
    evidenceIds: ["ev-001"],
    facetBasis: [],
    confidence: "strong",
  };
}

function makeProfile(overrides: Partial<StructuralProfile> = {}): StructuralProfile {
  return {
    supplyFragmentation: "moderate",
    marginStructure: "thin_margin",
    switchingCosts: "low",
    distributionControl: "intermediated",
    laborIntensity: "mixed",
    revenueModel: "transactional",
    customerConcentration: "diversified",
    assetUtilization: "moderate",
    regulatorySensitivity: "low",
    valueChainPosition: "application",
    ownerDependency: null,
    acquisitionComplexity: null,
    improvementRunway: null,
    etaActive: false,
    bindingConstraints: [],
    evidenceDepth: 5,
    evidenceCategories: ["user_complaint"],
    ...overrides,
  };
}

// ── PRODUCT_DIRECTIONS context-sensitivity tests ──────────────────────────────

describe("PRODUCT_DIRECTIONS — context-sensitive relevance scores", () => {
  it("eliminate_failure scores higher when binding constraints mention durability/failure", () => {
    const profileWithDurability = makeProfile({
      bindingConstraints: [
        makeConstraint("Frame brittleness", "ABS plastic frame snaps under load — the #1 user complaint"),
      ],
    });
    const profileWithoutDurability = makeProfile({ bindingConstraints: [] });

    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "eliminate_failure")!;
    expect(dir.relevance(profileWithDurability)).toBeGreaterThan(dir.relevance(profileWithoutDurability));
    expect(dir.relevance(profileWithDurability)).toBeGreaterThanOrEqual(8);
  });

  it("material_substitution scores higher when binding constraints mention materials", () => {
    const profileWithMaterial = makeProfile({
      bindingConstraints: [
        makeConstraint("ABS plastic degradation", "cheap ABS polymer brittle and cracks under stress"),
      ],
    });
    const profileWithoutMaterial = makeProfile({ bindingConstraints: [] });

    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "material_substitution")!;
    expect(dir.relevance(profileWithMaterial)).toBeGreaterThan(dir.relevance(profileWithoutMaterial));
    expect(dir.relevance(profileWithMaterial)).toBeGreaterThanOrEqual(8);
  });

  it("tool_free_install has low baseline score for products without installation constraints", () => {
    // A clothes hanger doesn't need installation — this direction should not dominate
    const profileNoInstall = makeProfile({
      bindingConstraints: [
        makeConstraint("Frame brittleness", "plastic breaks under load"),
      ],
    });
    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "tool_free_install")!;
    expect(dir.relevance(profileNoInstall)).toBeLessThanOrEqual(4);
  });

  it("tool_free_install scores much higher when binding constraints mention installation", () => {
    const profileWithInstall = makeProfile({
      bindingConstraints: [
        makeConstraint("Installation complexity", "tool required to mount the device — confuses consumers"),
      ],
    });
    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "tool_free_install")!;
    expect(dir.relevance(profileWithInstall)).toBeGreaterThanOrEqual(8);
  });

  it("smart_sensing has low baseline for thin-margin products without sensing constraints", () => {
    // Electronics add BOM cost — not appropriate for $0.50 commodity products
    const profileThinNoSensing = makeProfile({
      marginStructure: "thin_margin",
      bindingConstraints: [
        makeConstraint("Material brittleness", "plastic breaks under normal load"),
      ],
    });
    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "smart_sensing")!;
    expect(dir.relevance(profileThinNoSensing)).toBeLessThanOrEqual(3);
  });

  it("smart_sensing scores higher for high-margin products with monitoring constraints", () => {
    const profileHighMarginSensing = makeProfile({
      marginStructure: "high_margin",
      bindingConstraints: [
        makeConstraint("Hidden failure detection", "system fails silently without warning — diagnostics needed"),
      ],
    });
    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "smart_sensing")!;
    expect(dir.relevance(profileHighMarginSensing)).toBeGreaterThanOrEqual(7);
  });

  it("universal_fit has low baseline for products without compatibility constraints", () => {
    const profileNoCompat = makeProfile({
      bindingConstraints: [
        makeConstraint("Material cost", "raw material cost is high"),
      ],
    });
    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "universal_fit")!;
    expect(dir.relevance(profileNoCompat)).toBeLessThanOrEqual(4);
  });

  it("universal_fit scores high when compatibility fragmentation is the binding constraint", () => {
    const profileCompat = makeProfile({
      supplyFragmentation: "atomized",
      bindingConstraints: [
        makeConstraint("Size variant proliferation", "incompatible adapter sizes across brands cause confusion"),
      ],
    });
    const dir = PRODUCT_DIRECTIONS.find(d => d.id === "universal_fit")!;
    expect(dir.relevance(profileCompat)).toBeGreaterThanOrEqual(8);
  });

  it("all directions return scores in 0-10 range for any profile", () => {
    const extremeProfile = makeProfile({
      marginStructure: "negative_margin",
      supplyFragmentation: "atomized",
      switchingCosts: "high",
      bindingConstraints: [
        makeConstraint("Everything broken", "fails in every conceivable way"),
      ],
    });
    for (const dir of PRODUCT_DIRECTIONS) {
      const score = dir.relevance(extremeProfile);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    }
  });
});

// ── selectRelevantDirections — product mode context-sensitivity ────────────────

describe("selectRelevantDirections — product mode selects context-specific directions", () => {
  it("selects eliminate_failure and material_substitution as top directions for a durability/material product", () => {
    const hangerProfile = makeProfile({
      marginStructure: "thin_margin",
      bindingConstraints: [
        makeConstraint("ABS frame brittleness", "plastic ABS body cracks and snaps under normal garment weight"),
        makeConstraint("Material degradation", "cheap plastic material degrades quickly — disposable by design"),
      ],
    });

    const directions = selectRelevantDirections(hangerProfile, 5, "product");
    const ids = directions.map(d => d.direction.id);

    expect(ids).toContain("eliminate_failure");
    expect(ids).toContain("material_substitution");
    // Both durability directions should rank above tool_free_install (which has no matching constraint)
    const failureRank = ids.indexOf("eliminate_failure");
    const materialRank = ids.indexOf("material_substitution");
    const installRank = ids.indexOf("tool_free_install");
    // installRank is -1 (not present) or lower priority than failure/material
    if (installRank !== -1) {
      expect(failureRank).toBeLessThan(installRank);
      expect(materialRank).toBeLessThan(installRank);
    }
  });

  it("selects tool_free_install as a top direction when installation is the binding constraint", () => {
    const installProfile = makeProfile({
      switchingCosts: "high",
      bindingConstraints: [
        makeConstraint("Installation complexity", "requires professional installation with specialized tools"),
        makeConstraint("Setup friction", "tool required to mount — multiple user errors during setup"),
      ],
    });

    const directions = selectRelevantDirections(installProfile, 5, "product");
    const ids = directions.map(d => d.direction.id);
    expect(ids).toContain("tool_free_install");
    // Should be highly ranked (top 3)
    const idx = directions.findIndex(d => d.direction.id === "tool_free_install");
    expect(idx).toBeLessThan(3);
  });

  it("different products produce different direction rankings (no static ordering)", () => {
    const durabilityProduct = makeProfile({
      marginStructure: "thin_margin",
      bindingConstraints: [
        makeConstraint("Material failure", "ABS plastic snaps under load — frequent breakage"),
      ],
    });

    const installProduct = makeProfile({
      switchingCosts: "high",
      bindingConstraints: [
        makeConstraint("Installation error", "tool-dependent mounting process confuses consumers"),
      ],
    });

    const durabilityDirs = selectRelevantDirections(durabilityProduct, 3, "product");
    const installDirs = selectRelevantDirections(installProduct, 3, "product");

    // The #1 direction should differ between these two products
    const durabilityTop = durabilityDirs[0].direction.id;
    const installTop = installDirs[0].direction.id;
    expect(durabilityTop).not.toBe(installTop);
  });

  it("returns at most the requested count of directions", () => {
    const profile = makeProfile();
    const directions = selectRelevantDirections(profile, 3, "product");
    expect(directions.length).toBeLessThanOrEqual(3);
  });
});
