/* ═══════════════════════════════════════════════════════════════
   SCENE DEFINITIONS — 6 cinematic scenes (world-class quality)
   Each returns a SceneFrame with particles, nebulae, trails,
   lens flares, and dramatic camera work. Colors aligned to
   project design tokens.
   ═══════════════════════════════════════════════════════════════ */

import type {
  SceneFrame, StructuralNode, CausalEdge, ConstraintField,
  Particle, NebulaCloud,
} from "./canvasEngine";
import { lerp, easeInOutCubic, easeOutExpo, easeOutQuart, easeInOutQuint, generateParticles } from "./canvasEngine";

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

export type SceneId = "emergence" | "constraint" | "causal" | "decision" | "outcome" | "identity";

export interface SceneSpec {
  id: SceneId;
  label: string;
  startPct: number;
  endPct: number;
}

export const SCENE_TIMELINE: SceneSpec[] = [
  { id: "emergence",  label: "System Emergence",      startPct: 0,    endPct: 0.15 },
  { id: "constraint", label: "Constraint Discovery",   startPct: 0.15, endPct: 0.30 },
  { id: "causal",     label: "Causal Structure",       startPct: 0.30, endPct: 0.55 },
  { id: "decision",   label: "Decision Formation",     startPct: 0.55, endPct: 0.75 },
  { id: "outcome",    label: "Strategic Outcome",      startPct: 0.75, endPct: 0.90 },
  { id: "identity",   label: "Platform Intelligence",  startPct: 0.90, endPct: 1.00 },
];

/* ── Project Colors (from CSS design tokens) ── */
const C = {
  // Primary blue — product mode
  primary:   "#4b68f5",
  primaryLt: "#7088f8",
  primaryDk: "#3350d4",
  // Service pink
  service:   "#d64174",
  serviceLt: "#e06a92",
  // Business purple
  business:  "#9030ea",
  businessLt:"#aa5ef0",
  // Semantic
  red:       "#d94040",
  redLt:     "#e06868",
  green:     "#3db87a",
  greenLt:   "#5ed498",
  amber:     "#d4983b",
  amberLt:   "#e0b060",
  // Neutrals
  white:     "#c8d2e6",
  dim:       "#2a3450",
  dimLt:     "#3a4a6a",
};

// Pre-generated particles for each scene
const PARTICLES_EMERGENCE = generateParticles(80, 42);
const PARTICLES_CONSTRAINT = generateParticles(50, 137);
const PARTICLES_CAUSAL = generateParticles(60, 271);
const PARTICLES_DECISION = generateParticles(45, 389);
const PARTICLES_OUTCOME = generateParticles(55, 500);
const PARTICLES_IDENTITY = generateParticles(100, 777);

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
    case "emergence": return sceneEmergence(progress, time, data);
    case "constraint": return sceneConstraint(progress, time, data);
    case "causal": return sceneCausal(progress, time, data);
    case "decision": return sceneDecision(progress, time, data);
    case "outcome": return sceneOutcome(progress, time, data);
    case "identity": return sceneIdentity(progress, time, data);
  }
}

