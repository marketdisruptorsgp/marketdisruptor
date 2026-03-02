/* ═══════════════════════════════════════════════════════════════
   SCENE DEFINITIONS v3 — World-class 60s cinematic
   
   6 scenes, precisely timed to voiceover script.
   Premium light-mode structural visuals.
   Each scene tells a visual story of cause → effect.
   ═══════════════════════════════════════════════════════════════ */

import type { SceneFrame, UIBlock, FlowLine, TextElement, Particle } from "./canvasEngine";
import { lerp, easeInOutCubic, easeOutExpo, easeOutQuart, easeInOutQuint, easeOutBack } from "./canvasEngine";

export interface DataBindings {
  bindingConstraintStrength: number;
  confidenceScore: number;
  signalDensity: number;
  decisionGrade: number;
  lensWeight: number;
}

const D: DataBindings = {
  bindingConstraintStrength: 0.85,
  confidenceScore: 0.78,
  signalDensity: 0.72,
  decisionGrade: 0.91,
  lensWeight: 0.65,
};

export type SceneId = "problem" | "assumptions" | "deconstruction" | "constraint" | "rebuild" | "outcome";

export interface SceneSpec {
  id: SceneId;
  label: string;
  startPct: number;
  endPct: number;
}

// Timed to voiceover: 0-8s, 8-16s, 16-26s, 26-36s, 36-48s, 48-60s
export const SCENE_TIMELINE: SceneSpec[] = [
  { id: "problem",         label: "The Problem",      startPct: 0,     endPct: 0.133 },
  { id: "assumptions",     label: "Wrong Foundation",  startPct: 0.133, endPct: 0.267 },
  { id: "deconstruction",  label: "First Principles",  startPct: 0.267, endPct: 0.433 },
  { id: "constraint",      label: "Root Cause",        startPct: 0.433, endPct: 0.600 },
  { id: "rebuild",         label: "Rebuild",           startPct: 0.600, endPct: 0.800 },
  { id: "outcome",         label: "Decision-Ready",    startPct: 0.800, endPct: 1.000 },
];

/* ── Brand Colors ── */
const C = {
  blue: "#4b68f5",
  blueLt: "#8a9df8",
  pink: "#d64174",
  pinkLt: "#e87a9f",
  purple: "#9030ea",
  purpleLt: "#b46af0",
  red: "#d94040",
  redLt: "#e87070",
  green: "#22b573",
  greenLt: "#5ed498",
  amber: "#d4983b",
  amberLt: "#eab960",
  gray: "#8892a8",
  grayLt: "#c5cad6",
  grayXLt: "#e8ecf2",
  dark: "#1a1f2e",
  mid: "#4a5068",
  bg: "#f8f9fc",
  bgWarm: "#fafafa",
};

function particles(count: number, seed: number, color: string, opacity: number, drift = false): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = seed + i * 137.508;
    ps.push({
      x: (Math.sin(s * 0.1) * 0.5 + 0.5) * 0.92 + 0.04,
      y: (Math.cos(s * 0.13) * 0.5 + 0.5) * 0.88 + 0.06,
      radius: 1.2 + Math.abs(Math.sin(s * 0.3)) * 1.8,
      color,
      opacity: opacity * (0.3 + Math.abs(Math.sin(s * 0.5)) * 0.7),
      vx: drift ? Math.sin(s) * 0.0002 : 0,
      vy: drift ? Math.cos(s) * 0.0001 : 0,
    });
  }
  return ps;
}

export function getActiveScene(pct: number): SceneSpec {
  return SCENE_TIMELINE.find(s => pct >= s.startPct && pct < s.endPct) || SCENE_TIMELINE[SCENE_TIMELINE.length - 1];
}

