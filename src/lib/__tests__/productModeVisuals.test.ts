/**
 * Product Mode Visuals — unit tests
 *
 * Covers:
 *   • inferCompetitiveArena()  — identifies correct commoditized segments
 *   • inferUncontestedSpace()  — identifies durability/repairability as uncontested
 *   • buildSankeyData()        — complaint hierarchy math
 *   • fromEvidence()           — keyword matching fallback
 *   • TAM estimation           — should be > $5B for durability segment
 */

import { describe, it, expect } from "vitest";
import { inferCompetitiveArena, inferUncontestedSpace } from "@/lib/competitiveInversion";
import {
  buildSankeyData,
  fromEvidence,
} from "@/components/strategic-visuals/hooks/useComplaintSankeyData";
import type { Evidence } from "@/lib/evidenceEngine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEvidence(label: string, description = ""): Evidence {
  return {
    id: `ev-${Math.random().toString(36).slice(2, 8)}`,
    type: "signal",
    label,
    description,
    pipelineStep: "report",
    tier: "structural",
  };
}

const WHCH720N_EVIDENCE: Evidence[] = [
  makeEvidence(
    "Poor long-term durability (earcup flaking, headband snapping)",
    "Users report earcup flaking within 6-12 months of purchase",
  ),
  makeEvidence(
    "Non-repairable design / difficulty replacing parts",
    "Non-repairable components frustrate users seeking cheap fixes",
  ),
  makeEvidence(
    "Subpar microphone quality for calls",
    "Microphone call quality rated below average by many reviewers",
  ),
  makeEvidence(
    "Modular design for easy earcup/headband replacement",
    "Community requests modular spare parts to extend product lifespan",
  ),
  makeEvidence(
    "Great battery life praised",
    "Reviewers note 35h battery as strong positive",
  ),
  makeEvidence(
    "Sound quality compared to competitors",
    "Audio performance within expected range for the price segment",
  ),
];

// ── inferCompetitiveArena ─────────────────────────────────────────────────────

describe("inferCompetitiveArena", () => {
  it("returns at least 3 commoditized segments", () => {
    const arena = inferCompetitiveArena([]);
    expect(arena.length).toBeGreaterThanOrEqual(3);
  });

  it("includes audio specs as a commoditized segment", () => {
    const arena = inferCompetitiveArena([]);
    const ids = arena.map(a => a.id);
    expect(ids).toContain("audio_specs");
  });

  it("includes battery life as a commoditized segment", () => {
    const arena = inferCompetitiveArena([]);
    const ids = arena.map(a => a.id);
    expect(ids).toContain("battery_life");
  });

  it("includes comfort as a commoditized segment", () => {
    const arena = inferCompetitiveArena([]);
    const ids = arena.map(a => a.id);
    expect(ids).toContain("comfort");
  });

  it("includes price as a commoditized segment", () => {
    const arena = inferCompetitiveArena([]);
    const ids = arena.map(a => a.id);
    expect(ids).toContain("price");
  });

  it("enriches audio_specs tooltip when audio evidence is present", () => {
    const ev = [makeEvidence("sound quality analysis", "audio codec comparison")];
    const arena = inferCompetitiveArena(ev);
    const audioItem = arena.find(a => a.id === "audio_specs")!;
    expect(audioItem.tooltip).toMatch(/evidence signal/i);
  });

  it("each item has a non-empty label, description, and tooltip", () => {
    const arena = inferCompetitiveArena(WHCH720N_EVIDENCE);
    for (const item of arena) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.tooltip.length).toBeGreaterThan(0);
    }
  });
});

// ── inferUncontestedSpace ─────────────────────────────────────────────────────

