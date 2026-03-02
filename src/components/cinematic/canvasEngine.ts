/* ═══════════════════════════════════════════════════════════════
   CANVAS CINEMATIC ENGINE — World-class rendering primitives
   Depth-layered 2D canvas with particles, bloom, motion trails,
   nebula clouds, vignette, lens flares, and environmental lighting.
   ═══════════════════════════════════════════════════════════════ */

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  depth: number;
  rotation: number;
}

export interface StructuralNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  depth: number;
  color: string;
  glowColor: string;
  glowIntensity: number;
  label?: string;
  opacity: number;
  pulse?: number;
  ring?: boolean;       // outer ring effect
  lensFlare?: boolean;  // bright flare
}

export interface CausalEdge {
  from: string;
  to: string;
  strength: number;
  color: string;
  animated: boolean;
  dashOffset?: number;
  trail?: boolean; // glowing motion trail
}

export interface ConstraintField {
  cx: number;
  cy: number;
  radius: number;
  color: string;
  intensity: number;
  depth: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  depth: number;
}

export interface NebulaCloud {
  cx: number;
  cy: number;
  radius: number;
  color: string;
  intensity: number;
  rotation: number;
  depth: number;
}

export interface LightingState {
  ambientColor: string;
  ambientIntensity: number;
  focusX: number;
  focusY: number;
  focusRadius: number;
  focusIntensity: number;
  vignette?: number; // 0-1
}

export interface SceneFrame {
  camera: CameraState;
  nodes: StructuralNode[];
  edges: CausalEdge[];
  fields: ConstraintField[];
  lighting: LightingState;
  particles?: Particle[];
  nebulae?: NebulaCloud[];
  gridLines?: boolean;
  gridOpacity?: number;
}

/* ── Interpolation helpers ── */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(a: string, b: string, t: number): string {
  return t < 0.5 ? a : b;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/* ── Seeded particle generation ── */
export function generateParticles(count: number, seed: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = seed + i * 137.508;
    particles.push({
      x: (Math.sin(s * 0.1) * 0.5 + 0.5) * 0.9 + 0.05,
      y: (Math.cos(s * 0.13) * 0.5 + 0.5) * 0.9 + 0.05,
      vx: Math.sin(s * 0.7) * 0.0003,
      vy: Math.cos(s * 0.9) * 0.0002,
      size: 0.5 + Math.abs(Math.sin(s * 0.3)) * 1.5,
      color: i % 5 === 0 ? "#4b68f5" : i % 7 === 0 ? "#9030ea" : "#c8d2e6",
      opacity: 0.15 + Math.abs(Math.sin(s * 0.5)) * 0.4,
      life: 1,
      depth: Math.abs(Math.sin(s * 0.2)) * 0.8 + 0.1,
    });
  }
  return particles;
}

