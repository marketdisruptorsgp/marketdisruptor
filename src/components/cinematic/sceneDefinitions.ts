/* ═══════════════════════════════════════════════════════════════
   SCENE DEFINITIONS — 6 scenes on light/white background
   UI-style cards, structural diagrams, constraint blocks.
   Timed to the exact voiceover script.
   ═══════════════════════════════════════════════════════════════ */

import type { SceneFrame, UIBlock, FlowLine, TextElement, FloatingDot } from "./canvasEngine";
import { lerp, easeInOutCubic, easeOutExpo, easeOutQuart, easeInOutQuint } from "./canvasEngine";

export interface DataBindings {
  bindingConstraintStrength: number;
  confidenceScore: number;
  signalDensity: number;
  decisionGrade: number;
  lensWeight: number;
}

const DEFAULT_BINDINGS: DataBindings = {
  bindingConstraintStrength: 0.85,
  confidenceScore: 0.78,
  signalDensity: 0.72,
  decisionGrade: 0.88,
  lensWeight: 0.65,
};

export type SceneId = "problem" | "assumptions" | "deconstruction" | "constraint" | "rebuild" | "outcome";

export interface SceneSpec {
  id: SceneId;
  label: string;
  startPct: number;
  endPct: number;
}

// 60s total: 0-8s, 8-16s, 16-26s, 26-36s, 36-48s, 48-60s
export const SCENE_TIMELINE: SceneSpec[] = [
  { id: "problem",         label: "The Problem",          startPct: 0,      endPct: 0.133 },
  { id: "assumptions",     label: "Wrong Foundation",     startPct: 0.133,  endPct: 0.267 },
  { id: "deconstruction",  label: "First Principles",     startPct: 0.267,  endPct: 0.433 },
  { id: "constraint",      label: "Root Cause",           startPct: 0.433,  endPct: 0.600 },
  { id: "rebuild",         label: "Rebuild",              startPct: 0.600,  endPct: 0.800 },
  { id: "outcome",         label: "Decision-Ready",       startPct: 0.800,  endPct: 1.000 },
];

/* ── Brand Colors ── */
const C = {
  blue: "#4b68f5",
  blueLt: "#7b8ff8",
  pink: "#d64174",
  pinkLt: "#e06a92",
  purple: "#9030ea",
  purpleLt: "#aa5ef0",
  red: "#d94040",
  redLt: "#e87070",
  green: "#3db87a",
  greenLt: "#5ed498",
  amber: "#d4983b",
  amberLt: "#e8b560",
  gray: "#8892a8",
  grayLt: "#c5cad6",
  dark: "#1e2332",
  bg: "#f8f9fc",
};

function makeDots(count: number, seed: number, color: string, opacity: number): FloatingDot[] {
  const dots: FloatingDot[] = [];
  for (let i = 0; i < count; i++) {
    const s = seed + i * 137.508;
    dots.push({
      x: (Math.sin(s * 0.1) * 0.5 + 0.5) * 0.9 + 0.05,
      y: (Math.cos(s * 0.13) * 0.5 + 0.5) * 0.9 + 0.05,
      radius: 1.5 + Math.abs(Math.sin(s * 0.3)) * 2,
      color,
      opacity: opacity * (0.3 + Math.abs(Math.sin(s * 0.5)) * 0.7),
    });
  }
  return dots;
}

export function getActiveScene(pct: number): SceneSpec {
  return SCENE_TIMELINE.find(s => pct >= s.startPct && pct < s.endPct) || SCENE_TIMELINE[SCENE_TIMELINE.length - 1];
}

export function buildSceneFrame(
  sceneId: SceneId,
  progress: number,
  time: number,
  data: DataBindings = DEFAULT_BINDINGS
): SceneFrame {
  switch (sceneId) {
    case "problem": return sceneProblem(progress, time, data);
    case "assumptions": return sceneAssumptions(progress, time, data);
    case "deconstruction": return sceneDeconstruction(progress, time, data);
    case "constraint": return sceneConstraint(progress, time, data);
    case "rebuild": return sceneRebuild(progress, time, data);
    case "outcome": return sceneOutcome(progress, time, data);
  }
}