export function buildSceneFrame(
  sceneId: SceneId,
  progress: number,
  time: number,
  data: DataBindings = D
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

/* ═══════════════════════════════════════════════════════════════
   SCENE 1: THE PROBLEM (0-8s)
   "Most people don't fail because they lack ideas.
    They fail because they're solving the wrong problem."
   
   Visual: Scattered symptom cards appear chaotically,
   overlapping, competing — visual noise that fades to
   reveal emptiness underneath.
   ═══════════════════════════════════════════════════════════════ */
function sceneProblem(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeOutExpo(p);

  const symptoms = [
    { label: "Add Features",     sub: "symptom" },
    { label: "Lower Prices",     sub: "symptom" },
    { label: "Copy Competitors", sub: "symptom" },
    { label: "More Marketing",   sub: "symptom" },
    { label: "Bigger Team",      sub: "symptom" },
    { label: "New Channels",     sub: "symptom" },
    { label: "Faster Delivery",  sub: "symptom" },
    { label: "Better Design",    sub: "symptom" },
    { label: "Work Harder",      sub: "symptom" },
  ];

  const blocks: UIBlock[] = symptoms.map((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.06) * 4));
    const appear = easeOutBack(stagger);
    // Shake increases over time
    const shake = Math.sin(t * 3.5 + i * 1.7) * lerp(0, 0.005, ep);
    // Fade out in last quarter
    const fadeOut = p > 0.75 ? lerp(1, 0.15, (p - 0.75) * 4) : 1;

    return {
      id: `f${i}`,
      x: 0.14 + col * 0.245 + shake,
      y: 0.14 + row * 0.26 + Math.sin(t * 2.2 + i) * 0.003,
      w: 0.21,
      h: 0.20,
      color: C.gray,
      borderColor: C.grayLt,
      opacity: appear * fadeOut,
      label: s.label,
      sublabel: s.sub,
      cornerRadius: 12,
      iconDot: C.grayLt,
    };
  });

  const texts: TextElement[] = [];
  if (ep > 0.5) {
    texts.push({
      text: "OPTIMIZING SYMPTOMS",
      x: 0.5, y: 0.94,
      size: 11, color: C.red, weight: 700,
      opacity: lerp(0, 0.65, (ep - 0.5) * 2),
      letterSpacing: 3,
    });
  }

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.06, 1.0, easeOutQuart(p)) },
    blocks, lines: [], texts,
    particles: particles(18, 42, C.grayLt, 0.08),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.5, radius: 0.55, color: C.red, intensity: ep * 0.15 },
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 2: ASSUMPTIONS (8-16s)
   "They're building on assumptions they never questioned.
    When the foundation is wrong, nothing works."
   
   Visual: Strategy card sits atop assumption blocks.
   Assumptions crack and collapse, strategy card sinks.
   ═══════════════════════════════════════════════════════════════ */