/* ── Canvas Renderer ── */

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: SceneFrame,
  time: number
) {
  const { camera, nodes, edges, fields, lighting, particles, nebulae, gridLines, gridOpacity } = frame;
  const dpr = window.devicePixelRatio || 1;
  const W = width * dpr;
  const H = height * dpr;

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Deep background gradient
  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.5, W * 0.8);
  bgGrad.addColorStop(0, "#0d1020");
  bgGrad.addColorStop(0.5, "#080b16");
  bgGrad.addColorStop(1, "#040610");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Apply camera
  const cx = W * 0.5;
  const cy = H * 0.5;
  ctx.translate(cx, cy);
  ctx.rotate(camera.rotation);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-cx + camera.x * dpr, -cy + camera.y * dpr);

  // Nebula clouds (deep background atmosphere)
  if (nebulae) {
    for (const neb of nebulae) {
      renderNebula(ctx, neb, W, H, time, camera.depth);
    }
  }

  // Grid lines
  if (gridLines && (gridOpacity ?? 0) > 0) {
    renderGrid(ctx, W, H, time, gridOpacity ?? 0.1, camera.depth);
  }

  // Ambient lighting layer
  const ambGrad = ctx.createRadialGradient(
    lighting.focusX * W, lighting.focusY * H, 0,
    lighting.focusX * W, lighting.focusY * H,
    lighting.focusRadius * Math.max(W, H)
  );
  ambGrad.addColorStop(0, `rgba(${hexToRgb(lighting.ambientColor)}, ${lighting.focusIntensity * 0.2})`);
  ambGrad.addColorStop(0.6, `rgba(${hexToRgb(lighting.ambientColor)}, ${lighting.focusIntensity * 0.05})`);
  ambGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ambGrad;
  ctx.fillRect(-cx, -cy, W * 3, H * 3);

  // Constraint fields (background)
  for (const field of fields.filter(f => f.depth < 0.5)) {
    renderField(ctx, field, W, H, camera.depth);
  }

  // Particles (background layer)
  if (particles) {
    for (const p of particles.filter(pt => pt.depth < 0.5)) {
      renderParticle(ctx, p, W, H, time, camera.depth);
    }
  }

  // Edges
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;
    renderEdge(ctx, fromNode, toNode, edge, W, H, time, camera.depth);
  }

  // Constraint fields (foreground)
  for (const field of fields.filter(f => f.depth >= 0.5)) {
    renderField(ctx, field, W, H, camera.depth);
  }

  // Particles (foreground layer)
  if (particles) {
    for (const p of particles.filter(pt => pt.depth >= 0.5)) {
      renderParticle(ctx, p, W, H, time, camera.depth);
    }
  }

  // Nodes (sorted by depth)
  const sorted = [...nodes].sort((a, b) => a.depth - b.depth);
  for (const node of sorted) {
    renderNode(ctx, node, W, H, time, camera.depth);
  }

  ctx.restore();

  // Vignette (post-camera, full screen)
  if (lighting.vignette && lighting.vignette > 0) {
    renderVignette(ctx, W, H, lighting.vignette);
  }
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
  const pulseScale = node.pulse ? 1 + Math.sin(time * node.pulse) * 0.12 : 1;
  const finalR = r * pulseScale;

  // Outer atmosphere glow (larger, softer)
  if (node.glowIntensity > 0.3) {
    const outerGlow = ctx.createRadialGradient(x, y, finalR, x, y, finalR * 8);
    outerGlow.addColorStop(0, `rgba(${hexToRgb(node.glowColor)}, ${node.glowIntensity * node.opacity * 0.15})`);
    outerGlow.addColorStop(0.5, `rgba(${hexToRgb(node.glowColor)}, ${node.glowIntensity * node.opacity * 0.04})`);
    outerGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, finalR * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inner glow
  if (node.glowIntensity > 0) {
    const glow = ctx.createRadialGradient(x, y, finalR * 0.3, x, y, finalR * 3.5);
    glow.addColorStop(0, `rgba(${hexToRgb(node.glowColor)}, ${node.glowIntensity * node.opacity * 0.5})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, finalR * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ring effect
  if (node.ring) {
    const ringR = finalR * 2.2 + Math.sin(time * 0.8) * finalR * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(node.glowColor)}, ${node.opacity * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const ringR2 = finalR * 3.2 + Math.sin(time * 0.5 + 1) * finalR * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, ringR2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(node.glowColor)}, ${node.opacity * 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Core sphere with highlight
  const coreGrad = ctx.createRadialGradient(
    x - finalR * 0.3, y - finalR * 0.3, finalR * 0.1,
    x, y, finalR
  );
  coreGrad.addColorStop(0, `rgba(${hexToRgb(lightenHex(node.color, 40))}, ${node.opacity})`);
  coreGrad.addColorStop(0.7, `rgba(${hexToRgb(node.color)}, ${node.opacity})`);
  coreGrad.addColorStop(1, `rgba(${hexToRgb(node.color)}, ${node.opacity * 0.6})`);
  ctx.beginPath();
  ctx.arc(x, y, finalR, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // Lens flare
  if (node.lensFlare && node.opacity > 0.5) {
    renderLensFlare(ctx, x, y, finalR, node.glowColor, node.opacity, time);
  }

  // Label
  if (node.label && node.opacity > 0.3) {
    const fontSize = Math.max(11, finalR * 1.1);
    ctx.font = `600 ${fontSize}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = `rgba(200, 210, 230, ${node.opacity * 0.85})`;
    ctx.textAlign = "center";
    ctx.shadowColor = `rgba(${hexToRgb(node.glowColor)}, 0.3)`;
    ctx.shadowBlur = 8;
    ctx.fillText(node.label, x, y + finalR + Math.max(14, finalR * 1.6));
    ctx.shadowBlur = 0;
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

  // Motion trail glow
  if (edge.trail) {
    const trailGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    trailGrad.addColorStop(0, `rgba(${hexToRgb(edge.color)}, 0)`);
    const trailPos = (Math.sin(time * 1.5) * 0.5 + 0.5);
    trailGrad.addColorStop(Math.max(0, trailPos - 0.15), `rgba(${hexToRgb(edge.color)}, 0)`);
    trailGrad.addColorStop(trailPos, `rgba(${hexToRgb(edge.color)}, ${edge.strength * 0.6})`);
    trailGrad.addColorStop(Math.min(1, trailPos + 0.15), `rgba(${hexToRgb(edge.color)}, 0)`);
    trailGrad.addColorStop(1, `rgba(${hexToRgb(edge.color)}, 0)`);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = edge.strength * 6;
    ctx.stroke();
  }

  // Base edge
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  // Curved edges for more cinematic feel
  const midX = (x1 + x2) * 0.5 + (y2 - y1) * 0.08;
  const midY = (y1 + y2) * 0.5 - (x2 - x1) * 0.08;
  ctx.quadraticCurveTo(midX, midY, x2, y2);

  ctx.strokeStyle = `rgba(${hexToRgb(edge.color)}, ${edge.strength * 0.5})`;
  ctx.lineWidth = edge.strength * 2;

  if (edge.animated) {
    ctx.setLineDash([6, 14]);
    ctx.lineDashOffset = -(edge.dashOffset ?? time * 40);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Edge glow
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, x2, y2);
  ctx.strokeStyle = `rgba(${hexToRgb(edge.color)}, ${edge.strength * 0.12})`;
  ctx.lineWidth = edge.strength * 8;
  ctx.stroke();
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
  grad.addColorStop(0, `rgba(${hexToRgb(field.color)}, ${field.intensity * 0.15})`);
  grad.addColorStop(0.4, `rgba(${hexToRgb(field.color)}, ${field.intensity * 0.06})`);
  grad.addColorStop(0.7, `rgba(${hexToRgb(field.color)}, ${field.intensity * 0.02})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function renderParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  w: number, h: number,
  time: number,
  cameraDepth: number
) {
  const parallax = 1 + (p.depth - 0.5) * cameraDepth * 0.15;
  const drift = Math.sin(time * 0.3 + p.x * 10) * 0.005;
  const x = (p.x + p.vx * time * 60 + drift) * w * parallax;
  const y = (p.y + p.vy * time * 60) * h * parallax;
  const twinkle = 0.6 + Math.sin(time * 2 + p.x * 100) * 0.4;

  ctx.beginPath();
  ctx.arc(x, y, p.size * (0.8 + p.depth * 0.4), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.opacity * twinkle * p.life})`;
  ctx.fill();

  // Subtle glow on brighter particles
  if (p.opacity > 0.3) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 4);
    glow.addColorStop(0, `rgba(${hexToRgb(p.color)}, ${p.opacity * twinkle * 0.15})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, p.size * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderNebula(
  ctx: CanvasRenderingContext2D,
  neb: NebulaCloud,
  w: number, h: number,
  time: number,
  cameraDepth: number
) {
  const parallax = 1 + (neb.depth - 0.5) * cameraDepth * 0.1;
  const x = neb.cx * w * parallax;
  const y = neb.cy * h * parallax;
  const r = neb.radius * Math.max(w, h);
  const breathe = 1 + Math.sin(time * 0.15 + neb.cx * 5) * 0.08;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(neb.rotation + time * 0.01);

  // Multi-layer nebula for depth
  for (let layer = 0; layer < 3; layer++) {
    const lr = r * breathe * (1 - layer * 0.2);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, lr);
    const alpha = neb.intensity * (1 - layer * 0.3) * 0.08;
    grad.addColorStop(0, `rgba(${hexToRgb(neb.color)}, ${alpha})`);
    grad.addColorStop(0.5, `rgba(${hexToRgb(neb.color)}, ${alpha * 0.3})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, lr, lr * 0.65, layer * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  time: number,
  opacity: number,
  _cameraDepth: number
) {
  const spacing = 60;
  ctx.strokeStyle = `rgba(75, 104, 245, ${opacity * 0.15})`;
  ctx.lineWidth = 0.5;

  for (let x = 0; x < w; x += spacing) {
    const wave = Math.sin(time * 0.2 + x * 0.01) * 2;
    ctx.beginPath();
    ctx.moveTo(x, wave);
    ctx.lineTo(x, h + wave);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += spacing) {
    const wave = Math.sin(time * 0.15 + y * 0.01) * 2;
    ctx.beginPath();
    ctx.moveTo(wave, y);
    ctx.lineTo(w + wave, y);
    ctx.stroke();
  }
}

function renderLensFlare(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  r: number,
  color: string,
  opacity: number,
  time: number
) {
  const flareR = r * (3 + Math.sin(time * 0.7) * 0.5);

  // Horizontal streak
  const streakGrad = ctx.createLinearGradient(x - flareR * 3, y, x + flareR * 3, y);
  streakGrad.addColorStop(0, "rgba(0,0,0,0)");
  streakGrad.addColorStop(0.4, `rgba(${hexToRgb(color)}, ${opacity * 0.08})`);
  streakGrad.addColorStop(0.5, `rgba(${hexToRgb(color)}, ${opacity * 0.15})`);
  streakGrad.addColorStop(0.6, `rgba(${hexToRgb(color)}, ${opacity * 0.08})`);
  streakGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = streakGrad;
  ctx.fillRect(x - flareR * 3, y - flareR * 0.15, flareR * 6, flareR * 0.3);

  // Small secondary flares
  const flares = [0.3, 0.5, 0.7];
  for (const f of flares) {
    const fx = x + (x - ctx.canvas.width * 0.5) * f * 0.3;
    const fy = y + (y - ctx.canvas.height * 0.5) * f * 0.3;
    const fr = r * 0.3 * f;
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
    fg.addColorStop(0, `rgba(${hexToRgb(color)}, ${opacity * 0.06 * f})`);
    fg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderVignette(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  intensity: number
) {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.75);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.7, `rgba(0,0,0,${intensity * 0.3})`);
  grad.addColorStop(1, `rgba(0,0,0,${intensity * 0.7})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* ── Color utilities ── */

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "100,130,200";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function lightenHex(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = Math.min(255, parseInt(h.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(h.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(h.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