describe("inferUncontestedSpace", () => {
  it("returns at least 3 uncontested opportunities", () => {
    const spaces = inferUncontestedSpace([]);
    expect(spaces.length).toBeGreaterThanOrEqual(3);
  });

  it("identifies durability as uncontested", () => {
    const spaces = inferUncontestedSpace(WHCH720N_EVIDENCE);
    const ids = spaces.map(s => s.id);
    expect(ids).toContain("durability");
  });

  it("identifies repairability as uncontested", () => {
    const spaces = inferUncontestedSpace(WHCH720N_EVIDENCE);
    const ids = spaces.map(s => s.id);
    expect(ids).toContain("repairability");
  });

  it("identifies sustainability as uncontested", () => {
    const spaces = inferUncontestedSpace([]);
    const ids = spaces.map(s => s.id);
    expect(ids).toContain("sustainability");
  });

  it("identifies community as uncontested", () => {
    const spaces = inferUncontestedSpace([]);
    const ids = spaces.map(s => s.id);
    expect(ids).toContain("community");
  });

  it("enriches durability tooltip with evidence count when durability signals present", () => {
    const spaces = inferUncontestedSpace(WHCH720N_EVIDENCE);
    const d = spaces.find(s => s.id === "durability")!;
    expect(d.tooltip).toMatch(/corroborating signal/i);
  });

  it("each item has a non-empty label, description, opportunity, and tooltip", () => {
    const spaces = inferUncontestedSpace(WHCH720N_EVIDENCE);
    for (const item of spaces) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
      expect(item.opportunity.length).toBeGreaterThan(0);
      expect(item.tooltip.length).toBeGreaterThan(0);
    }
  });
});

// ── buildSankeyData ───────────────────────────────────────────────────────────

describe("buildSankeyData", () => {
  it("produces the correct number of nodes (9)", () => {
    const data = buildSankeyData({
      positive: 48, neutral: 12, negative: 40,
      durability: 27, repairability: 6, sound: 4, microphone: 2, other: 1,
    });
    expect(data.nodes.length).toBe(9);
  });

  it("you-fix percentage ≥ 60% for WHCH720N-like data", () => {
    const data = buildSankeyData({
      positive: 48, neutral: 12, negative: 40,
      durability: 27, repairability: 6, sound: 4, microphone: 2, other: 1,
    });
    expect(data.stats.youFixPct).toBeGreaterThanOrEqual(0.6);
  });

  it("TAM estimate > $5B for durability segment in WHCH720N data", () => {
    const data = buildSankeyData({
      positive: 48, neutral: 12, negative: 40,
      durability: 27, repairability: 6, sound: 4, microphone: 2, other: 1,
    });
    expect(data.stats.tamEstimate).toBeGreaterThan(5);
  });

  it("durability complaints ≥ 27% of total reviews", () => {
    const counts = {
      positive: 48, neutral: 12, negative: 40,
      durability: 27, repairability: 6, sound: 4, microphone: 2, other: 1,
    };
    const total = counts.positive + counts.neutral + counts.negative;
    expect(counts.durability / total).toBeGreaterThanOrEqual(0.27);
  });

  it("links from negative node sum to total negative count", () => {
    const counts = {
      positive: 48, neutral: 12, negative: 40,
      durability: 27, repairability: 6, sound: 4, microphone: 2, other: 1,
    };
    const data = buildSankeyData(counts);
    // Node index 3 is Negative; sum of links from it should equal negative count
    const negativeLinks = data.links.filter(l => l.source === 3);
    const sumNegative = negativeLinks.reduce((acc, l) => acc + l.value, 0);
    expect(sumNegative).toBe(counts.negative);
  });

  it("stats.youFix equals durability + repairability", () => {
    const counts = {
      positive: 30, neutral: 10, negative: 60,
      durability: 30, repairability: 10, sound: 10, microphone: 5, other: 5,
    };
    const data = buildSankeyData(counts);
    expect(data.stats.youFix).toBe(counts.durability + counts.repairability);
  });
});

// ── fromEvidence (fallback) ───────────────────────────────────────────────────

describe("fromEvidence (keyword fallback)", () => {
  it("returns baseline values when evidence array is empty", () => {
    const counts = fromEvidence([]);
    expect(counts.positive).toBeGreaterThan(0);
    expect(counts.negative).toBeGreaterThan(0);
    expect(counts.durability).toBeGreaterThan(0);
  });

  it("detects durability signal from WHCH720N evidence", () => {
    const counts = fromEvidence(WHCH720N_EVIDENCE);
    expect(counts.durability).toBeGreaterThan(0);
  });

  it("detects repairability signal from WHCH720N evidence", () => {
    const counts = fromEvidence(WHCH720N_EVIDENCE);
    expect(counts.repairability).toBeGreaterThan(0);
  });

  it("complaint counts for WHCH720N yield you-fix% ≥ 60%", () => {
    const counts = fromEvidence(WHCH720N_EVIDENCE);
    const data = buildSankeyData(counts);
    expect(data.stats.youFixPct).toBeGreaterThanOrEqual(0.6);
  });
});
