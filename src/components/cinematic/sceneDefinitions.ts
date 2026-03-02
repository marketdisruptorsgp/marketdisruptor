/* ═══════════════════════════════════════════════════════════════
   SCENE DEFINITIONS v4 — HIGH IMPACT STORYTELLING
   
   6 scenes, 60s. Every frame demands attention.
   Bold colors, dramatic transitions, visual narrative arc.
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

/* ── Brand Colors — SATURATED for max contrast ── */
const C = {
  blue: "#3554e8",
  blueLt: "#6b85f5",
  blueXLt: "#c5d0fc",
  pink: "#c9245e",
  pinkLt: "#e06590",
  purple: "#7b22d4",
  purpleLt: "#a95ef0",
  red: "#c62828",
  redLt: "#e05050",
  redBg: "#fff0f0",
  green: "#15803d",
  greenLt: "#34d399",
  greenBg: "#ecfdf5",
  amber: "#b45309",
  amberLt: "#f59e0b",
  amberBg: "#fffbeb",
  gray: "#64748b",
  grayLt: "#94a3b8",
  grayXLt: "#e2e8f0",
  dark: "#0f172a",
  mid: "#334155",
  bg: "#f8fafc",
  white: "#ffffff",
};

function particles(count: number, seed: number, color: string, opacity: number, drift = false, rings = false): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = seed + i * 137.508;
    ps.push({
      x: (Math.sin(s * 0.1) * 0.5 + 0.5) * 0.92 + 0.04,
      y: (Math.cos(s * 0.13) * 0.5 + 0.5) * 0.88 + 0.06,
      radius: 1.8 + Math.abs(Math.sin(s * 0.3)) * 2.5,
      color,
      opacity: opacity * (0.4 + Math.abs(Math.sin(s * 0.5)) * 0.6),
      vx: drift ? Math.sin(s) * 0.0003 : 0,
      vy: drift ? Math.cos(s) * 0.0002 : 0,
      ring: rings && i % 3 === 0,
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
   Chaotic symptom cards — visual noise.
   Cards shake, overlap, crowd the screen. Red warning glow.
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
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.05) * 5));
    const appear = easeOutBack(stagger);
    const shake = Math.sin(t * 4 + i * 1.9) * lerp(0, 0.008, ep);
    const fadeOut = p > 0.75 ? lerp(1, 0.08, (p - 0.75) * 4) : 1;

    return {
      id: `f${i}`,
      x: 0.12 + col * 0.255 + shake,
      y: 0.12 + row * 0.27 + Math.sin(t * 2.5 + i) * 0.005,
      w: 0.22,
      h: 0.21,
      color: C.gray,
      borderColor: C.grayLt,
      opacity: appear * fadeOut,
      label: s.label,
      sublabel: s.sub,
      cornerRadius: 14,
      iconDot: C.red,
      fillGradient: true,
      badge: "×",
      badgeColor: C.red,
    };
  });

  const texts: TextElement[] = [];
  if (ep > 0.3) {
    texts.push({
      text: "OPTIMIZING SYMPTOMS",
      x: 0.5, y: 0.95,
      size: 13, color: C.red, weight: 800,
      opacity: lerp(0, 0.85, (ep - 0.3) * 1.5),
      letterSpacing: 4,
      shadow: true,
    });
  }

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.08, 1.0, easeOutQuart(p)) },
    blocks, lines: [], texts,
    particles: particles(24, 42, C.redLt, 0.15),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.5, radius: 0.6, color: C.red, intensity: ep * 0.5 },
    secondaryGlow: { x: 0.2, y: 0.3, radius: 0.3, color: C.amber, intensity: ep * 0.2 },
    vignette: ep * 0.4,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 2: ASSUMPTIONS (8-16s)
   Strategy card rests on cracking assumption pillars.
   Dramatic crack + collapse visual.
   ═══════════════════════════════════════════════════════════════ */