/* ═══ Scene 1: System Emergence — chaos crystallizes into structure ═══ */
function sceneEmergence(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeOutExpo(p);
  const count = 28;
  const nodes: StructuralNode[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.sin(i * 0.7) * 0.3;
    const spread = lerp(0.9, 0.25, ep);
    const wobble = Math.sin(t * 0.4 + i * 1.3) * lerp(0.05, 0.01, ep);
    const cx = 0.5 + Math.cos(angle + t * 0.08) * spread * (0.28 + (i % 3) * 0.06) + wobble;
    const cy = 0.5 + Math.sin(angle + t * 0.12) * spread * (0.22 + (i % 2) * 0.06) + wobble * 0.7;

    const colorPick = i % 7;
    const color = colorPick < 2 ? C.primary : colorPick < 3 ? C.business : colorPick < 4 ? C.service : C.dim;
    const glowColor = colorPick < 2 ? C.primaryLt : colorPick < 3 ? C.businessLt : colorPick < 4 ? C.serviceLt : C.dimLt;

    nodes.push({
      id: `e${i}`,
      x: cx, y: cy,
      radius: lerp(0.6, 1.8, ep) * (i % 4 === 0 ? 1.4 : 1),
      depth: 0.2 + (i % 6) * 0.13,
      color, glowColor,
      glowIntensity: lerp(0, 0.5, ep) * (i % 3 === 0 ? 1 : 0.3),
      opacity: lerp(0.05, 0.75, ep),
      pulse: i % 5 === 0 ? 2.2 : 0,
      ring: i % 8 === 0 && ep > 0.5,
    });
  }

  const edges: CausalEdge[] = [];
  if (p > 0.35) {
    const edgeCount = Math.min(count - 1, Math.floor((p - 0.35) * 25));
    for (let i = 0; i < edgeCount; i++) {
      edges.push({
        from: `e${i}`, to: `e${(i + 3) % count}`,
        strength: lerp(0, 0.35, (p - 0.35) * 2.5),
        color: C.dim, animated: true, trail: p > 0.6,
      });
    }
  }

  const nebulae: NebulaCloud[] = [
    { cx: 0.3, cy: 0.3, radius: 0.35, color: C.primary, intensity: lerp(0.3, 0.8, ep), rotation: 0.2, depth: 0.1 },
    { cx: 0.7, cy: 0.6, radius: 0.3, color: C.business, intensity: lerp(0.2, 0.5, ep), rotation: -0.3, depth: 0.15 },
  ];

  return {
    camera: { x: lerp(-30, 0, ep), y: lerp(15, 0, ep), zoom: lerp(0.85, 1.02, ep), depth: lerp(0.2, 0.55, ep), rotation: lerp(0.03, 0, ep) },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.5, radius: 0.45, color: C.primary, intensity: lerp(0, 0.6, ep), depth: 0.2 },
      { cx: 0.35, cy: 0.4, radius: 0.2, color: C.business, intensity: lerp(0, 0.3, ep), depth: 0.3 },
    ],
    lighting: { ambientColor: C.primary, ambientIntensity: 0.35, focusX: 0.5, focusY: 0.48, focusRadius: 0.65, focusIntensity: lerp(0.1, 0.55, ep), vignette: 0.7 },
    particles: PARTICLES_EMERGENCE,
    nebulae,
    gridLines: ep > 0.4,
    gridOpacity: lerp(0, 0.08, Math.max(0, ep - 0.4) * 2.5),
  };
}

/* ═══ Scene 2: Constraint Discovery — the binding constraint pulses to life ═══ */
function sceneConstraint(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  const nodes: StructuralNode[] = [
    {
      id: "c0", x: 0.5, y: 0.44,
      radius: lerp(2.5, 5, ep) * d.bindingConstraintStrength,
      depth: 0.95,
      color: C.red, glowColor: C.redLt,
      glowIntensity: lerp(0.1, 0.9, ep),
      opacity: lerp(0.2, 1, ep),
      label: "Binding Constraint",
      pulse: 1.2, ring: true, lensFlare: ep > 0.6,
    },
  ];

  // Orbiting secondary signals
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + t * 0.18;
    const dist = lerp(0.38, 0.2, ep) + Math.sin(t * 0.5 + i) * 0.02;
    const isService = i % 3 === 0;
    nodes.push({
      id: `cs${i}`,
      x: 0.5 + Math.cos(angle) * dist,
      y: 0.44 + Math.sin(angle) * dist * 0.65,
      radius: lerp(0.8, 1.5, ep),
      depth: 0.4 + i * 0.07,
      color: isService ? C.service : C.amber,
      glowColor: isService ? C.serviceLt : C.amberLt,
      glowIntensity: lerp(0.1, 0.45, ep),
      opacity: lerp(0.15, 0.8, ep),
    });
  }

  const edges: CausalEdge[] = nodes.slice(1).map(n => ({
    from: n.id, to: "c0",
    strength: lerp(0.05, 0.5, ep),
    color: C.red, animated: true, trail: ep > 0.5,
  }));

  const nebulae: NebulaCloud[] = [
    { cx: 0.5, cy: 0.44, radius: 0.25, color: C.red, intensity: ep * d.bindingConstraintStrength, rotation: t * 0.05, depth: 0.3 },
  ];

  return {
    camera: { x: 0, y: lerp(5, 0, ep), zoom: lerp(1, 1.18, ep), depth: 0.65, rotation: lerp(0.01, 0, ep) },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.44, radius: lerp(0.08, 0.4, ep), color: C.red, intensity: d.bindingConstraintStrength * ep, depth: 0.4 },
      { cx: 0.5, cy: 0.44, radius: lerp(0.04, 0.18, ep), color: C.service, intensity: 0.3 * ep, depth: 0.6 },
    ],
    lighting: { ambientColor: C.red, ambientIntensity: lerp(0.1, 0.3, ep), focusX: 0.5, focusY: 0.44, focusRadius: 0.4, focusIntensity: lerp(0.2, 0.75, ep), vignette: 0.8 },
    particles: PARTICLES_CONSTRAINT,
    nebulae,
  };
}

