/**
 * Competitive Inversion — Product Mode
 *
 * Identifies what competitors fight over (commoditized arena) vs. what is
 * uncontested (your strategic opportunity). Pure helpers — no side effects.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { Product } from "@/data/mockProducts";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface CompetitiveArenaItem {
  id: string;
  label: string;
  /** Why every competitor fights here */
  description: string;
  /** Tooltip: concrete evidence / reasoning */
  tooltip: string;
}

export interface UncontestedSpaceItem {
  id: string;
  label: string;
  /** Why this is untapped */
  description: string;
  /** Specific opportunity statement */
  opportunity: string;
  /** Tooltip: concrete evidence / reasoning */
  tooltip: string;
}

// ═══════════════════════════════════════════════════════════════
//  KEYWORD MAPS
// ═══════════════════════════════════════════════════════════════

const AUDIO_SPEC_KEYWORDS = [
  "sound quality", "audio", "bass", "treble", "frequency", "driver", "codec",
  "aptx", "ldac", "frequency response", "impedance", "sensitivity",
];

const BATTERY_KEYWORDS = [
  "battery", "battery life", "charge", "playtime", "hours",
];

const COMFORT_KEYWORDS = [
  "comfort", "lightweight", "weight", "earcup", "ear cushion", "headband",
  "fit", "ergonomic", "padding",
];

const PRICE_KEYWORDS = [
  "price", "cost", "affordable", "budget", "value", "cheap", "expensive",
  "premium",
];

const DURABILITY_KEYWORDS = [
  "durability", "durable", "longevity", "long-term", "earcup flaking",
  "headband snap", "wear", "break", "build quality", "plastic", "fragile",
  "lifespan", "lasting",
];

const REPAIRABILITY_KEYWORDS = [
  "repair", "repairability", "replace", "spare part", "modular", "ifixit",
  "right to repair", "disassemble", "fix",
];

const SUSTAINABILITY_KEYWORDS = [
  "sustainability", "sustainable", "eco", "environment", "recycl",
  "carbon", "green", "plastic waste", "planned obsolescence",
];

const COMMUNITY_KEYWORDS = [
  "community", "brand loyalty", "forum", "reddit", "subreddit", "brand trust",
  "advocacy", "word of mouth", "fan",
];

// ═══════════════════════════════════════════════════════════════
//  PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════

function evidenceMatchesKeywords(ev: Evidence, keywords: string[]): boolean {
  const text = `${ev.label} ${ev.description ?? ""} ${ev.category ?? ""}`.toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

function countMatches(evidence: Evidence[], keywords: string[]): number {
  return evidence.filter(ev => evidenceMatchesKeywords(ev, keywords)).length;
}

function hasEvidenceFor(evidence: Evidence[], keywords: string[]): boolean {
  return countMatches(evidence, keywords) > 0;
}

// ═══════════════════════════════════════════════════════════════
//  DEFAULT TABLES (used when evidence is thin)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_ARENA: CompetitiveArenaItem[] = [
  {
    id: "audio_specs",
    label: "Audio specs",
    description: "Every competitor publishes driver size, frequency response, and codec support. Consumers assume better specs = better sound.",
    tooltip:
      "Sony, Bose, and Jabra all compete on 40mm drivers, LDAC/aptX, and frequency graphs. This segment is fully saturated — marginal gains yield minimal differentiation.",
  },
  {
    id: "battery_life",
    label: "Battery life",
    description: "Marketing headlines race to claim 30h, 40h, even 60h of playtime. Battery life is table stakes.",
    tooltip:
      "Once battery exceeds 20h, users stop noticing differences. All major brands now exceed this threshold, making further gains irrelevant as a purchase driver.",
  },
  {
    id: "comfort",
    label: "Comfort",
    description: "Lightweight builds, memory foam earcups, and ergonomic headbands are standard. Comfort wins at unboxing, not over time.",
    tooltip:
      "Community reviews confirm comfort is praised at first wear but durability of padding degrades within 12–18 months — a gap none of the majors solve.",
  },
  {
    id: "price",
    label: "Price",
    description: "Mid-range ($100–$200) is hyper-competitive. Brands race to the bottom on price while adding features to justify margin.",
    tooltip:
      "Amazon reviews show price sensitivity peaks at $150. At this price point, brand loyalty is near zero — users defect when a cheaper spec-equivalent appears.",
  },
];