/* ═══ Scene 1: THE PROBLEM (0-8s) — Feature clutter, noise, wrong focus ═══ */
function sceneProblem(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeOutExpo(p);

  // Cluttered feature cards appearing and stacking
  const featureLabels = [
    "Add Features", "Lower Prices", "Copy Competitors",
    "More Marketing", "New Channels", "Bigger Team",
    "Faster Delivery", "Better Design", "More Content",
  ];

  const blocks: UIBlock[] = featureLabels.map((label, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const appear = Math.max(0, Math.min(1, (ep - i * 0.08) * 5));
    const shake = Math.sin(t * 3 + i * 1.7) * lerp(0, 0.004, ep);

    return {
      id: `f${i}`,
      x: 0.15 + col * 0.24 + shake,
      y: 0.18 + row * 0.24 + Math.sin(t * 2 + i) * 0.003,
      w: 0.20,
      h: 0.18,
      color: C.gray,
      borderColor: C.grayLt,
      opacity: appear * lerp(0.9, 0.4, Math.max(0, ep - 0.7) * 3.3),
      label,
      sublabel: "symptom",
      cornerRadius: 10,
    };
  });

  // Confusion overlay text
  const texts: TextElement[] = [];
  if (ep > 0.6) {
    texts.push({
      text: "Optimizing symptoms",
      x: 0.5, y: 0.92,
      size: 14, color: C.red, weight: 600,
      opacity: lerp(0, 0.7, (ep - 0.6) * 2.5),
    });
  }

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.05, 1.0, ep) },
    blocks, lines: [], texts,
    dots: makeDots(20, 42, C.grayLt, 0.12),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.5, radius: 0.5, color: C.red, intensity: ep * 0.3 },
  };
}

/* ═══ Scene 2: ASSUMPTIONS (8-16s) — Foundation blocks crack ═══ */
function sceneAssumptions(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const assumptions = [
    "Market is stable",
    "Price drives value",
    "More features = growth",
    "Customers know needs",
    "Competition is clear",
  ];

  const blocks: UIBlock[] = [];

  // Foundation blocks
  assumptions.forEach((label, i) => {
    const crackProgress = Math.max(0, (ep - 0.4 - i * 0.06) * 3);
    const shake = crackProgress > 0 ? Math.sin(t * 8 + i * 2) * crackProgress * 0.005 : 0;
    const sinkY = crackProgress > 0.5 ? (crackProgress - 0.5) * 0.04 : 0;

    blocks.push({
      id: `a${i}`,
      x: 0.08 + i * 0.175 + shake,
      y: 0.55 + sinkY,
      w: 0.155,
      h: 0.28,
      color: crackProgress > 0 ? C.red : C.amber,
      borderColor: crackProgress > 0 ? C.redLt : C.amberLt,
      opacity: lerp(0.2, 1, Math.min(1, ep * 3)),
      label,
      cornerRadius: 8,
      cracked: crackProgress > 0.2,
      glow: crackProgress > 0.5,
    });
  });

  // "Product" building sitting on top
  blocks.push({
    id: "product",
    x: 0.25, y: 0.2, w: 0.50, h: 0.28,
    color: C.blue, borderColor: C.blueLt,
    opacity: lerp(0.3, 0.9, ep),
    label: "Your Strategy",
    sublabel: "built on assumptions",
    cornerRadius: 12,
    glow: false,
  });

  const texts: TextElement[] = [];
  if (ep > 0.7) {
    texts.push({
      text: "Wrong foundation → nothing works",
      x: 0.5, y: 0.92,
      size: 14, color: C.red, weight: 600,
      opacity: lerp(0, 0.7, (ep - 0.7) * 3.3),
    });
  }

  const lines: FlowLine[] = assumptions.map((_, i) => ({
    from: "product", to: `a${i}`,
    color: C.gray, strength: 0.3, animated: false,
  }));

  return {
    camera: { x: 0, y: 0, zoom: 1.0 },
    blocks, lines, texts,
    dots: makeDots(15, 100, C.amberLt, 0.08),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.7, radius: 0.4, color: C.red, intensity: ep * 0.25 },
  };
}

