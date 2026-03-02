/* ═══════════════════════════════════════════════════════════════
   CANVAS CINEMATIC ENGINE — Light UI aesthetic
   Clean structural visuals on white background.
   UI cards, blocks, diagrams, typography, constraint maps.
   ═══════════════════════════════════════════════════════════════ */

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface UIBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  borderColor: string;
  opacity: number;
  label?: string;
  sublabel?: string;
  icon?: "feature" | "price" | "copy" | "effort" | "cost" | "time" | "adopt" | "scale" | "risk" | "reliable" | "constraint" | "strategy" | "check" | "path" | "pitch";
  glow?: boolean;
  cracked?: boolean;
  pulse?: number;
  cornerRadius?: number;
}

export interface FlowLine {
  from: string;
  to: string;
  color: string;
  strength: number;
  animated: boolean;
  dashed?: boolean;
}

export interface TextElement {
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  weight: number;
  opacity: number;
  align?: CanvasTextAlign;
  maxWidth?: number;
  font?: string;
}

export interface FloatingDot {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}

export interface SceneFrame {
  camera: CameraState;
  blocks: UIBlock[];
  lines: FlowLine[];
  texts: TextElement[];
  dots: FloatingDot[];
  bgColor: string;
  accentGlow?: { x: number; y: number; radius: number; color: string; intensity: number };
}

/* ── Helpers ── */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "100,100,100";
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
}