function sceneAssumptions(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const assumptions = [
    "Market is stable",
    "Price = value",
    "Features → growth",
    "Customers know needs",
    "Competition is clear",
  ];

  const blocks: UIBlock[] = [];

  // Foundation pillars
  assumptions.forEach((label, i) => {
    const crackT = Math.max(0, (ep - 0.3 - i * 0.06) * 4);
    const shake = crackT > 0 ? Math.sin(t * 12 + i * 2.3) * crackT * 0.01 : 0;
    const sink = crackT > 0.5 ? (crackT - 0.5) * 0.08 : 0;
    const appear = Math.min(1, ep * 3.5);

    blocks.push({
      id: `a${i}`,
      x: 0.04 + i * 0.188 + shake,
      y: 0.56 + sink,
      w: 0.168,
      h: 0.32,
      color: crackT > 0.15 ? C.red : C.amber,
      borderColor: crackT > 0.15 ? C.red : C.amberLt,
      opacity: appear,
      label,
      cornerRadius: 10,
      cracked: crackT > 0.1,
      glow: crackT > 0.5,
      accentBar: true,
      fillGradient: true,
      fillColor: crackT > 0.15 ? C.red : C.amber,
    });
  });

  // Strategy card on top — sinking
  const strategySink = Math.max(0, (ep - 0.55) * 2.2) * 0.07;
  blocks.push({
    id: "strategy",
    x: 0.18,
    y: 0.12 + strategySink,
    w: 0.64,
    h: 0.32,
    color: C.blue,
    borderColor: C.blue,
    opacity: lerp(0.4, 1, Math.min(1, ep * 2.5)),
    label: "Your Strategy",
    sublabel: "built on assumptions",
    cornerRadius: 16,
    accentBar: true,
    iconDot: C.blue,
    fillGradient: true,
    glow: true,
  });

  // Connection lines — dashed
  const lines: FlowLine[] = assumptions.map((_, i) => ({
    from: "strategy", to: `a${i}`,
    color: ep > 0.5 ? C.red : C.gray, strength: 0.4, animated: false, dashed: true,
  }));

  const texts: TextElement[] = [];
  if (ep > 0.65) {
    texts.push({
      text: "WRONG FOUNDATION",
      x: 0.5, y: 0.95,
      size: 13, color: C.red, weight: 800,
      opacity: lerp(0, 0.85, (ep - 0.65) * 3),
      letterSpacing: 4,
      shadow: true,
    });
  }

  return {
    camera: { x: 0, y: 0, zoom: 1.0 },
    blocks, lines, texts,
    particles: particles(16, 200, C.redLt, 0.12),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.72, radius: 0.4, color: C.red, intensity: ep * 0.55 },
    scanLine: { y: lerp(0.15, 0.85, (t * 0.18) % 1), color: C.red, opacity: ep * 0.6 },
    vignette: ep * 0.3,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 3: DECONSTRUCTION (16-26s)
   Clustered mass → clean grid. Color-coded fundamentals.
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
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.05) * 4));
    const appear = easeOutQuart(stagger);
    const startX = 0.38 + Math.sin(i * 2.3) * 0.1;
    const startY = 0.38 + Math.cos(i * 1.7) * 0.08;
    const endX = 0.07 + col * 0.30;
    const endY = 0.24 + row * 0.36;

    return {
      id: `d${i}`,
      x: lerp(startX, endX, appear),
      y: lerp(startY, endY, appear),
      w: 0.26,
      h: 0.28,
      color: comp.color,
      borderColor: comp.color,
      opacity: appear,
      label: comp.label,
      sublabel: comp.sub,
      cornerRadius: 14,
      accentBar: appear > 0.4,
      glow: ep > 0.7,
      pulse: ep > 0.8 ? 2.0 : 0,
      iconDot: comp.color,
      fillGradient: true,
      fillColor: comp.color,
    };
  });

  const texts: TextElement[] = [
    {
      text: "FIRST-PRINCIPLES BREAKDOWN",
      x: 0.5, y: 0.08,
      size: 14, color: C.dark, weight: 800,
      opacity: lerp(0, 0.85, ep),
      letterSpacing: 3,
      shadow: true,
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.15, 1.0, easeOutQuart(p)) },
    blocks, lines: [], texts,
    particles: particles(30, 371, C.blueLt, 0.1, true, true),
    bgColor: C.bg,
    accentGlow: { x: 0.35, y: 0.4, radius: 0.45, color: C.blue, intensity: ep * 0.4 },
    secondaryGlow: { x: 0.65, y: 0.55, radius: 0.35, color: C.purple, intensity: ep * 0.3 },
    scanLine: { y: lerp(0.15, 0.9, (t * 0.14) % 1), color: C.blue, opacity: ep * 0.5 },
    vignette: 0.2,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 4: CONSTRAINT DISCOVERY (26-36s)
   Everything fades except the binding constraint.
   Constraint pulses with dramatic red glow. Others ghost out.
   ═══════════════════════════════════════════════════════════════ */