/* ═══ Scene 3: DECONSTRUCTION (16-26s) — System disassembles into fundamentals ═══ */
function sceneDeconstruction(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutQuint(p);

  const components = [
    { label: "Cost", color: C.blue },
    { label: "Time", color: C.blue },
    { label: "Adoption", color: C.purple },
    { label: "Scale", color: C.purple },
    { label: "Reliability", color: C.pink },
    { label: "Risk", color: C.pink },
  ];

  // Start clustered in center, spread to clean grid
  const blocks: UIBlock[] = components.map((comp, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const startX = 0.38 + (Math.sin(i * 2.3) * 0.06);
    const startY = 0.35 + (Math.cos(i * 1.7) * 0.05);
    const endX = 0.12 + col * 0.28;
    const endY = 0.28 + row * 0.32;
    const appear = Math.max(0, Math.min(1, (ep - i * 0.05) * 4));

    return {
      id: `comp${i}`,
      x: lerp(startX, endX, easeOutQuart(appear)),
      y: lerp(startY, endY, easeOutQuart(appear)),
      w: 0.22,
      h: 0.24,
      color: comp.color,
      borderColor: comp.color,
      opacity: appear,
      label: comp.label,
      sublabel: "fundamental",
      cornerRadius: 10,
      glow: ep > 0.7,
      pulse: ep > 0.8 ? 1.5 : 0,
    };
  });

  const texts: TextElement[] = [
    {
      text: "First-principles breakdown",
      x: 0.5, y: 0.12,
      size: 16, color: C.dark, weight: 700,
      opacity: lerp(0, 0.8, ep),
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.1, 1.0, ep) },
    blocks, lines: [], texts,
    dots: makeDots(25, 271, C.blueLt, 0.06),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.5, radius: 0.5, color: C.blue, intensity: ep * 0.2 },
  };
}

/* ═══ Scene 4: CONSTRAINT DISCOVERY (26-36s) — One constraint glows ═══ */
function sceneConstraint(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const components = [
    { label: "Cost", color: C.gray },
    { label: "Time", color: C.gray },
    { label: "Adoption", color: C.gray },
    { label: "Scale", color: C.gray },
    { label: "Reliability", color: C.gray },
    { label: "Risk", color: C.gray },
  ];

  // All fade except the binding constraint
  const constraintIdx = 2; // "Adoption" is the binding constraint

  const blocks: UIBlock[] = components.map((comp, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const isConstraint = i === constraintIdx;
    const fadeOthers = isConstraint ? 1 : lerp(1, 0.2, ep);
    const scaleUp = isConstraint ? lerp(1.0, 1.15, ep) : 1;
    const baseW = 0.22;
    const baseH = 0.24;

    return {
      id: `c${i}`,
      x: 0.12 + col * 0.28 - (isConstraint ? (scaleUp - 1) * baseW / 2 : 0),
      y: 0.28 + row * 0.32 - (isConstraint ? (scaleUp - 1) * baseH / 2 : 0),
      w: baseW * scaleUp,
      h: baseH * scaleUp,
      color: isConstraint ? C.red : comp.color,
      borderColor: isConstraint ? C.red : C.grayLt,
      opacity: fadeOthers,
      label: isConstraint ? "Adoption" : comp.label,
      sublabel: isConstraint ? "binding constraint" : undefined,
      cornerRadius: 10,
      glow: isConstraint && ep > 0.3,
      pulse: isConstraint ? 2.0 : 0,
    };
  });

  // Signal lines from constraint to center
  const texts: TextElement[] = [
    {
      text: "Root cause identified",
      x: 0.5, y: 0.12,
      size: 16, color: C.red, weight: 700,
      opacity: lerp(0, 0.8, Math.max(0, ep - 0.3) * 1.4),
    },
    {
      text: `Constraint strength: ${Math.round(d.bindingConstraintStrength * 100)}%`,
      x: 0.5, y: 0.92,
      size: 12, color: C.red, weight: 500,
      opacity: lerp(0, 0.6, Math.max(0, ep - 0.5) * 2),
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.0, 1.05, ep) },
    blocks, lines: [], texts,
    dots: makeDots(15, 389, C.redLt, 0.08),
    bgColor: C.bg,
    accentGlow: { x: 0.40, y: 0.45, radius: 0.25, color: C.red, intensity: ep * 0.5 },
  };
}

