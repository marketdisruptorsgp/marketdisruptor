/* ═══════════════════════════════════════════════════════════════
   CANVAS CINEMATIC ENGINE v4 — HIGH CONTRAST, HIGH IMPACT
   
   Bold structural visuals. Gradient-filled blocks, deep shadows,
   intense glows, thick animated flow lines, dramatic particles.
   Every element pops against a clean white canvas.
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
  progressBar?: number;
  progressColor?: string;
  iconDot?: string;
  fillGradient?: boolean; // NEW: gradient fill instead of white
  fillColor?: string; // NEW: solid background tint
  shadowColor?: string; // NEW: custom shadow color
  scale?: number; // NEW: scale transform
  badge?: string; // NEW: small text badge top-right
  badgeColor?: string;
}

export interface FlowLine {
  from: string;
  to: string;
  color: string;
  strength: number;
  animated: boolean;
  dashed?: boolean;
  thick?: boolean; // NEW: thick lines for emphasis
  glowTrail?: boolean; // NEW: glowing trail effect
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
  shadow?: boolean; // NEW: text shadow for punch
  underline?: boolean; // NEW: underline accent
  underlineColor?: string;
}

export interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  vx?: number;
  vy?: number;
  ring?: boolean; // NEW: ring particle instead of filled
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
  tertiaryGlow?: { x: number; y: number; radius: number; color: string; intensity: number };
  scanLine?: { y: number; color: string; opacity: number };
  vignette?: number; // NEW: edge darkening 0-1
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

  // Subtle dot grid
  renderDotGrid(ctx, W, H, time, dpr);

  // Camera transform
  const cx = W * 0.5;
  const cy = H * 0.5;
  ctx.translate(cx, cy);
  ctx.scale(frame.camera.zoom, frame.camera.zoom);
  ctx.translate(-cx + frame.camera.x * dpr, -cy + frame.camera.y * dpr);

  // Glows — much more intense now
  if (frame.accentGlow && frame.accentGlow.intensity > 0) {
    renderRadialGlow(ctx, frame.accentGlow, W, H);
  }
  if (frame.secondaryGlow && frame.secondaryGlow.intensity > 0) {
    renderRadialGlow(ctx, frame.secondaryGlow, W, H);
  }
  if (frame.tertiaryGlow && frame.tertiaryGlow.intensity > 0) {
    renderRadialGlow(ctx, frame.tertiaryGlow, W, H);
  }

  // Particles (behind blocks) — bigger and bolder
  for (const p of frame.particles) {
    if (p.opacity <= 0) continue;
    const px = p.x * W;
    const py = p.y * H;
    const r = p.radius * dpr;
    if (p.ring) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(p.color)}, ${p.opacity})`;
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    } else {
      // Soft glow behind particle
      ctx.beginPath();
      ctx.arc(px, py, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.opacity * 0.15})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.opacity})`;
      ctx.fill();
    }
  }

  // Flow lines — thicker and glowing
  const blockMap = new Map(frame.blocks.map(b => [b.id, b]));
  for (const line of frame.lines) {
    const from = blockMap.get(line.from);
    const to = blockMap.get(line.to);
    if (!from || !to) continue;
    renderFlowLine(ctx, from, to, line, W, H, time, dpr);
  }

  // Scan line effect — more visible
  if (frame.scanLine && frame.scanLine.opacity > 0) {
    const sy = frame.scanLine.y * H;
    const grad = ctx.createLinearGradient(0, sy - 50 * dpr, 0, sy + 50 * dpr);
    grad.addColorStop(0, `rgba(${hexToRgb(frame.scanLine.color)}, 0)`);
    grad.addColorStop(0.5, `rgba(${hexToRgb(frame.scanLine.color)}, ${frame.scanLine.opacity * 0.25})`);
    grad.addColorStop(1, `rgba(${hexToRgb(frame.scanLine.color)}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, sy - 50 * dpr, W, 100 * dpr);
  }

  // Blocks — with gradient fills and deep shadows
  for (const block of frame.blocks) {
    renderBlock(ctx, block, W, H, time, dpr);
  }

  ctx.restore();

  // Vignette overlay
  if (frame.vignette && frame.vignette > 0) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, `rgba(0,0,0,${frame.vignette * 0.08})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  // Text elements (post-camera for crisp rendering)
  ctx.save();
  for (const txt of frame.texts) {
    renderText(ctx, txt, W, H, dpr);
  }
  ctx.restore();
}

function renderDotGrid(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number, dpr: number) {
  const spacing = 40 * dpr;
  ctx.fillStyle = "rgba(0,0,0,0.03)";
  for (let x = spacing; x < w; x += spacing) {
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 0.9 * dpr, 0, Math.PI * 2);
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
  // MUCH higher intensity — 3-4x previous values
  grad.addColorStop(0, `rgba(${hexToRgb(glow.color)}, ${glow.intensity * 0.4})`);
  grad.addColorStop(0.35, `rgba(${hexToRgb(glow.color)}, ${glow.intensity * 0.18})`);
  grad.addColorStop(0.7, `rgba(${hexToRgb(glow.color)}, ${glow.intensity * 0.05})`);
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
  const pulseScale = block.pulse ? 1 + Math.sin(time * block.pulse) * 0.018 : 1;
  const totalScale = (block.scale ?? 1) * pulseScale;

  ctx.save();
  ctx.globalAlpha = block.opacity;

  if (totalScale !== 1) {
    ctx.translate(x + bw / 2, y + bh / 2);
    ctx.scale(totalScale, totalScale);
    ctx.translate(-(x + bw / 2), -(y + bh / 2));
  }

  // DEEP shadow — much more dramatic
  if (block.glow) {
    const shadowRgb = hexToRgb(block.shadowColor || block.color);
    ctx.shadowColor = `rgba(${shadowRgb}, 0.35)`;
    ctx.shadowBlur = 40 * dpr;
    ctx.shadowOffsetY = 10 * dpr;
  } else {
    ctx.shadowColor = `rgba(0,0,0,0.1)`;
    ctx.shadowBlur = 20 * dpr;
    ctx.shadowOffsetY = 5 * dpr;
  }

  // Fill — gradient or tinted, not just white
  roundRect(ctx, x, y, bw, bh, r);
  if (block.fillGradient) {
    const rgb = hexToRgb(block.color);
    const grad = ctx.createLinearGradient(x, y, x, y + bh);
    grad.addColorStop(0, `rgba(${rgb}, 0.08)`);
    grad.addColorStop(1, `rgba(${rgb}, 0.02)`);
    ctx.fillStyle = grad;
    ctx.fill();
    // White overlay for depth
    roundRect(ctx, x, y, bw, bh, r);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fill();
  } else if (block.fillColor) {
    const rgb = hexToRgb(block.fillColor);
    ctx.fillStyle = `rgba(${rgb}, 0.06)`;
    ctx.fill();
    roundRect(ctx, x, y, bw, bh, r);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  // Clear shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border — stronger
  roundRect(ctx, x, y, bw, bh, r);
  ctx.strokeStyle = block.glow
    ? `rgba(${hexToRgb(block.borderColor)}, 0.7)`
    : `rgba(${hexToRgb(block.borderColor)}, 0.25)`;
  ctx.lineWidth = (block.glow ? 2 : 1.2) * dpr;
  ctx.stroke();

  // Left accent bar — thicker
  if (block.accentBar || block.glow) {
    ctx.fillStyle = block.color;
    const barW = 4.5 * dpr;
    ctx.save();
    roundRect(ctx, x, y, barW + r, bh, r);
    ctx.clip();
    ctx.fillRect(x, y, barW, bh);
    ctx.restore();
  }

  // Icon dot — larger with glow ring
  if (block.iconDot) {
    const dotR = 5 * dpr;
    const dotX = x + bw - 14 * dpr;
    const dotY = y + 14 * dpr;
    // Glow ring
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(block.iconDot)}, 0.1)`;
    ctx.fill();
    // Dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = block.iconDot;
    ctx.fill();
  }

  // Badge
  if (block.badge) {
    const badgeSize = 9 * dpr;
    const bc = block.badgeColor || block.color;
    ctx.font = `700 ${badgeSize}px "Inter", -apple-system, sans-serif`;
    const badgeW = ctx.measureText(block.badge).width + 10 * dpr;
    const badgeH = 16 * dpr;
    const badgeX = x + bw - badgeW - 8 * dpr;
    const badgeY = y + bh - badgeH - 6 * dpr;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = `rgba(${hexToRgb(bc)}, 0.12)`;
    ctx.fill();
    ctx.fillStyle = bc;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(block.badge, badgeX + badgeW / 2, badgeY + badgeH / 2);
  }

  // Crack effect — bolder red
  if (block.cracked) {
    ctx.strokeStyle = `rgba(${hexToRgb("#c62828")}, 0.7)`;
    ctx.lineWidth = 2.5 * dpr;
    const cx2 = x + bw * 0.4;
    const cy2 = y + bh * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx2, cy2);
    ctx.lineTo(cx2 + bw * 0.07, cy2 + bh * 0.24);
    ctx.lineTo(cx2 - bw * 0.05, cy2 + bh * 0.45);
    ctx.lineTo(cx2 + bw * 0.06, cy2 + bh * 0.68);
    ctx.lineTo(cx2 - bw * 0.03, cy2 + bh * 0.85);
    ctx.stroke();
    // Second crack
    ctx.beginPath();
    ctx.moveTo(cx2 + bw * 0.33, cy2 + bh * 0.08);
    ctx.lineTo(cx2 + bw * 0.27, cy2 + bh * 0.38);
    ctx.lineTo(cx2 + bw * 0.35, cy2 + bh * 0.58);
    ctx.stroke();
  }

  // Strikethrough — bolder
  if (block.strikethrough) {
    ctx.strokeStyle = `rgba(${hexToRgb("#c62828")}, 0.8)`;
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(x + bw * 0.08, y + bh * 0.5);
    ctx.lineTo(x + bw * 0.92, y + bh * 0.5);
    ctx.stroke();
  }

  // Progress bar — taller and more visible
  if (block.progressBar !== undefined && block.progressBar > 0) {
    const pbH = 5 * dpr;
    const pbY = y + bh - 14 * dpr;
    const pbX = x + 14 * dpr;
    const pbW = bw - 28 * dpr;
    // Track
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    roundRect(ctx, pbX, pbY, pbW, pbH, pbH / 2);
    ctx.fill();
    // Fill with gradient
    const pColor = block.progressColor || block.color;
    const pGrad = ctx.createLinearGradient(pbX, pbY, pbX + pbW * block.progressBar, pbY);
    pGrad.addColorStop(0, pColor);
    pGrad.addColorStop(1, `rgba(${hexToRgb(pColor)}, 0.6)`);
    ctx.fillStyle = pGrad;
    roundRect(ctx, pbX, pbY, pbW * block.progressBar, pbH, pbH / 2);
    ctx.fill();
  }

  // Label — larger, bolder
  if (block.label) {
    const fontSize = Math.max(11 * dpr, Math.min(16 * dpr, bh * 0.22));
    ctx.font = `700 ${fontSize}px "Inter", -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = block.glow ? block.color : "rgba(20,24,40,0.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelY = block.sublabel ? y + bh * 0.38 : y + bh * 0.5;
    ctx.fillText(block.label, x + bw / 2, labelY, bw * 0.85);
  }

  // Sublabel — slightly more visible
  if (block.sublabel) {
    const subSize = Math.max(9 * dpr, Math.min(12 * dpr, bh * 0.15));
    ctx.font = `500 ${subSize}px "Inter", -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(80,90,115,0.7)";
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
  time: number, dpr: number
) {
  const x1 = (from.x + from.w / 2) * w;
  const y1 = (from.y + from.h) * h;
  const x2 = (to.x + to.w / 2) * w;
  const y2 = to.y * h;
  const cpOffset = Math.abs(y2 - y1) * 0.45;

  const baseWidth = line.thick ? 3.5 : Math.max(1.5, line.strength * 2.5);

  // Glow trail behind line
  if (line.glowTrail && line.strength > 0.2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y1 + cpOffset, x2, y2 - cpOffset, x2, y2);
    ctx.strokeStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.12})`;
    ctx.lineWidth = (baseWidth + 8) * dpr;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1, y1 + cpOffset, x2, y2 - cpOffset, x2, y2);

  ctx.strokeStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.55})`;
  ctx.lineWidth = baseWidth * dpr;

  if (line.dashed) {
    ctx.setLineDash([6 * dpr, 8 * dpr]);
    ctx.lineDashOffset = -(time * 30);
  } else if (line.animated) {
    ctx.setLineDash([5 * dpr, 7 * dpr]);
    ctx.lineDashOffset = -(time * 45);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Traveling dot — bigger, with trail
  if (line.animated && line.strength > 0.15) {
    const tPos = (time * 0.5) % 1;
    const dotX = bezierPt(x1, x1, x2, x2, tPos);
    const dotY = bezierPt(y1, y1 + cpOffset, y2 - cpOffset, y2, tPos);
    // Trail dots
    for (let i = 1; i <= 3; i++) {
      const tp = ((time * 0.5) - i * 0.04) % 1;
      if (tp < 0) continue;
      const tx = bezierPt(x1, x1, x2, x2, tp);
      const ty = bezierPt(y1, y1 + cpOffset, y2 - cpOffset, y2, tp);
      ctx.beginPath();
      ctx.arc(tx, ty, (4 - i) * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(line.color)}, ${(line.strength * 0.3) / i})`;
      ctx.fill();
    }
    // Main dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4.5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.9})`;
    ctx.fill();
    // Glow around dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, 12 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(line.color)}, ${line.strength * 0.12})`;
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
  ctx.textAlign = txt.align || "center";
  ctx.textBaseline = "middle";

  // Text shadow for punch
  if (txt.shadow) {
    ctx.shadowColor = `rgba(${hexToRgb(txt.color)}, 0.3)`;
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowOffsetY = 2 * dpr;
  }

  ctx.fillStyle = `rgba(${hexToRgb(txt.color)}, ${txt.opacity})`;

  if (txt.letterSpacing && txt.letterSpacing > 0) {
    const chars = txt.text.split("");
    let xPos = txt.x * w;
    if (txt.align === "center" || !txt.align) {
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

  // Underline accent
  if (txt.underline) {
    const textW = ctx.measureText(txt.text).width;
    const ux = (txt.align === "center" || !txt.align) ? txt.x * w - textW / 2 : txt.x * w;
    const uy = txt.y * h + fontSize * 0.6;
    ctx.strokeStyle = txt.underlineColor || `rgba(${hexToRgb(txt.color)}, ${txt.opacity * 0.5})`;
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(ux, uy);
    ctx.lineTo(ux + textW, uy);
    ctx.stroke();
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
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
