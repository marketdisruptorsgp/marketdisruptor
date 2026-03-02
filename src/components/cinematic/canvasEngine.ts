/* ═══════════════════════════════════════════════════════════════
   CANVAS CINEMATIC ENGINE — Core rendering primitives
   Depth-layered 2D canvas with camera transforms, structural
   node/edge systems, constraint fields, and environmental lighting.
   ═══════════════════════════════════════════════════════════════ */

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  depth: number; // 0-1 parallax depth
  rotation: number; // radians
}

export interface StructuralNode {
  id: string;
  x: number; // 0-1 normalized
  y: number;
  radius: number;
  depth: number; // 0=far, 1=near
  color: string;
  glowColor: string;
  glowIntensity: number; // 0-1
  label?: string;
  opacity: number;
  pulse?: number; // pulse speed, 0 = none
}

export interface CausalEdge {
  from: string;
  to: string;
  strength: number; // 0-1
  color: string;
  animated: boolean;
  dashOffset?: number;
}

export interface ConstraintField {
  cx: number;
  cy: number;
  radius: number;
  color: string;
  intensity: number;
  depth: number;
}

export interface LightingState {
  ambientColor: string;
  ambientIntensity: number;
  focusX: number;
  focusY: number;
  focusRadius: number;
  focusIntensity: number;
}

export interface SceneFrame {
  camera: CameraState;
  nodes: StructuralNode[];
  edges: CausalEdge[];
  fields: ConstraintField[];
  lighting: LightingState;
}

/* ── Interpolation helpers ── */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(a: string, b: string, t: number): string {
  // Simple HSL string interpolation — expects "h s% l%" format
  return t < 0.5 ? a : b;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* ── Canvas Renderer ── */

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: SceneFrame,
  time: number
) {
  const { camera, nodes, edges, fields, lighting } = frame;
  const dpr = window.devicePixelRatio || 1;

  ctx.save();
  ctx.clearRect(0, 0, width * dpr, height * dpr);

  // Background
  ctx.fillStyle = "#0a0c14";
  ctx.fillRect(0, 0, width * dpr, height * dpr);

  // Apply camera
  const cx = width * dpr * 0.5;
  const cy = height * dpr * 0.5;
  ctx.translate(cx, cy);
  ctx.rotate(camera.rotation);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-cx + camera.x * dpr, -cy + camera.y * dpr);

  // Ambient lighting layer
  const ambGrad = ctx.createRadialGradient(
    (lighting.focusX * width) * dpr,
    (lighting.focusY * height) * dpr,
    0,
    (lighting.focusX * width) * dpr,
    (lighting.focusY * height) * dpr,
    lighting.focusRadius * Math.max(width, height) * dpr
  );
  ambGrad.addColorStop(0, `rgba(${hexToRgb(lighting.ambientColor)}, ${lighting.focusIntensity * 0.15})`);
  ambGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ambGrad;
  ctx.fillRect(-cx, -cy, width * dpr * 3, height * dpr * 3);

  // Constraint fields (background depth)
  for (const field of fields.filter(f => f.depth < 0.5)) {
    renderField(ctx, field, width * dpr, height * dpr, camera.depth);
  }

  // Edges
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;
    renderEdge(ctx, fromNode, toNode, edge, width * dpr, height * dpr, time, camera.depth);
  }

  // Constraint fields (foreground depth)
  for (const field of fields.filter(f => f.depth >= 0.5)) {
    renderField(ctx, field, width * dpr, height * dpr, camera.depth);
  }

  // Nodes (sorted by depth — far first)
  const sorted = [...nodes].sort((a, b) => a.depth - b.depth);
  for (const node of sorted) {
    renderNode(ctx, node, width * dpr, height * dpr, time, camera.depth);
  }

  ctx.restore();
}

function renderNode(
  ctx: CanvasRenderingContext2D,
  node: StructuralNode,
  w: number, h: number,
  time: number,
  cameraDepth: number
) {
  const parallax = 1 + (node.depth - 0.5) * cameraDepth * 0.3;
  const x = node.x * w * parallax;
  const y = node.y * h * parallax;
  const r = node.radius * Math.min(w, h) * 0.01 * (0.6 + node.depth * 0.4);

  const pulseScale = node.pulse ? 1 + Math.sin(time * node.pulse) * 0.15 : 1;
  const finalR = r * pulseScale;

  // Glow
  if (node.glowIntensity > 0) {
    const glow = ctx.createRadialGradient(x, y, finalR * 0.5, x, y, finalR * 4);
    glow.addColorStop(0, `rgba(${hexToRgb(node.glowColor)}, ${node.glowIntensity * node.opacity * 0.4})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, finalR * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Core
  ctx.beginPath();
  ctx.arc(x, y, finalR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${hexToRgb(node.color)}, ${node.opacity})`;
  ctx.fill();

  // Label
  if (node.label && node.opacity > 0.3) {
    ctx.font = `${Math.max(10, finalR * 1.2)}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = `rgba(200, 210, 230, ${node.opacity * 0.7})`;
    ctx.textAlign = "center";
    ctx.fillText(node.label, x, y + finalR + Math.max(12, finalR * 1.5));
  }
}

function renderEdge(
  ctx: CanvasRenderingContext2D,
  from: StructuralNode, to: StructuralNode,
  edge: CausalEdge,
  w: number, h: number,
  time: number,
  cameraDepth: number
) {
  const pFrom = 1 + (from.depth - 0.5) * cameraDepth * 0.3;
  const pTo = 1 + (to.depth - 0.5) * cameraDepth * 0.3;
  const x1 = from.x * w * pFrom;
  const y1 = from.y * h * pFrom;
  const x2 = to.x * w * pTo;
  const y2 = to.y * h * pTo;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(${hexToRgb(edge.color)}, ${edge.strength * 0.6})`;
  ctx.lineWidth = edge.strength * 2;

  if (edge.animated) {
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -(edge.dashOffset ?? time * 30);
  } else {
    ctx.setLineDash([]);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

function renderField(
  ctx: CanvasRenderingContext2D,
  field: ConstraintField,
  w: number, h: number,
  cameraDepth: number
) {
  const parallax = 1 + (field.depth - 0.5) * cameraDepth * 0.2;
  const x = field.cx * w * parallax;
  const y = field.cy * h * parallax;
  const r = field.radius * Math.max(w, h);

  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${hexToRgb(field.color)}, ${field.intensity * 0.12})`);
  grad.addColorStop(0.6, `rgba(${hexToRgb(field.color)}, ${field.intensity * 0.04})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Color utility ── */

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "100,130,200";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