/* ═══ Scene 5: REBUILD (36-48s) — New structure forms from constraint ═══ */
function sceneRebuild(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeOutQuart(p);

  const layers = [
    { label: "Root Constraint", sublabel: "adoption barrier", color: C.red, y: 0.72 },
    { label: "Architecture Change", sublabel: "product redesign", color: C.blue, y: 0.52 },
    { label: "Value Engine", sublabel: "new model", color: C.purple, y: 0.32 },
    { label: "Strategic Output", sublabel: "execution path", color: C.green, y: 0.14 },
  ];

  const blocks: UIBlock[] = layers.map((layer, i) => {
    const appear = Math.max(0, Math.min(1, (ep - i * 0.15) * 3));
    const slideX = lerp(i % 2 === 0 ? -0.3 : 0.3, 0, easeOutQuart(appear));

    return {
      id: `r${i}`,
      x: 0.22 + slideX,
      y: layer.y,
      w: 0.56,
      h: 0.14,
      color: layer.color,
      borderColor: layer.color,
      opacity: appear,
      label: layer.label,
      sublabel: layer.sublabel,
      cornerRadius: 10,
      glow: appear > 0.8,
    };
  });

  // Flow lines connecting layers
  const lines: FlowLine[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const appear = Math.max(0, Math.min(1, (ep - (i + 1) * 0.15) * 3));
    if (appear > 0.3) {
      lines.push({
        from: `r${i}`, to: `r${i + 1}`,
        color: layers[i + 1].color,
        strength: appear * 0.5,
        animated: true,
      });
    }
  }

  const texts: TextElement[] = [
    {
      text: "Solutions from truth",
      x: 0.5, y: 0.06,
      size: 16, color: C.dark, weight: 700,
      opacity: lerp(0, 0.8, Math.max(0, ep - 0.5) * 2),
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: 1.0 },
    blocks, lines, texts,
    dots: makeDots(20, 500, C.greenLt, 0.06),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.4, radius: 0.45, color: C.green, intensity: ep * 0.2 },
  };
}

/* ═══ Scene 6: OUTCOME (48-60s) — Clean decision outputs ═══ */
function sceneOutcome(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const outputs = [
    { label: "Actionable Strategy", sublabel: "execution-ready", color: C.green, x: 0.06, y: 0.30 },
    { label: "Validated Assumptions", sublabel: "evidence-bounded", color: C.blue, x: 0.52, y: 0.30 },
    { label: "Execution Path", sublabel: "step-by-step", color: C.purple, x: 0.06, y: 0.58 },
    { label: "Investor Narrative", sublabel: "pitch-ready", color: C.pink, x: 0.52, y: 0.58 },
  ];

  const blocks: UIBlock[] = outputs.map((out, i) => {
    const appear = Math.max(0, Math.min(1, (ep - i * 0.1) * 3));
    return {
      id: `o${i}`,
      x: out.x,
      y: out.y,
      w: 0.42,
      h: 0.22,
      color: out.color,
      borderColor: out.color,
      opacity: appear,
      label: out.label,
      sublabel: out.sublabel,
      cornerRadius: 12,
      glow: appear > 0.5,
      pulse: appear > 0.8 ? 1.2 : 0,
    };
  });

  // Central decision grade
  blocks.push({
    id: "grade",
    x: 0.30, y: 0.05, w: 0.40, h: 0.18,
    color: C.green, borderColor: C.green,
    opacity: lerp(0, 1, Math.max(0, ep - 0.3) * 1.4),
    label: `Decision Grade: ${Math.round(d.decisionGrade * 100)}`,
    sublabel: "decision-ready",
    cornerRadius: 14,
    glow: true,
    pulse: 1.0,
  });

  // Lines from outputs to grade
  const lines: FlowLine[] = outputs.map((_, i) => ({
    from: `o${i}`, to: "grade",
    color: outputs[i].color,
    strength: lerp(0, 0.4, Math.max(0, ep - 0.4) * 1.7),
    animated: false,
  }));

  const texts: TextElement[] = [
    {
      text: "Decision-grade clarity",
      x: 0.5, y: 0.92,
      size: 15, color: C.dark, weight: 700,
      opacity: lerp(0, 0.8, Math.max(0, ep - 0.6) * 2.5),
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.05, 1.0, ep) },
    blocks, lines, texts,
    dots: makeDots(30, 777, C.greenLt, 0.05),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.3, radius: 0.4, color: C.green, intensity: ep * 0.3 },
  };
}
