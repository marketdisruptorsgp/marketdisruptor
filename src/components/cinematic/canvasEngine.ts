/* ═══════════════════════════════════════════════════════════════
   CANVAS CINEMATIC ENGINE v3 — World-class light UI aesthetic
   
   Premium structural visuals on white background.
   Rounded cards with depth, flowing connections,
   radial glows, particle fields, and typographic hierarchy.
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
  glow?: boolean;
  cracked?: boolean;
  pulse?: number;
  cornerRadius?: number;
  accentBar?: boolean;
  strikethrough?: boolean;
  progressBar?: number; // 0-1
  progressColor?: string;
  iconDot?: string; // color of small indicator dot
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
  letterSpacing?: number;
}

export interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  vx?: number;
  vy?: number;
}

export interface SceneFrame {
  camera: CameraState;
  blocks: UIBlock[];
  lines: FlowLine[];
  texts: TextElement[];
  particles: Particle[];
  bgColor: string;
  bgGradient?: { stops: { offset: number; color: string }[] };
  accentGlow?: { x: number; y: number; radius: number; color: string; intensity: number };
  secondaryGlow?: { x: number; y: number; radius: number; color: string; intensity: number };
  scanLine?: { y: number; color: string; opacity: number };
}

/* ── Math helpers ── */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
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

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
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
  if (frame.bgGradient) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    for (const stop of frame.bgGradient.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = frame.bgColor;
  }
  ctx.fillRect(0, 0, W, H);

  // Subtle dot grid (more refined than lines)
  renderDotGrid(ctx, W, H, time, dpr);

  // Camera transform
  const cx = W * 0.5;
  const cy = H * 0.5;
  ctx.translate(cx, cy);
  ctx.scale(frame.camera.zoom, frame.camera.zoom);
  ctx.translate(-cx + frame.camera.x * dpr, -cy + frame.camera.y * dpr);

  // Primary accent glow
  if (frame.accentGlow && frame.accentGlow.intensity > 0) {
    renderRadialGlow(ctx, frame.accentGlow, W, H);
  }

  // Secondary glow
  if (frame.secondaryGlow && frame.secondaryGlow.intensity > 0) {
    renderRadialGlow(ctx, frame.secondaryGlow, W, H);
  }

  // Particles (behind blocks)
  for (const p of frame.particles) {
    if (p.opacity <= 0) continue;
    const px = p.x * W;
    const py = p.y * H;
    ctx.beginPath();
    ctx.arc(px, py, p.radius * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.opacity})`;
    ctx.fill();
  }

  // Flow lines
  const blockMap = new Map(frame.blocks.map(b => [b.id, b]));
  for (const line of frame.lines) {
    const from = blockMap.get(line.from);
    const to = blockMap.get(line.to);
    if (!from || !to) continue;
    renderFlowLine(ctx, from, to, line, W, H, time, dpr);
  }

  // Scan line effect
  if (frame.scanLine && frame.scanLine.opacity > 0) {
    const sy = frame.scanLine.y * H;
    const grad = ctx.createLinearGradient(0, sy - 30 * dpr, 0, sy + 30 * dpr);
    grad.addColorStop(0, `rgba(${hexToRgb(frame.scanLine.color)}, 0)`);
    grad.addColorStop(0.5, `rgba(${hexToRgb(frame.scanLine.color)}, ${frame.scanLine.opacity * 0.15})`);
    grad.addColorStop(1, `rgba(${hexToRgb(frame.scanLine.color)}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, sy - 30 * dpr, W, 60 * dpr);
  }

  // Blocks
  for (const block of frame.blocks) {
    renderBlock(ctx, block, W, H, time, dpr);
  }

  ctx.restore();

  // Text elements (post-camera for crisp rendering)
  ctx.save();
  for (const txt of frame.texts) {
    renderText(ctx, txt, W, H, dpr);
  }
  ctx.restore();
}