function sceneConstraint(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  const constraintIdx = 2; // Adoption Curve

  const labels = [
    "Cost Structure", "Time to Value", "Adoption Curve",
    "Scale Dynamics", "Reliability", "Risk Profile",
  ];
  const baseColors = [C.grayLt, C.grayLt, C.red, C.grayLt, C.grayLt, C.grayLt];

  const blocks: UIBlock[] = labels.map((label, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const isC = i === constraintIdx;
    const fade = isC ? 1 : lerp(1, 0.08, ep);
    const scale = isC ? lerp(1, 1.25, easeOutQuart(ep)) : lerp(1, 0.88, ep);
    const baseW = 0.26;
    const baseH = 0.28;
    const bx = 0.07 + col * 0.30;
    const by = 0.24 + row * 0.36;

    return {
      id: `c${i}`,
      x: bx - (isC ? (scale - 1) * baseW / 2 : 0),
      y: by - (isC ? (scale - 1) * baseH / 2 : 0),
      w: baseW * scale,
      h: baseH * scale,
      color: baseColors[i],
      borderColor: isC ? C.red : C.grayXLt,
      opacity: fade,
      label,
      sublabel: isC ? "BINDING CONSTRAINT" : undefined,
      cornerRadius: 14,
      glow: isC && ep > 0.2,
      pulse: isC ? 3.0 : 0,
      accentBar: isC,
      iconDot: isC ? C.red : undefined,
      progressBar: isC ? d.bindingConstraintStrength * ep : undefined,
      progressColor: C.red,
      fillGradient: isC,
      fillColor: isC ? C.red : undefined,
      shadowColor: isC ? C.red : undefined,
      badge: isC ? `${Math.round(d.bindingConstraintStrength * 100)}%` : undefined,
      badgeColor: C.red,
    };
  });

  const texts: TextElement[] = [
    {
      text: "ROOT CAUSE IDENTIFIED",
      x: 0.5, y: 0.08,
      size: 15, color: C.red, weight: 800,
      opacity: lerp(0, 0.9, Math.max(0, ep - 0.2) * 1.25),
      letterSpacing: 3.5,
      shadow: true,
      underline: true,
      underlineColor: C.red,
    },
    {
      text: `Constraint strength: ${Math.round(d.bindingConstraintStrength * 100 * ep)}%`,
      x: 0.5, y: 0.95,
      size: 12, color: C.red, weight: 600,
      opacity: lerp(0, 0.7, Math.max(0, ep - 0.35) * 1.5),
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.0, 1.12, easeOutQuart(ep)) },
    blocks, lines: [], texts,
    particles: particles(20, 489, C.redLt, 0.15, false, true),
    bgColor: C.bg,
    accentGlow: { x: 0.38, y: 0.42, radius: 0.28, color: C.red, intensity: ep * 0.8 },
    secondaryGlow: { x: 0.38, y: 0.42, radius: 0.15, color: C.red, intensity: ep * 0.4 },
    vignette: ep * 0.5,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 5: REBUILD (36-48s)
   Layered reconstruction from bottom up.
   Bold colored cards slide in with flow lines connecting them.
   ═══════════════════════════════════════════════════════════════ */
function sceneRebuild(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeOutQuart(p);

  const layers = [
    { label: "Root Constraint",     sub: "adoption barrier identified",  color: C.red,    y: 0.74 },
    { label: "Architecture Change", sub: "product structure redesign",   color: C.blue,   y: 0.54 },
    { label: "Value Engine",        sub: "new business model",           color: C.purple, y: 0.34 },
    { label: "Strategic Output",    sub: "execution-ready strategy",     color: C.green,  y: 0.16 },
  ];

  const blocks: UIBlock[] = layers.map((layer, i) => {
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.1) * 3));
    const appear = easeOutBack(stagger);
    const slideX = lerp(i % 2 === 0 ? -0.5 : 0.5, 0, appear);

    return {
      id: `r${i}`,
      x: 0.15 + slideX,
      y: layer.y,
      w: 0.70,
      h: 0.14,
      color: layer.color,
      borderColor: layer.color,
      opacity: Math.min(1, appear),
      label: layer.label,
      sublabel: layer.sub,
      cornerRadius: 14,
      glow: appear > 0.6,
      accentBar: true,
      iconDot: layer.color,
      progressBar: appear > 0.4 ? lerp(0, 1, (appear - 0.4) * 1.67) : undefined,
      progressColor: layer.color,
      fillGradient: true,
      fillColor: layer.color,
    };
  });

  // Bold animated flow lines
  const lines: FlowLine[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const appear = Math.max(0, Math.min(1, (ep - (i + 1) * 0.1) * 3));
    if (appear > 0.2) {
      lines.push({
        from: `r${i}`, to: `r${i + 1}`,
        color: layers[i + 1].color,
        strength: appear * 0.75,
        animated: true,
        thick: true,
        glowTrail: true,
      });
    }
  }

  const texts: TextElement[] = [
    {
      text: "SOLUTIONS FROM TRUTH",
      x: 0.5, y: 0.05,
      size: 14, color: C.dark, weight: 800,
      opacity: lerp(0, 0.85, Math.max(0, ep - 0.3) * 1.4),
      letterSpacing: 3,
      shadow: true,
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: 1.0 },
    blocks, lines, texts,
    particles: particles(25, 600, C.greenLt, 0.12, true),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.35, radius: 0.45, color: C.green, intensity: ep * 0.4 },
    secondaryGlow: { x: 0.5, y: 0.65, radius: 0.35, color: C.purple, intensity: ep * 0.25 },
    tertiaryGlow: { x: 0.5, y: 0.5, radius: 0.25, color: C.blue, intensity: ep * 0.15 },
    vignette: 0.2,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCENE 6: OUTCOME (48-60s)
   Four bold output cards with central decision grade.
   Triumphant green glow. Everything feels resolved.
   ═══════════════════════════════════════════════════════════════ */
