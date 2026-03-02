/* ═══════════════════════════════════════════════════════════════
   SCENE DEFINITIONS — 6 cinematic scenes
   Each returns a SceneFrame given scene-local progress (0-1)
   and runtime data bindings.
   ═══════════════════════════════════════════════════════════════ */

import type { SceneFrame, StructuralNode, CausalEdge, ConstraintField } from "./canvasEngine";
import { lerp, easeInOutCubic, easeOutExpo } from "./canvasEngine";

export interface DataBindings {
  bindingConstraintStrength: number; // 0-1
  confidenceScore: number; // 0-1
  signalDensity: number; // 0-1
  decisionGrade: number; // 0-1
  lensWeight: number; // 0-1
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

const C = {
  red: "#d94040",
  green: "#3db87a",
  blue: "#4a6cf7",
  amber: "#d4983b",
  violet: "#9b6dff",
  white: "#c8d2e6",
  dim: "#3a4560",
};

export function getActiveScene(pct: number): SceneSpec {
  return SCENE_TIMELINE.find(s => pct >= s.startPct && pct < s.endPct) || SCENE_TIMELINE[SCENE_TIMELINE.length - 1];
}

export function buildSceneFrame(
  sceneId: SceneId,
  progress: number, // 0-1 within scene
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

/* ── Scene 1: System Emergence — noise → structure ── */
function sceneEmergence(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeOutExpo(p);
  const count = 20;
  const nodes: StructuralNode[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const spread = lerp(0.8, 0.3, ep);
    const cx = 0.5 + Math.cos(angle + t * 0.1) * spread * (0.3 + (i % 3) * 0.05);
    const cy = 0.5 + Math.sin(angle + t * 0.15) * spread * (0.25 + (i % 2) * 0.05);

    nodes.push({
      id: `e${i}`,
      x: cx,
      y: cy,
      radius: lerp(0.8, 1.5, ep),
      depth: 0.3 + (i % 5) * 0.15,
      color: i % 4 === 0 ? C.blue : i % 4 === 1 ? C.dim : i % 4 === 2 ? C.amber : C.dim,
      glowColor: C.blue,
      glowIntensity: lerp(0, 0.4, ep) * (i % 3 === 0 ? 1 : 0.2),
      opacity: lerp(0.1, 0.7, ep),
      pulse: i % 5 === 0 ? 2 : 0,
    });
  }

  // Edges emerge as structure forms
  const edges: CausalEdge[] = [];
  if (p > 0.4) {
    for (let i = 0; i < Math.min(count - 1, Math.floor((p - 0.4) * 20)); i++) {
      edges.push({
        from: `e${i}`, to: `e${(i + 3) % count}`,
        strength: lerp(0, 0.3, (p - 0.4) * 2),
        color: C.dim, animated: true,
      });
    }
  }

  return {
    camera: { x: lerp(-20, 0, ep), y: lerp(10, 0, ep), zoom: lerp(0.9, 1, ep), depth: lerp(0.2, 0.5, ep), rotation: lerp(0.02, 0, ep) },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.5, radius: 0.4, color: C.blue, intensity: lerp(0, 0.5, ep), depth: 0.2 },
    ],
    lighting: { ambientColor: C.blue, ambientIntensity: 0.3, focusX: 0.5, focusY: 0.5, focusRadius: 0.6, focusIntensity: lerp(0.1, 0.5, ep) },
  };
}