function sceneAssumptions(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const assumptions = [
    "Market is stable",
    "Price drives value",
    "Features = growth",
    "Customers know needs",
    "Competition is clear",
  ];

  const blocks: UIBlock[] = [];

  // Foundation blocks
  assumptions.forEach((label, i) => {
    const crackT = Math.max(0, (ep - 0.35 - i * 0.07) * 3.5);
    const shake = crackT > 0 ? Math.sin(t * 9 + i * 2.3) * crackT * 0.006 : 0;
    const sink = crackT > 0.5 ? (crackT - 0.5) * 0.06 : 0;
    const appear = Math.min(1, ep * 3);

    blocks.push({
      id: `a${i}`,
      x: 0.06 + i * 0.182 + shake,
      y: 0.58 + sink,
      w: 0.162,
      h: 0.30,
      color: crackT > 0.2 ? C.red : C.amber,
      borderColor: crackT > 0.2 ? C.redLt : C.amberLt,
      opacity: appear,
      label,
      cornerRadius: 10,
      cracked: crackT > 0.15,
      glow: crackT > 0.6,
      accentBar: true,
    });
  });

  // Strategy card on top
  const strategySink = Math.max(0, (ep - 0.6) * 2.5) * 0.05;
  const strategyTilt = Math.max(0, (ep - 0.7) * 3.3);
  blocks.push({
    id: "strategy",
    x: 0.22,
    y: 0.15 + strategySink,
    w: 0.56,
    h: 0.30,
    color: C.blue,
    borderColor: C.blueLt,
    opacity: lerp(0.3, 0.95, Math.min(1, ep * 2.5)),
    label: "Your Strategy",
    sublabel: "built on assumptions",
    cornerRadius: 14,
    accentBar: true,
    iconDot: C.blue,
  });

  // Connection lines
  const lines: FlowLine[] = assumptions.map((_, i) => ({
    from: "strategy", to: `a${i}`,
    color: C.gray, strength: 0.25, animated: false, dashed: true,
  }));

  const texts: TextElement[] = [];
  if (ep > 0.75) {
    texts.push({
      text: "WRONG FOUNDATION",
      x: 0.5, y: 0.94,
      size: 11, color: C.red, weight: 700,
      opacity: lerp(0, 0.65, (ep - 0.75) * 4),
      letterSpacing: 3,
    });
  }

  return {
    camera: { x: 0, y: 0, zoom: 1.0 },
    blocks, lines, texts,
    particles: particles(12, 200, C.amberLt, 0.06),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.72, radius: 0.35, color: C.red, intensity: ep * 0.2 },
    scanLine: { y: lerp(0.2, 0.8, (t * 0.15) % 1), color: C.red, opacity: ep * 0.4 },
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 3: DECONSTRUCTION (16-26s)
   "It takes any product, service, or business and breaks it
    down to what actually drives results."
   
   Visual: Clustered mass separates into clean, labeled
   fundamental components. Precise grid alignment.
   ═══════════════════════════════════════════════════════════════ */
function sceneDeconstruction(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeInOutQuint(p);

  const components = [
    { label: "Cost Structure",  color: C.blue,   sub: "fundamental" },
    { label: "Time to Value",   color: C.blue,   sub: "fundamental" },
    { label: "Adoption Curve",  color: C.purple, sub: "fundamental" },
    { label: "Scale Dynamics",  color: C.purple, sub: "fundamental" },
    { label: "Reliability",     color: C.pink,   sub: "fundamental" },
    { label: "Risk Profile",    color: C.pink,   sub: "fundamental" },
  ];

  const blocks: UIBlock[] = components.map((comp, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.06) * 3.5));
    const appear = easeOutQuart(stagger);
    // Start clustered → separate to grid
    const startX = 0.36 + Math.sin(i * 2.3) * 0.07;
    const startY = 0.36 + Math.cos(i * 1.7) * 0.06;
    const endX = 0.09 + col * 0.29;
    const endY = 0.26 + row * 0.34;

    return {
      id: `d${i}`,
      x: lerp(startX, endX, appear),
      y: lerp(startY, endY, appear),
      w: 0.24,
      h: 0.26,
      color: comp.color,
      borderColor: comp.color,
      opacity: appear,
      label: comp.label,
      sublabel: comp.sub,
      cornerRadius: 12,
      accentBar: appear > 0.5,
      glow: ep > 0.8,
      pulse: ep > 0.85 ? 1.8 : 0,
      iconDot: comp.color,
    };
  });

  const texts: TextElement[] = [
    {
      text: "FIRST-PRINCIPLES BREAKDOWN",
      x: 0.5, y: 0.1,
      size: 12, color: C.dark, weight: 700,
      opacity: lerp(0, 0.7, ep),
      letterSpacing: 2.5,
    },
  ];

  // Scan line sweeping during decomposition
  const scanY = lerp(0.2, 0.85, (t * 0.12) % 1);

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.12, 1.0, easeOutQuart(p)) },
    blocks, lines: [], texts,
    particles: particles(22, 371, C.blueLt, 0.05, true),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.45, radius: 0.5, color: C.blue, intensity: ep * 0.15 },
    secondaryGlow: { x: 0.5, y: 0.55, radius: 0.3, color: C.purple, intensity: ep * 0.1 },
    scanLine: { y: scanY, color: C.blue, opacity: ep * 0.3 },
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 4: CONSTRAINT DISCOVERY (26-36s)
   "Finds the real constraint holding growth back."
   
   Visual: All components fade except the binding constraint,
   which scales up with a glowing pulse. Others become ghosted.
   ═══════════════════════════════════════════════════════════════ */