function sceneOutcome(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  const outputs = [
    { label: "Actionable Strategy",   sub: "execution-ready",      color: C.green,  x: 0.03, y: 0.36 },
    { label: "Validated Assumptions",  sub: "evidence-bounded",     color: C.blue,   x: 0.52, y: 0.36 },
    { label: "Execution Path",         sub: "step-by-step roadmap", color: C.purple, x: 0.03, y: 0.64 },
    { label: "Investor Narrative",     sub: "pitch-ready deck",     color: C.pink,   x: 0.52, y: 0.64 },
  ];

  const blocks: UIBlock[] = outputs.map((out, i) => {
    const stagger = Math.max(0, Math.min(1, (ep - i * 0.07) * 2.8));
    const appear = easeOutQuart(stagger);
    return {
      id: `o${i}`,
      x: out.x,
      y: out.y,
      w: 0.45,
      h: 0.23,
      color: out.color,
      borderColor: out.color,
      opacity: appear,
      label: out.label,
      sublabel: out.sub,
      cornerRadius: 16,
      glow: appear > 0.4,
      accentBar: true,
      iconDot: out.color,
      progressBar: appear > 0.25 ? lerp(0, 1, (appear - 0.25) * 1.33) : 0,
      progressColor: out.color,
      pulse: appear > 0.85 ? 1.2 : 0,
      fillGradient: true,
      fillColor: out.color,
      badge: appear > 0.7 ? "✓" : undefined,
      badgeColor: out.color,
    };
  });

  // Central decision grade card — large and bold
  const gradeAppear = Math.max(0, Math.min(1, (ep - 0.2) * 1.25));
  const gradeEased = easeOutBack(gradeAppear);
  blocks.push({
    id: "grade",
    x: 0.22, y: 0.05, w: 0.56, h: 0.24,
    color: C.green, borderColor: C.green,
    opacity: gradeEased,
    label: `Decision Grade: ${Math.round(d.decisionGrade * 100 * gradeAppear)}`,
    sublabel: "decision-ready",
    cornerRadius: 18,
    glow: true,
    accentBar: true,
    pulse: gradeAppear > 0.7 ? 1.5 : 0,
    progressBar: gradeAppear > 0.4 ? d.decisionGrade : 0,
    progressColor: C.green,
    iconDot: C.green,
    fillGradient: true,
    fillColor: C.green,
    shadowColor: C.green,
    badge: gradeAppear > 0.8 ? `${Math.round(d.decisionGrade * 100)}` : undefined,
    badgeColor: C.green,
  });

  // Animated flow lines from outputs to grade
  const lines: FlowLine[] = outputs.map((_, i) => ({
    from: `o${i}`, to: "grade",
    color: outputs[i].color,
    strength: lerp(0, 0.5, Math.max(0, ep - 0.3) * 1.4),
    animated: true,
    glowTrail: true,
  }));

  const texts: TextElement[] = [
    {
      text: "DECISION-GRADE CLARITY",
      x: 0.5, y: 0.95,
      size: 14, color: C.dark, weight: 800,
      opacity: lerp(0, 0.85, Math.max(0, ep - 0.5) * 2),
      letterSpacing: 3.5,
      shadow: true,
      underline: true,
      underlineColor: C.green,
    },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.08, 1.0, easeOutQuart(ep)) },
    blocks, lines, texts,
    particles: particles(35, 877, C.greenLt, 0.12, true, true),
    bgColor: C.bg,
    accentGlow: { x: 0.5, y: 0.18, radius: 0.4, color: C.green, intensity: ep * 0.6 },
    secondaryGlow: { x: 0.3, y: 0.55, radius: 0.35, color: C.blue, intensity: ep * 0.2 },
    tertiaryGlow: { x: 0.7, y: 0.55, radius: 0.35, color: C.purple, intensity: ep * 0.15 },
    vignette: 0.15,
  };
}