/* ── Scene 2: Constraint Identification ── */
function sceneConstraint(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  const nodes: StructuralNode[] = [
    { id: "c0", x: 0.5, y: 0.45, radius: lerp(2, 4, ep) * d.bindingConstraintStrength, depth: 0.9,
      color: C.red, glowColor: C.red, glowIntensity: lerp(0, 0.8, ep), opacity: lerp(0.3, 1, ep),
      label: "Binding Constraint", pulse: 1.5 },
  ];

  // Orbiting secondary constraints
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + t * 0.2;
    const dist = lerp(0.35, 0.22, ep);
    nodes.push({
      id: `cs${i}`, x: 0.5 + Math.cos(angle) * dist, y: 0.45 + Math.sin(angle) * dist * 0.7,
      radius: 1.2, depth: 0.5 + i * 0.08, color: C.amber, glowColor: C.amber,
      glowIntensity: 0.3, opacity: lerp(0.2, 0.7, ep),
    });
  }

  const edges: CausalEdge[] = nodes.slice(1).map(n => ({
    from: n.id, to: "c0", strength: lerp(0.1, 0.5, ep), color: C.red, animated: true,
  }));

  return {
    camera: { x: 0, y: 0, zoom: lerp(1, 1.15, ep), depth: 0.6, rotation: 0 },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.45, radius: lerp(0.1, 0.35, ep), color: C.red, intensity: d.bindingConstraintStrength * ep, depth: 0.4 },
    ],
    lighting: { ambientColor: C.red, ambientIntensity: 0.2, focusX: 0.5, focusY: 0.45, focusRadius: 0.4, focusIntensity: lerp(0.2, 0.7, ep) },
  };
}

/* ── Scene 3: Causal Structure ── */
function sceneCausal(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  const chain = [
    { label: "Root Cause", x: 0.12, y: 0.5, color: C.red },
    { label: "Friction", x: 0.28, y: 0.35, color: C.amber },
    { label: "Mechanism", x: 0.44, y: 0.55, color: C.amber },
    { label: "Constraint", x: 0.58, y: 0.4, color: C.red },
    { label: "Leverage", x: 0.72, y: 0.5, color: C.green },
    { label: "Outcome", x: 0.88, y: 0.45, color: C.blue },
  ];

  const visibleCount = Math.floor(lerp(0, chain.length, ep));
  const nodes: StructuralNode[] = chain.slice(0, visibleCount).map((c, i) => ({
    id: `ch${i}`, x: c.x, y: c.y + Math.sin(t * 0.5 + i) * 0.015,
    radius: 2, depth: 0.5 + i * 0.08, color: c.color, glowColor: c.color,
    glowIntensity: 0.5 * d.signalDensity, opacity: lerp(0.4, 1, ep), label: c.label,
    pulse: i === 3 ? 1.8 : 0,
  }));

  const edges: CausalEdge[] = [];
  for (let i = 0; i < visibleCount - 1; i++) {
    edges.push({
      from: `ch${i}`, to: `ch${i + 1}`,
      strength: 0.5 + d.signalDensity * 0.3,
      color: chain[i].color, animated: true, dashOffset: t * 40,
    });
  }

  return {
    camera: { x: lerp(-40, 0, ep), y: 0, zoom: 1, depth: 0.5, rotation: 0 },
    nodes, edges,
    fields: [
      { cx: 0.58, cy: 0.4, radius: 0.2, color: C.red, intensity: 0.4 * ep, depth: 0.3 },
      { cx: 0.72, cy: 0.5, radius: 0.15, color: C.green, intensity: 0.3 * ep, depth: 0.6 },
    ],
    lighting: { ambientColor: C.amber, ambientIntensity: 0.15, focusX: lerp(0.2, 0.7, ep), focusY: 0.45, focusRadius: 0.5, focusIntensity: 0.5 },
  };
}

/* ── Scene 4: Decision Formation — convergence ── */
function sceneDecision(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);

  // Signals converging to center
  const count = 8;
  const nodes: StructuralNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = lerp(0.35, 0.08, ep);
    nodes.push({
      id: `d${i}`, x: 0.5 + Math.cos(angle) * dist, y: 0.48 + Math.sin(angle) * dist * 0.8,
      radius: lerp(1, 1.8, ep), depth: 0.4 + i * 0.07,
      color: i < 3 ? C.green : i < 6 ? C.blue : C.amber,
      glowColor: C.green, glowIntensity: lerp(0.2, 0.6, ep) * d.confidenceScore,
      opacity: lerp(0.5, 1, ep),
    });
  }

  // Central decision node
  nodes.push({
    id: "decision", x: 0.5, y: 0.48, radius: lerp(1, 3.5, ep),
    depth: 1, color: C.green, glowColor: C.green,
    glowIntensity: ep * d.confidenceScore, opacity: ep,
    label: p > 0.6 ? `Confidence: ${Math.round(d.confidenceScore * 100)}%` : undefined,
    pulse: 1.2,
  });

  const edges: CausalEdge[] = nodes.slice(0, count).map(n => ({
    from: n.id, to: "decision", strength: lerp(0.1, 0.6, ep), color: C.green, animated: true,
  }));

  return {
    camera: { x: 0, y: 0, zoom: lerp(1, 1.2, ep), depth: 0.7, rotation: 0 },
    nodes, edges,
    fields: [
      { cx: 0.5, cy: 0.48, radius: lerp(0.1, 0.3, ep), color: C.green, intensity: ep * d.confidenceScore, depth: 0.5 },
    ],
    lighting: { ambientColor: C.green, ambientIntensity: lerp(0.1, 0.35, ep), focusX: 0.5, focusY: 0.48, focusRadius: 0.35, focusIntensity: lerp(0.3, 0.8, ep) },
  };
}