/* ═══ Scene 3: Causal Structure — chain reveals root → leverage → outcome ═══ */
function sceneCausal(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutQuint(p);
  const chain = [
    { label: "Root Cause",   x: 0.10, y: 0.52, color: C.red,     glow: C.redLt },
    { label: "Friction",     x: 0.24, y: 0.36, color: C.service,  glow: C.serviceLt },
    { label: "Mechanism",    x: 0.40, y: 0.56, color: C.amber,    glow: C.amberLt },
    { label: "Constraint",   x: 0.56, y: 0.38, color: C.red,      glow: C.redLt },
    { label: "Leverage",     x: 0.72, y: 0.52, color: C.green,    glow: C.greenLt },
    { label: "Outcome",      x: 0.90, y: 0.44, color: C.primary,  glow: C.primaryLt },
  ];

  const visibleCount = Math.floor(lerp(0, chain.length, ep));
  const nodes: StructuralNode[] = chain.slice(0, visibleCount).map((c, i) => ({
    id: `ch${i}`,
    x: c.x,
    y: c.y + Math.sin(t * 0.4 + i * 1.1) * 0.012,
    radius: 2.2,
    depth: 0.45 + i * 0.09,
    color: c.color,
    glowColor: c.glow,
    glowIntensity: lerp(0.2, 0.65, ep) * d.signalDensity,
    opacity: lerp(0.3, 1, ep),
    label: c.label,
    pulse: i === 3 ? 1.6 : i === 4 ? 1.0 : 0,
    ring: i === 3 || i === 5,
    lensFlare: i === 5 && ep > 0.8,
  }));

  const edges: CausalEdge[] = [];
  for (let i = 0; i < visibleCount - 1; i++) {
    edges.push({
      from: `ch${i}`, to: `ch${i + 1}`,
      strength: 0.45 + d.signalDensity * 0.35,
      color: chain[i].color, animated: true,
      dashOffset: t * 45, trail: true,
    });
  }

  const nebulae: NebulaCloud[] = [
    { cx: 0.56, cy: 0.38, radius: 0.18, color: C.red, intensity: 0.5 * ep, rotation: 0.4, depth: 0.2 },
    { cx: 0.72, cy: 0.52, radius: 0.15, color: C.green, intensity: 0.4 * ep, rotation: -0.2, depth: 0.25 },
  ];

  return {
    camera: { x: lerp(-50, 0, easeOutQuart(p)), y: 0, zoom: 1, depth: 0.5, rotation: 0 },
    nodes, edges,
    fields: [
      { cx: 0.56, cy: 0.38, radius: 0.22, color: C.red, intensity: 0.45 * ep, depth: 0.3 },
      { cx: 0.72, cy: 0.52, radius: 0.18, color: C.green, intensity: 0.35 * ep, depth: 0.55 },
      { cx: 0.90, cy: 0.44, radius: 0.15, color: C.primary, intensity: 0.3 * ep, depth: 0.5 },
    ],
    lighting: { ambientColor: C.amber, ambientIntensity: 0.2, focusX: lerp(0.15, 0.75, ep), focusY: 0.45, focusRadius: 0.5, focusIntensity: 0.55, vignette: 0.6 },
    particles: PARTICLES_CAUSAL,
    nebulae,
    gridLines: true,
    gridOpacity: 0.05,
  };
}

