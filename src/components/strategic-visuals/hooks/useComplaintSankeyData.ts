/**
 * useComplaintSankeyData — transforms evidence into Sankey-ready data
 *
 * Categorizes complaints by keyword matching against evidence signals and
 * product reviews, then calculates you-fix percentages and a TAM estimate.
 */

import { useMemo } from "react";
import type { Evidence } from "@/lib/evidenceEngine";
import type { Product } from "@/data/mockProducts";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type FixCategory = "fix" | "partial" | "nofix";

export interface SankeyNode {
  name: string;
  color?: string;
  fixCategory?: FixCategory;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface ComplaintStats {
  /** Total review count (normalized to 100) */
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  /** Complaints you directly solve */
  youFix: number;
  youFixPct: number;
  /** Complaints you partially address */
  partial: number;
  partialPct: number;
  /** Complaints outside your product scope */
  noFix: number;
  noFixPct: number;
  /** TAM in USD billions: $71B × negativeSentimentPct × youFixPct */
  tamEstimate: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  stats: ComplaintStats;
}

// ═══════════════════════════════════════════════════════════════
//  KEYWORD MAPS
// ═══════════════════════════════════════════════════════════════

const DURABILITY_KW = [
  "durability", "durable", "long-term", "longevity", "earcup flaking",
  "headband snap", "headband snapped", "wear", "break", "build quality",
  "fragile", "lifespan", "lasting", "flaking", "snapped",
];

const REPAIRABILITY_KW = [
  "repair", "repairability", "replaceable", "spare part", "modular",
  "right to repair", "disassemble", "can't fix", "cannot fix",
  "non-repairable", "non repairable",
];

const SOUND_KW = [
  "sound", "audio", "bass", "treble", "tinny", "flat sound",
  "sound quality", "audio quality", "equaliz", "eq ", "frequency",
];

const MIC_KW = [
  "microphone", " mic ", "mic quality", "call quality",
  "voice quality", "voice call", "noise cancell", "call",
];

// ═══════════════════════════════════════════════════════════════
//  PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════

function textMatchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

function countEvidenceMatches(evidence: Evidence[], keywords: string[]): number {
  return evidence.filter(ev =>
    textMatchesKeywords(`${ev.label} ${ev.description ?? ""} ${ev.category ?? ""}`, keywords)
  ).length;
}

interface ComplaintCounts {
  durability: number;
  repairability: number;
  sound: number;
  microphone: number;
  other: number;
  negative: number;
  positive: number;
  neutral: number;
}

/**
 * Derives complaint counts from product reviews when available.
 */
function fromProductReviews(reviews: Product["reviews"]): ComplaintCounts {
  let positive = 0, neutral = 0, negative = 0;
  let durability = 0, repairability = 0, sound = 0, microphone = 0;

  for (const review of reviews) {
    if (review.sentiment === "positive") positive++;
    else if (review.sentiment === "neutral") neutral++;
    else negative++;

    const text = review.text.toLowerCase();
    if (textMatchesKeywords(text, DURABILITY_KW)) durability++;
    else if (textMatchesKeywords(text, REPAIRABILITY_KW)) repairability++;
    else if (textMatchesKeywords(text, SOUND_KW)) sound++;
    else if (textMatchesKeywords(text, MIC_KW)) microphone++;
  }

  const other = Math.max(0, negative - durability - repairability - sound - microphone);

  return { positive, neutral, negative, durability, repairability, sound, microphone, other };
}

/**
 * Estimates complaint counts from evidence signals (fallback).
 *
 * Uses keyword density across evidence items to set proportions, then maps
 * onto a normalized 100-review baseline calibrated to WHCH720N data.
 */
function fromEvidence(evidence: Evidence[]): ComplaintCounts {
  const dCount = countEvidenceMatches(evidence, DURABILITY_KW);
  const rCount = countEvidenceMatches(evidence, REPAIRABILITY_KW);
  const sCount = countEvidenceMatches(evidence, SOUND_KW);
  const mCount = countEvidenceMatches(evidence, MIC_KW);

  // WHCH720N baseline (normalized to 100 reviews):
  //   positive: 48, neutral: 12, negative: 40
  //   durability: 27, repairability: 6, sound: 4, mic: 2, other: 1
  const BASE_POSITIVE = 48;
  const BASE_NEUTRAL = 12;
  const BASE_NEGATIVE = 40;

  const hasAnySignal = dCount + rCount + sCount + mCount > 0;

  if (!hasAnySignal) {
    // No evidence — use baseline
    return {
      positive: BASE_POSITIVE,
      neutral: BASE_NEUTRAL,
      negative: BASE_NEGATIVE,
      durability: 27,
      repairability: 6,
      sound: 4,
      microphone: 2,
      other: 1,
    };
  }

  // Weight each complaint type by evidence density, normalize to negative baseline
  const total = dCount + rCount + sCount + mCount;
  const durability = Math.round((dCount / total) * BASE_NEGATIVE);
  const repairability = Math.round((rCount / total) * BASE_NEGATIVE);
  const sound = Math.round((sCount / total) * BASE_NEGATIVE);
  const microphone = Math.round((mCount / total) * BASE_NEGATIVE);
  const other = Math.max(0, BASE_NEGATIVE - durability - repairability - sound - microphone);

  return {
    positive: BASE_POSITIVE,
    neutral: BASE_NEUTRAL,
    negative: BASE_NEGATIVE,
    durability,
    repairability,
    sound,
    microphone,
    other,
  };
}

// ═══════════════════════════════════════════════════════════════
//  BUILD SANKEY DATA
// ═══════════════════════════════════════════════════════════════

const GLOBAL_HEADPHONES_MARKET_BILLIONS = 71;

function buildSankeyData(counts: ComplaintCounts): SankeyData {
  const total = counts.positive + counts.neutral + counts.negative;

  const youFix = counts.durability + counts.repairability;
  const partial = counts.sound;
  const noFix = counts.microphone + counts.other;
  const youFixPct = counts.negative > 0 ? youFix / counts.negative : 0;
  const partialPct = counts.negative > 0 ? partial / counts.negative : 0;
  const noFixPct = counts.negative > 0 ? noFix / counts.negative : 0;
  const negativeSentimentPct = total > 0 ? counts.negative / total : 0;

  const tamEstimate =
    GLOBAL_HEADPHONES_MARKET_BILLIONS * negativeSentimentPct * youFixPct;

  const stats: ComplaintStats = {
    total,
    positive: counts.positive,
    neutral: counts.neutral,
    negative: counts.negative,
    youFix,
    youFixPct,
    partial,
    partialPct,
    noFix,
    noFixPct,
    tamEstimate,
  };

  // ── Nodes ──
  // 0: All Reviews
  // 1: Positive
  // 2: Neutral
  // 3: Negative
  // 4: Durability Issues  (fix — green)
  // 5: Repairability Issues (fix — green)
  // 6: Sound / Audio Issues (partial — yellow)
  // 7: Microphone Issues   (nofix — red)
  // 8: Other Issues        (nofix — red)
  const nodes: SankeyNode[] = [
    { name: "All Reviews" },
    { name: "Positive", color: "#10b981" },
    { name: "Neutral", color: "#6b7280" },
    { name: "Negative", color: "#ef4444" },
    { name: "Durability Issues", color: "#10b981", fixCategory: "fix" },
    { name: "Repairability Issues", color: "#10b981", fixCategory: "fix" },
    { name: "Sound / Audio Issues", color: "#eab308", fixCategory: "partial" },
    { name: "Microphone Issues", color: "#ef4444", fixCategory: "nofix" },
    { name: "Other Issues", color: "#ef4444", fixCategory: "nofix" },
  ];

  const links: SankeyLink[] = [
    { source: 0, target: 1, value: counts.positive },
    { source: 0, target: 2, value: counts.neutral },
    { source: 0, target: 3, value: counts.negative },
    { source: 3, target: 4, value: counts.durability },
    { source: 3, target: 5, value: counts.repairability },
    { source: 3, target: 6, value: counts.sound },
    { source: 3, target: 7, value: counts.microphone },
    { source: 3, target: 8, value: counts.other },
  ].filter(l => l.value > 0);

  return { nodes, links, stats };
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC HOOK
// ═══════════════════════════════════════════════════════════════

export function useComplaintSankeyData(
  evidence: Evidence[],
  product?: Product | null,
): SankeyData {
  return useMemo(() => {
    const counts =
      product?.reviews && product.reviews.length > 0
        ? fromProductReviews(product.reviews)
        : fromEvidence(evidence);

    return buildSankeyData(counts);
  }, [evidence, product]);
}

// Exported for unit testing
export { buildSankeyData, fromEvidence, fromProductReviews };