/* ── Scene 5: Strategic Outcome ── */
function sceneOutcome(p: number, t: number, d: DataBindings): SceneFrame {
  const ep = easeOutExpo(p);
  const nodes: StructuralNode[] = [
    { id: "out", x: 0.5, y: 0.45, radius: 4, depth: 1, color: C.blue,
      glowColor: C.blue, glowIntensity: 0.7 * ep, opacity: ep,
      label: `Decision Grade: ${Math.round(d.decisionGrade * 100)}`, pulse: 0.8 },
    { id: "s1", x: 0.25, y: 0.35, radius: 1.5, depth: 0.6, color: C.green,
      glowColor: C.green, glowIntensity: 0.4, opacity: ep * 0.8, label: "Stress-Tested" },
    { id: "s2", x: 0.75, y: 0.35, radius: 1.5, depth: 0.6, color: C.green,
      glowColor: C.green, glowIntensity: 0.4, opacity: ep * 0.8, label: "Evidence-Bounded" },
    { id: "s3", x: 0.5, y: 0.7, radius: 1.5, depth: 0.5, color: C.violet,
      glowColor: C.violet, glowIntensity: 0.4, opacity: ep * 0.8, label: "Traceable" },
  ];

  const edges: CausalEdge[] = [
    { from: "s1", to: "out", strength: 0.5, color: C.green, animated: false },
    { from: "s2", to: "out", strength: 0.5, color: C.green, animated: false },
    { from: "s3", to: "out", strength: 0.5, color: C.violet, animated: false },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1.2, 1, ep), depth: 0.6, rotation: 0 },
    nodes, edges, fields: [],
    lighting: { ambientColor: C.blue, ambientIntensity: 0.3, focusX: 0.5, focusY: 0.45, focusRadius: 0.5, focusIntensity: 0.6 * ep },
  };
}

/* ── Scene 6: Platform Identity — full system reveal ── */
function sceneIdentity(p: number, t: number, _d: DataBindings): SceneFrame {
  const ep = easeInOutCubic(p);
  // Sparse, confident composition
  const nodes: StructuralNode[] = [
    { id: "core", x: 0.5, y: 0.48, radius: lerp(2, 5, ep), depth: 1,
      color: C.blue, glowColor: C.blue, glowIntensity: lerp(0.3, 0.9, ep),
      opacity: 1, pulse: 0.6 },
  ];

  return {
    camera: { x: 0, y: 0, zoom: lerp(1, 0.95, ep), depth: 0.5, rotation: 0 },
    nodes, edges: [],
    fields: [
      { cx: 0.5, cy: 0.48, radius: lerp(0.2, 0.5, ep), color: C.blue, intensity: ep * 0.6, depth: 0.3 },
      { cx: 0.5, cy: 0.48, radius: lerp(0.1, 0.25, ep), color: C.violet, intensity: ep * 0.3, depth: 0.6 },
    ],
    lighting: { ambientColor: C.blue, ambientIntensity: lerp(0.1, 0.4, ep), focusX: 0.5, focusY: 0.48, focusRadius: 0.5, focusIntensity: lerp(0.3, 0.9, ep) },
  };
}