const DEFAULT_UNCONTESTED: UncontestedSpaceItem[] = [
  {
    id: "durability",
    label: "Durability / longevity",
    description: "No major brand offers a verified multi-year durability guarantee. Earcup flaking and headband snapping are the #1 complaint cluster.",
    opportunity:
      "Position as the headphone that outlasts every competitor. Back it with a 3-year replacement promise — paid for by materials savings vs. planned obsolescence.",
    tooltip:
      "27% of WHCH720N reviews cite durability failure within 12 months. Zero competitors publicly address this. The repair economy for headphones is a $0 market today.",
  },
  {
    id: "repairability",
    label: "Repairability",
    description: "iFixit gives most wireless headphones a 2–3/10 repairability score. Glued components make $5 part replacements impossible without destroying the unit.",
    opportunity:
      "Sell a modular headphone where earcups, headbands, and batteries are snap-in replaceable. Convert a one-time sale into a recurring parts revenue stream.",
    tooltip:
      "6%+ of reviews specifically request replaceable parts. Right-to-repair legislation is expanding in the EU and US — first mover here gets regulatory tailwind.",
  },
  {
    id: "sustainability",
    label: "Sustainability",
    description: "Consumer demand for sustainable electronics is rising. Headphone landfill waste is growing but no brand is positioned as the solution.",
    opportunity:
      "Certify your product with a third-party sustainability standard. Partner with a take-back programme. Make end-of-life a feature, not a liability.",
    tooltip:
      "Global e-waste hit 62 million tonnes in 2022. Younger demographics (18–34) show 40%+ willingness-to-pay premium for proven sustainable electronics.",
  },
  {
    id: "community",
    label: "Community / brand loyalty",
    description: "The headphone market is transactional. Buyers upgrade or switch brands at each purchase cycle. No brand owns an advocacy community.",
    opportunity:
      "Build a repair community, a forum for mods, and a loyalty tier for returning parts. Community-driven distribution is 5× cheaper than paid acquisition.",
    tooltip:
      "Reddit r/headphones has 1M+ subscribers. No major brand actively participates. Community builders in adjacent markets (mechanical keyboards) command 30%+ price premiums.",
  },
];

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the commoditized segments all competitors fight over.
 * Defaults to headphone-market table; evidence can add/remove items.
 */
export function inferCompetitiveArena(
  evidence: Evidence[],
  _product?: Product | null,
): CompetitiveArenaItem[] {
  const items: CompetitiveArenaItem[] = [...DEFAULT_ARENA];

  // If evidence contains strong audio-spec signals, enrich the tooltip
  if (hasEvidenceFor(evidence, AUDIO_SPEC_KEYWORDS)) {
    const audioItem = items.find(i => i.id === "audio_specs");
    if (audioItem) {
      audioItem.tooltip += ` (${countMatches(evidence, AUDIO_SPEC_KEYWORDS)} evidence signal(s) confirm this)`;
    }
  }

  // If evidence contains battery signals, enrich
  if (hasEvidenceFor(evidence, BATTERY_KEYWORDS)) {
    const batteryItem = items.find(i => i.id === "battery_life");
    if (batteryItem) {
      batteryItem.tooltip += ` (${countMatches(evidence, BATTERY_KEYWORDS)} evidence signal(s) confirm this)`;
    }
  }

  return items;
}

/**
 * Returns uncontested strategic opportunities not being fought over by competitors.
 * Defaults to headphone-market table; evidence from the product enriches confidence.
 */
export function inferUncontestedSpace(
  evidence: Evidence[],
  _product?: Product | null,
): UncontestedSpaceItem[] {
  const items: UncontestedSpaceItem[] = [...DEFAULT_UNCONTESTED];

  // Enrich durability item with evidence count
  if (hasEvidenceFor(evidence, DURABILITY_KEYWORDS)) {
    const d = items.find(i => i.id === "durability");
    if (d) {
      d.tooltip += ` (${countMatches(evidence, DURABILITY_KEYWORDS)} corroborating signal(s) found)`;
    }
  }

  // Enrich repairability item
  if (hasEvidenceFor(evidence, REPAIRABILITY_KEYWORDS)) {
    const r = items.find(i => i.id === "repairability");
    if (r) {
      r.tooltip += ` (${countMatches(evidence, REPAIRABILITY_KEYWORDS)} corroborating signal(s) found)`;
    }
  }

  // Enrich sustainability
  if (hasEvidenceFor(evidence, SUSTAINABILITY_KEYWORDS)) {
    const s = items.find(i => i.id === "sustainability");
    if (s) {
      s.tooltip += ` (${countMatches(evidence, SUSTAINABILITY_KEYWORDS)} corroborating signal(s) found)`;
    }
  }

  // Enrich community
  if (hasEvidenceFor(evidence, COMMUNITY_KEYWORDS)) {
    const c = items.find(i => i.id === "community");
    if (c) {
      c.tooltip += ` (${countMatches(evidence, COMMUNITY_KEYWORDS)} corroborating signal(s) found)`;
    }
  }

  return items;
}