/* ═══ Scene 4: Decision Formation — signals converge ═══ */
function sceneDecision(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  const count = 10;
  const nodes: StructuralNode[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = lerp(0.38, 0.06, ep);
    const colorIdx = i % 3;
    const color = colorIdx === 0 ? C.green : colorIdx === 1 ? C.primary : C.business;
    const glow = colorIdx === 0 ? C.greenLt : colorIdx === 1 ? C.primaryLt : C.businessLt;

    nodes.push({
      id: `d${i}`,
      x: 0.5 + Math.cos(angle + t * 0.1 * (1 - ep * 0.8)) * dist,
      y: 0.47 + Math.sin(angle + t * 0.1 * (1 - ep * 0.8)) * dist * 0.75,
      radius: lerp(1, 2, ep),
      depth: 0.35 + i * 0.06,
      color, glowColor: glow,
      glowIntensity: lerp(0.2, 0.55, ep) * d.confidenceScore,
      opacity: lerp(0.4, 0.9, ep),
    });
  }

  // Central decision core
  nodes.push({
    id: "decision", x: 0.5, y: 0.47,
    radius: lerp(1, 4.5, easeOutExpo(p)),
    depth: 1, color: C.green, glowColor: C.greenLt,
    glowIntensity: lerp(0.1, 0.95, ep) * d.confidenceScore,
    opacity: lerp(0.1, 1, ep),
    label: p > 0.55 ? `Confidence: ${Math.round(d.confidenceScore * 100)}%` : undefined,
    pulse: 1.0, ring: true, lensFlare: ep > 0.7,
  });

  const edges: CausalEdge[] = nodes.slice(0, count).map(n => ({
    from: n.id, to: "decision",
    strength: lerp(0.08, 0.55, ep),
    color: C.green, animated: true, trail: ep > 0.4,
  }));

  const nebulae: NebulaCloud[] = [
    { cx: 0.5, cy: 0.47, radius: lerp(0.1, 0.35, ep), color: C.green, intensity: ep * d.confidenceScore, rotation: t * 0.03, depth: 0.2 },
    { cx: 0.5, cy: 0.47, radius: lerp(0.05, 0.2, ep), color: C.primary, intensity: ep * 0.4, rotation: -t * 0.02, depth: 0.35 },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1, 1.22, ep), depth: 0.7, rotation: lerp(0.005, 0, ep) },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.47, radius: lerp(0.08, 0.35, ep), color: C.green, intensity: ep * d.confidenceScore, depth: 0.45 },
    ],
    lighting: { ambientColor: C.green, ambientIntensity: lerp(0.08, 0.35, ep), focusX: 0.5, focusY: 0.47, focusRadius: 0.38, focusIntensity: lerp(0.25, 0.85, ep), vignette: 0.75 },
    particles: PARTICLES_DECISION,
    nebulae,
  };
}

/* ═══ Scene 5: Strategic Outcome — the verdict materializes ═══ */
function sceneOutcome(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeOutExpo(p);
  const nodes: StructuralNode[] = [
    {
      id: "out", x: 0.5, y: 0.44,
      radius: lerp(2, 5.5, ep), depth: 1,
      color: C.primary, glowColor: C.primaryLt,
      glowIntensity: lerp(0.2, 0.9, ep), opacity: ep,
      label: `Decision Grade: ${Math.round(d.decisionGrade * 100)}`,
      pulse: 0.7, ring: true, lensFlare: true,
    },
    {
      id: "s1", x: 0.22, y: 0.33, radius: 1.8, depth: 0.6,
      color: C.green, glowColor: C.greenLt,
      glowIntensity: 0.5, opacity: ep * 0.85,
      label: "Stress-Tested", ring: true,
    },
    {
      id: "s2", x: 0.78, y: 0.33, radius: 1.8, depth: 0.6,
      color: C.green, glowColor: C.greenLt,
      glowIntensity: 0.5, opacity: ep * 0.85,
      label: "Evidence-Bounded", ring: true,
    },
    {
      id: "s3", x: 0.5, y: 0.72, radius: 1.8, depth: 0.5,
      color: C.business, glowColor: C.businessLt,
      glowIntensity: 0.5, opacity: ep * 0.85,
      label: "Traceable",
    },
  ];

  const edges: CausalEdge[] = [
    { from: "s1", to: "out", strength: lerp(0.1, 0.55, ep), color: C.green, animated: false, trail: true },
    { from: "s2", to: "out", strength: lerp(0.1, 0.55, ep), color: C.green, animated: false, trail: true },
    { from: "s3", to: "out", strength: lerp(0.1, 0.55, ep), color: C.business, animated: false, trail: true },
  ];

  const nebulae: NebulaCloud[] = [
    { cx: 0.5, cy: 0.44, radius: 0.3, color: C.primary, intensity: ep * 0.7, rotation: t * 0.02, depth: 0.15 },
    { cx: 0.5, cy: 0.44, radius: 0.18, color: C.business, intensity: ep * 0.4, rotation: -t * 0.03, depth: 0.25 },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.2, 1.0, ep), depth: 0.6, rotation: 0 },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.44, radius: 0.35, color: C.primary, intensity: 0.5 * ep, depth: 0.3 },
    ],
    lighting: { ambientColor: C.primary, ambientIntensity: 0.35, focusX: 0.5, focusY: 0.44, focusRadius: 0.5, focusIntensity: lerp(0.3, 0.75, ep), vignette: 0.65 },
    particles: PARTICLES_OUTCOME,
    nebulae,
  };
}