function sceneConstraint(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  const constraintIdx = 2; // Adoption Curve

  const labels = [
    "Cost Structure", "Time to Value", "Adoption Curve",
    "Scale Dynamics", "Reliability", "Risk Profile",
  ];
  const colors = [C.gray, C.gray, C.red, C.gray, C.gray, C.gray];

  const blocks: UIBlock[] = labels.map((label, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const isC = i === constraintIdx;
    const fade = isC ? 1 : lerp(1, 0.12, ep);
    const scale = isC ? lerp(1, 1.2, easeOutQuart(ep)) : lerp(1, 0.92, ep);
    const baseW = 0.24;
    const baseH = 0.26;
    const bx = 0.09 + col * 0.29;
    const by = 0.26 + row * 0.34;

    return {
      id: `c${i}`,
      x: bx - (isC ? (scale - 1) * baseW / 2 : 0),
      y: by - (isC ? (scale - 1) * baseH / 2 : 0),
      w: baseW * scale,
      h: baseH * scale,
      color: colors[i],
      borderColor: isC ? C.red : C.grayXLt,
      opacity: fade,
      label,
      sublabel: isC ? "binding constraint" : undefined,
      cornerRadius: 12,
      glow: isC && ep > 0.25,
      pulse: isC ? 2.5 : 0,
      accentBar: isC,
      iconDot: isC ? C.red : undefined,
      progressBar: isC ? d.bindingConstraintStrength * ep : undefined,
      progressColor: C.red,
    };
  });

  const texts: TextElement[] = [
    {
      text: "ROOT CAUSE IDENTIFIED",
      x: 0.5, y: 0.1,
      size: 12, color: C.red, weight: 700,
      opacity: lerp(0, 0.75, Math.max(0, ep - 0.25) * 1.33),
      letterSpacing: 2.5,
    },
    {
      text: `Constraint strength: ${Math.round(d.bindingConstraintStrength * 100 * ep)}%`,
      x: 0.5, y: 0.94,
      size: 11, color: C.red, weight: 500,
      opacity: lerp(0, 0.5, Math.max(0, ep - 0.4) * 1.7),
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.0, 1.08, easeOutQuart(ep)) },
    blocks, lines: [], texts,
    particles: particles(14, 489, C.redLt, 0.06),
    bgColor: C.bg,
    accentGlow: { x: 0.38, y: 0.43, radius: 0.22, color: C.red, intensity: ep * 0.45 },
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 5: REBUILD (36-48s)
   "Then it rebuilds the strategy from the ground up.
    Not just ideas — clear, creative solutions tied to real causes."
   
   Visual: Layered reconstruction from constraint upward.
   Each layer slides in from alternating sides.
   Animated flow lines connect layers.
   ═══════════════════════════════════════════════════════════════ */
function sceneRebuild(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeOutQuart(p);

  const layers = [
    { label: "Root Constraint",     sub: "adoption barrier identified",  color: C.red,    y: 0.74 },
    { label: "Architecture Change", sub: "product structure redesign",   color: C.blue,   y: 0.54 },
    { label: "Value Engine",        sub: "new business model",           color: C.purple, y: 0.34 },
    { label: "Strategic Output",    sub: "execution-ready strategy",     color: C.green,  y: 0.16 },
  ];

  const blocks: UIBlock[] = layers.map((layer, i) => {
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.12) * 2.8));
    const appear = easeOutBack(stagger);
    const slideX = lerp(i % 2 === 0 ? -0.35 : 0.35, 0, appear);

    return {
      id: `r${i}`,
      x: 0.18 + slideX,
      y: layer.y,
      w: 0.64,
      h: 0.14,
      color: layer.color,
      borderColor: layer.color,
      opacity: Math.min(1, appear),
      label: layer.label,
      sublabel: layer.sub,
      cornerRadius: 12,
      glow: appear > 0.7,
      accentBar: true,
      iconDot: layer.color,
      progressBar: appear > 0.5 ? lerp(0, 1, (appear - 0.5) * 2) : undefined,
      progressColor: layer.color,
    };
  });

  // Animated flow lines between layers
  const lines: FlowLine[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const appear = Math.max(0, Math.min(1, (ep - (i + 1) * 0.12) * 2.8));
    if (appear > 0.3) {
      lines.push({
        from: `r${i}`, to: `r${i + 1}`,
        color: layers[i + 1].color,
        strength: appear * 0.55,
        animated: true,
      });
    }
  }

  const texts: TextElement[] = [
    {
      text: "SOLUTIONS FROM TRUTH",
      x: 0.5, y: 0.06,
      size: 12, color: C.dark, weight: 700,
      opacity: lerp(0, 0.7, Math.max(0, ep - 0.4) * 1.7),
      letterSpacing: 2.5,
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: 1.0 },
    blocks, lines, texts,
    particles: particles(18, 600, C.greenLt, 0.05, true),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.4, radius: 0.45, color: C.green, intensity: ep * 0.15 },
    secondaryGlow: { x: 0.5, y: 0.65, radius: 0.3, color: C.purple, intensity: ep * 0.1 },
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 6: OUTCOME (48-60s)
   "Every opportunity becomes decision-ready.
    Stop optimizing symptoms. Start fixing what actually matters."
   
   Visual: Four output cards with progress bars fill in.
   Central decision grade appears with confidence score.
   Calm resolution, clear hierarchy.
   ═══════════════════════════════════════════════════════════════ */