function renderDotGrid(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number, dpr: number) {
  const spacing = 40 * dpr;
  ctx.fillStyle = "rgba(0,0,0,0.028)";
  for (let x = spacing; x < w; x += spacing) {
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderRadialGlow(
  ctx: CanvasRenderingContext2D,
  glow: { x: number; y: number; radius: number; color: string; intensity: number },
  w: number, h: number
) {
  const grad = ctx.createRadialGradient(
    glow.x * w, glow.y * h, 0,
    glow.x * w, glow.y * h, glow.radius * Math.max(w, h)
  );
  grad.addColorStop(0, `rgba(${hexToRgb(glow.color)}, ${glow.intensity * 0.12})`);
  grad.addColorStop(0.4, `rgba(${hexToRgb(glow.color)}, ${glow.intensity * 0.05})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function renderBlock(
  ctx: CanvasRenderingContext2D,
  block: UIBlock,
  w: number, h: number,
  time: number, dpr: number
) {
  const x = block.x * w;
  const y = block.y * h;
  const bw = block.w * w;
  const bh = block.h * h;
  const r = (block.cornerRadius ?? 12) * dpr;
  const pulseScale = block.pulse ? 1 + Math.sin(time * block.pulse) * 0.012 : 1;

  ctx.save();
  ctx.globalAlpha = block.opacity;

  if (pulseScale !== 1) {
    ctx.translate(x + bw / 2, y + bh / 2);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-(x + bw / 2), -(y + bh / 2));
  }

  // Shadow
  if (block.glow) {
    ctx.shadowColor = `rgba(${hexToRgb(block.color)}, 0.2)`;
    ctx.shadowBlur = 28 * dpr;
    ctx.shadowOffsetY = 6 * dpr;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.05)";
    ctx.shadowBlur = 12 * dpr;
    ctx.shadowOffsetY = 3 * dpr;
  }

  // Fill
  roundRect(ctx, x, y, bw, bh, r);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Clear shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  roundRect(ctx, x, y, bw, bh, r);
  ctx.strokeStyle = block.glow
    ? `rgba(${hexToRgb(block.borderColor)}, 0.5)`
    : `rgba(${hexToRgb(block.borderColor)}, 0.15)`;
  ctx.lineWidth = (block.glow ? 1.5 : 1) * dpr;
  ctx.stroke();

  // Left accent bar
  if (block.accentBar || block.glow) {
    ctx.fillStyle = block.color;
    const barW = 3.5 * dpr;
    // Clip to rounded corners
    ctx.save();
    roundRect(ctx, x, y, barW + r, bh, r);
    ctx.clip();
    ctx.fillRect(x, y, barW, bh);
    ctx.restore();
  }

  // Icon dot (small colored circle top-right)
  if (block.iconDot) {
    const dotR = 4 * dpr;
    const dotX = x + bw - 12 * dpr;
    const dotY = y + 12 * dpr;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = block.iconDot;
    ctx.fill();
  }

  // Crack effect
  if (block.cracked) {
    ctx.strokeStyle = `rgba(${hexToRgb("#d94040")}, 0.45)`;
    ctx.lineWidth = 1.5 * dpr;
    const cx = x + bw * 0.4;
    const cy = y + bh * 0.15;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + bw * 0.06, cy + bh * 0.22);
    ctx.lineTo(cx - bw * 0.04, cy + bh * 0.42);
    ctx.lineTo(cx + bw * 0.05, cy + bh * 0.65);
    ctx.lineTo(cx - bw * 0.02, cy + bh * 0.82);
    ctx.stroke();
    // Second crack
    ctx.beginPath();
    ctx.moveTo(cx + bw * 0.3, cy + bh * 0.1);
    ctx.lineTo(cx + bw * 0.25, cy + bh * 0.35);
    ctx.lineTo(cx + bw * 0.32, cy + bh * 0.55);
    ctx.stroke();
  }

  // Strikethrough
  if (block.strikethrough) {
    ctx.strokeStyle = `rgba(${hexToRgb("#d94040")}, 0.6)`;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(x + bw * 0.1, y + bh * 0.5);
    ctx.lineTo(x + bw * 0.9, y + bh * 0.5);
    ctx.stroke();
  }

  // Progress bar
  if (block.progressBar !== undefined && block.progressBar > 0) {
    const pbH = 3 * dpr;
    const pbY = y + bh - 10 * dpr;
    const pbX = x + 12 * dpr;
    const pbW = bw - 24 * dpr;
    // Track
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    roundRect(ctx, pbX, pbY, pbW, pbH, pbH / 2);
    ctx.fill();
    // Fill
    ctx.fillStyle = block.progressColor || block.color;
    roundRect(ctx, pbX, pbY, pbW * block.progressBar, pbH, pbH / 2);
    ctx.fill();
  }

  // Label
  if (block.label) {
    const fontSize = Math.max(10 * dpr, Math.min(14 * dpr, bh * 0.2));
    ctx.font = `600 ${fontSize}px "Inter", -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = block.glow ? block.color : "rgba(30,35,50,0.88)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelY = block.sublabel ? y + bh * 0.38 : y + bh * 0.5;
    ctx.fillText(block.label, x + bw / 2, labelY, bw * 0.85);
  }

  // Sublabel
  if (block.sublabel) {
    const subSize = Math.max(8 * dpr, Math.min(11 * dpr, bh * 0.14));
    ctx.font = `400 ${subSize}px "Inter", -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(100,110,130,0.65)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(block.sublabel, x + bw / 2, y + bh * 0.6, bw * 0.85);
  }

  ctx.restore();
}

function renderFlowLine(
  ctx: CanvasRenderingContext2D,
  from: UIBlock, to: UIBlock,
  line: FlowLine,
  w: number, h: number,
  time: number, dpr: number
) {
  const x1 = (from.x + from.w / 2) * w;
  const y1 = (from.y + from.h) * h;
  const x2 = (to.x + to.w / 2) * w;
  const y2 = to.y * h;
  const cpOffset = Math.abs(y2 - y1) * 0.45;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1, y1 + cpOffset, x2, y2 - cpOffset, x2, y2);

  ctx.strokeStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.35})`;
  ctx.lineWidth = Math.max(1, line.strength * 2) * dpr;

  if (line.dashed) {
    ctx.setLineDash([5 * dpr, 7 * dpr]);
    ctx.lineDashOffset = -(time * 25);
  } else if (line.animated) {
    ctx.setLineDash([4 * dpr, 6 * dpr]);
    ctx.lineDashOffset = -(time * 35);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Traveling dot
  if (line.animated && line.strength > 0.2) {
    const tPos = (time * 0.4) % 1;
    const dotX = bezierPt(x1, x1, x2, x2, tPos);
    const dotY = bezierPt(y1, y1 + cpOffset, y2 - cpOffset, y2, tPos);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.7})`;
    ctx.fill();
    // Glow around dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.08})`;
    ctx.fill();
  }
}

function bezierPt(p0: number, p1: number, p2: number, p3: number, t: number): number {
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
  const family = txt.font || '"Inter", -apple-system, system-ui, sans-serif';
  ctx.font = `${txt.weight} ${fontSize}px ${family}`;
  ctx.fillStyle = `rgba(${hexToRgb(txt.color)}, ${txt.opacity})`;
  ctx.textAlign = txt.align || "center";
  ctx.textBaseline = "middle";

  if (txt.letterSpacing && txt.letterSpacing > 0) {
    // Manual letter spacing
    const chars = txt.text.split("");
    let xPos = txt.x * w;
    if (txt.align === "center") {
      const totalW = ctx.measureText(txt.text).width + (chars.length - 1) * txt.letterSpacing * dpr;
      xPos -= totalW / 2;
    }
    ctx.textAlign = "left";
    for (const char of chars) {
      ctx.fillText(char, xPos, txt.y * h);
      xPos += ctx.measureText(char).width + txt.letterSpacing * dpr;
    }
  } else {
    const maxW = txt.maxWidth ? txt.maxWidth * w : undefined;
    ctx.fillText(txt.text, txt.x * w, txt.y * h, maxW);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
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