/* ═══ Scene 6: Platform Identity — the full system shines ═══ */
function sceneIdentity(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  // Constellation of platform capabilities
  const ring = [
    { angle: 0,   color: C.primary, glow: C.primaryLt },
    { angle: 60,  color: C.service, glow: C.serviceLt },
    { angle: 120, color: C.business, glow: C.businessLt },
    { angle: 180, color: C.green, glow: C.greenLt },
    { angle: 240, color: C.primary, glow: C.primaryLt },
    { angle: 300, color: C.business, glow: C.businessLt },
  ];

  const nodes: StructuralNode[] = [
    {
      id: "core", x: 0.5, y: 0.47,
      radius: lerp(2, 6, ep), depth: 1,
      color: C.primary, glowColor: C.primaryLt,
      glowIntensity: lerp(0.3, 1, ep),
      opacity: 1, pulse: 0.5,
      ring: true, lensFlare: true,
    },
  ];

  const dist = lerp(0.3, 0.22, ep);
  ring.forEach((r, i) => {
    const a = (r.angle * Math.PI / 180) + t * 0.06;
    nodes.push({
      id: `r${i}`,
      x: 0.5 + Math.cos(a) * dist,
      y: 0.47 + Math.sin(a) * dist * 0.7,
      radius: lerp(0.5, 1.5, ep),
      depth: 0.6,
      color: r.color, glowColor: r.glow,
      glowIntensity: lerp(0, 0.5, ep),
      opacity: lerp(0, 0.85, ep),
    });
  });

  const edges: CausalEdge[] = ring.map((_, i) => ({
    from: `r${i}`, to: "core",
    strength: lerp(0, 0.4, ep),
    color: ring[i].color, animated: false, trail: ep > 0.3,
  }));

  const nebulae: NebulaCloud[] = [
    { cx: 0.5, cy: 0.47, radius: lerp(0.15, 0.45, ep), color: C.primary, intensity: ep * 0.8, rotation: t * 0.02, depth: 0.1 },
    { cx: 0.5, cy: 0.47, radius: lerp(0.08, 0.25, ep), color: C.business, intensity: ep * 0.5, rotation: -t * 0.015, depth: 0.2 },
    { cx: 0.5, cy: 0.47, radius: lerp(0.05, 0.18, ep), color: C.service, intensity: ep * 0.35, rotation: t * 0.025, depth: 0.3 },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1, 0.92, ep), depth: 0.5, rotation: lerp(0, -0.005, ep) },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.47, radius: lerp(0.2, 0.5, ep), color: C.primary, intensity: ep * 0.65, depth: 0.3 },
      { cx: 0.5, cy: 0.47, radius: lerp(0.1, 0.3, ep), color: C.business, intensity: ep * 0.35, depth: 0.5 },
    ],
    lighting: { ambientColor: C.primary, ambientIntensity: lerp(0.1, 0.45, ep), focusX: 0.5, focusY: 0.47, focusRadius: 0.55, focusIntensity: lerp(0.3, 0.95, ep), vignette: 0.6 },
    particles: PARTICLES_IDENTITY,
    nebulae,
    gridLines: true,
    gridOpacity: lerp(0, 0.06, ep),
  };
}