function sceneOutcome(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const outputs = [
    { label: "Actionable Strategy",   sub: "execution-ready",      color: C.green,  x: 0.04, y: 0.34 },
    { label: "Validated Assumptions",  sub: "evidence-bounded",     color: C.blue,   x: 0.52, y: 0.34 },
    { label: "Execution Path",         sub: "step-by-step roadmap", color: C.purple, x: 0.04, y: 0.62 },
    { label: "Investor Narrative",     sub: "pitch-ready deck",     color: C.pink,   x: 0.52, y: 0.62 },
  ];

  const blocks: UIBlock[] = outputs.map((out, i) => {
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.08) * 2.5));
    const appear = easeOutQuart(stagger);
    return {
      id: `o${i}`,
      x: out.x,
      y: out.y,
      w: 0.44,
      h: 0.22,
      color: out.color,
      borderColor: out.color,
      opacity: appear,
      label: out.label,
      sublabel: out.sub,
      cornerRadius: 14,
      glow: appear > 0.5,
      accentBar: true,
      iconDot: out.color,
      progressBar: appear > 0.3 ? lerp(0, 1, (appear - 0.3) * 1.43) : 0,
      progressColor: out.color,
      pulse: appear > 0.9 ? 1.0 : 0,
    };
  });

  // Central decision grade card
  const gradeAppear = Math.max(0, Math.min(1, (ep - 0.25) * 1.33));
  const gradeEased = easeOutBack(gradeAppear);
  blocks.push({
    id: "grade",
    x: 0.26, y: 0.06, w: 0.48, h: 0.20,
    color: C.green, borderColor: C.green,
    opacity: gradeEased,
    label: `Decision Grade: ${Math.round(d.decisionGrade * 100 * gradeAppear)}`,
    sublabel: "decision-ready",
    cornerRadius: 16,
    glow: true,
    accentBar: true,
    pulse: gradeAppear > 0.8 ? 1.2 : 0,
    progressBar: gradeAppear > 0.5 ? d.decisionGrade : 0,
    progressColor: C.green,
    iconDot: C.green,
  });

  // Lines from outputs to grade
  const lines: FlowLine[] = outputs.map((_, i) => ({
    from: `o${i}`, to: "grade",
    color: outputs[i].color,
    strength: lerp(0, 0.35, Math.max(0, ep - 0.35) * 1.5),
    animated: true,
  }));

  const texts: TextElement[] = [
    {
      text: "DECISION-GRADE CLARITY",
      x: 0.5, y: 0.94,
      size: 12, color: C.dark, weight: 700,
      opacity: lerp(0, 0.7, Math.max(0, ep - 0.6) * 2.5),
      letterSpacing: 2.5,
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.06, 1.0, easeOutQuart(ep)) },
    blocks, lines, texts,
    particles: particles(25, 877, C.greenLt, 0.04, true),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.2, radius: 0.35, color: C.green, intensity: ep * 0.2 },
    secondaryGlow: { x: 0.5, y: 0.6, radius: 0.4, color: C.blue, intensity: ep * 0.08 },
  };
}