/* ── Main Renderer ── */

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: SceneFrame,
  time: number
) {
  const dpr = window.devicePixelRatio || 1;
  const W = width * dpr;
  const H = height * dpr;

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = frame.bgColor;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  renderLightGrid(ctx, W, H, time);

  // Camera
  const cx = W * 0.5;
  const cy = H * 0.5;
  ctx.translate(cx, cy);
  ctx.scale(frame.camera.zoom, frame.camera.zoom);
  ctx.translate(-cx + frame.camera.x * dpr, -cy + frame.camera.y * dpr);

  // Accent glow (subtle colored radial)
  if (frame.accentGlow && frame.accentGlow.intensity > 0) {
    const ag = frame.accentGlow;
    const grad = ctx.createRadialGradient(
      ag.x * W, ag.y * H, 0,
      ag.x * W, ag.y * H, ag.radius * Math.max(W, H)
    );
    grad.addColorStop(0, `rgba(${hexToRgb(ag.color)}, ${ag.intensity * 0.08})`);
    grad.addColorStop(0.5, `rgba(${hexToRgb(ag.color)}, ${ag.intensity * 0.03})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Floating dots (background texture)
  for (const dot of frame.dots) {
    ctx.beginPath();
    ctx.arc(dot.x * W, dot.y * H, dot.radius * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(dot.color)}, ${dot.opacity})`;
    ctx.fill();
  }

  // Flow lines
  const blockMap = new Map(frame.blocks.map(b => [b.id, b]));
  for (const line of frame.lines) {
    const from = blockMap.get(line.from);
    const to = blockMap.get(line.to);
    if (!from || !to) continue;
    renderFlowLine(ctx, from, to, line, W, H, time);
  }

  // Blocks
  for (const block of frame.blocks) {
    renderBlock(ctx, block, W, H, time);
  }

  ctx.restore();

  // Text elements (post-camera for crisp rendering)
  ctx.save();
  for (const txt of frame.texts) {
    renderText(ctx, txt, W, H, dpr);
  }
  ctx.restore();
}

function renderLightGrid(ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) {
  const spacing = 48;
  ctx.strokeStyle = "rgba(0,0,0,0.025)";
  ctx.lineWidth = 0.5;
  for (let x = spacing; x < w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = spacing; y < h; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function renderBlock(
  ctx: CanvasRenderingContext2D,
  block: UIBlock,
  w: number, h: number,
  time: number
) {
  const dpr = window.devicePixelRatio || 1;
  const x = block.x * w;
  const y = block.y * h;
  const bw = block.w * w;
  const bh = block.h * h;
  const r = (block.cornerRadius ?? 10) * dpr;
  const pulseScale = block.pulse ? 1 + Math.sin(time * block.pulse) * 0.015 : 1;

  ctx.save();
  ctx.globalAlpha = block.opacity;

  if (pulseScale !== 1) {
    ctx.translate(x + bw / 2, y + bh / 2);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-(x + bw / 2), -(y + bh / 2));
  }

  // Glow shadow
  if (block.glow) {
    ctx.shadowColor = `rgba(${hexToRgb(block.color)}, 0.25)`;
    ctx.shadowBlur = 24 * dpr;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 * dpr;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.06)";
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowOffsetY = 2 * dpr;
  }

  // Block fill
  roundRect(ctx, x, y, bw, bh, r);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Reset shadow for border
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  roundRect(ctx, x, y, bw, bh, r);
  ctx.strokeStyle = block.glow
    ? `rgba(${hexToRgb(block.borderColor)}, 0.6)`
    : `rgba(${hexToRgb(block.borderColor)}, 0.2)`;
  ctx.lineWidth = block.glow ? 2 * dpr : 1 * dpr;
  ctx.stroke();

  // Left accent bar
  if (block.glow) {
    ctx.fillStyle = block.color;
    roundRect(ctx, x, y, 4 * dpr, bh, r);
    ctx.fill();
  }

  // Crack effect
  if (block.cracked) {
    ctx.strokeStyle = `rgba(${hexToRgb("#d94040")}, 0.5)`;
    ctx.lineWidth = 1.5 * dpr;
    const cx = x + bw * 0.45;
    const cy = y + bh * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + bw * 0.05, cy + bh * 0.25);
    ctx.lineTo(cx - bw * 0.03, cy + bh * 0.45);
    ctx.lineTo(cx + bw * 0.04, cy + bh * 0.7);
    ctx.stroke();
  }

  // Label
  if (block.label) {
    const fontSize = Math.max(11 * dpr, bh * 0.22);
    ctx.font = `600 ${fontSize}px "Inter", -apple-system, sans-serif`;
    ctx.fillStyle = block.glow ? block.color : "rgba(30,35,50,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelY = block.sublabel ? y + bh * 0.4 : y + bh * 0.5;
    ctx.fillText(block.label, x + bw / 2, labelY, bw * 0.85);
  }

  // Sublabel
  if (block.sublabel) {
    const subSize = Math.max(9 * dpr, bh * 0.15);
    ctx.font = `400 ${subSize}px "Inter", -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(100,110,130,0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(block.sublabel, x + bw / 2, y + bh * 0.62, bw * 0.85);
  }

  ctx.restore();
}

function renderFlowLine(
  ctx: CanvasRenderingContext2D,
  from: UIBlock, to: UIBlock,
  line: FlowLine,
  w: number, h: number,
  time: number
) {
  const dpr = window.devicePixelRatio || 1;
  const x1 = (from.x + from.w / 2) * w;
  const y1 = (from.y + from.h) * h;
  const x2 = (to.x + to.w / 2) * w;
  const y2 = to.y * h;
  const midY = (y1 + y2) / 2;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);

  ctx.strokeStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.4})`;
  ctx.lineWidth = line.strength * 2.5 * dpr;

  if (line.dashed || line.animated) {
    ctx.setLineDash([6 * dpr, 8 * dpr]);
    ctx.lineDashOffset = -(time * 30);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Animated traveling dot
  if (line.animated && line.strength > 0.3) {
    const tPos = (time * 0.5) % 1;
    const dotX = bezierPoint(x1, x1, x2, x2, tPos);
    const dotY = bezierPoint(y1, midY, midY, y2, tPos);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.8})`;
    ctx.fill();
  }
}

function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function renderText(
  ctx: CanvasRenderingContext2D,
  txt: TextElement,
  w: number, h: number,
  dpr: number
) {
  if (txt.opacity <= 0) return;
  const fontSize = txt.size * dpr;
  const family = txt.font || '"Inter", -apple-system, sans-serif';
  ctx.font = `${txt.weight} ${fontSize}px ${family}`;
  ctx.fillStyle = `rgba(${hexToRgb(txt.color)}, ${txt.opacity})`;
  ctx.textAlign = txt.align || "center";
  ctx.textBaseline = "middle";
  const maxW = txt.maxWidth ? txt.maxWidth * w : undefined;
  ctx.fillText(txt.text, txt.x * w, txt.y * h, maxW);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
