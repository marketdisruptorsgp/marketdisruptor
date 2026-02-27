import pptxgen from "pptxgenjs";
import type { Product } from "@/data/mockProducts";

// ── Layout Constants (16:9 inches) ──
const W = 13.33;
const H = 7.5;
const M = 0.75;
const CW = W - M * 2; // 11.83"
const FOOTER_Y = 7.05;
const MIN_FONT = 10; // Minimum font size (pt) — enforced globally

// ── Mode Hex Mapping ──
// Canonical source: CSS --mode-* vars in index.css
// These hex values are the non-CSS equivalent for PPTX rendering.
const MODE_HEX: Record<string, string> = {
  product: "4b68f5",
  service: "d64174",
  business: "9030ea",
};

function resolveHex(accentColor?: string): string {
  if (!accentColor) return MODE_HEX.product;
  if (accentColor.includes("--mode-service") || accentColor.includes("343")) return MODE_HEX.service;
  if (accentColor.includes("--mode-business") || accentColor.includes("271")) return MODE_HEX.business;
  return MODE_HEX.product;
}

function lighter(hex: string, amount = 0.85): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return [lr, lg, lb].map(v => v.toString(16).padStart(2, "0")).join("");
}

// ── Content-Aware Layout Cursor ──
class LayoutCursor {
  y: number;
  constructor(startY = 1.3) {
    this.y = startY;
  }
  /** Place a block at current Y, advance by height + gap. Returns start Y. */
  place(height: number, gap = 0.15): number {
    const pos = this.y;
    this.y += height + gap;
    return pos;
  }
  /** Remaining vertical space before footer */
  remaining(): number {
    return FOOTER_Y - this.y - 0.2;
  }
  /** Check if there's room for a block */
  hasRoom(needed: number): boolean {
    return this.remaining() >= needed;
  }
}

// ── Slide Master ──
function setupMaster(pres: pptxgen, hex: string) {
  pres.defineSlideMaster({
    title: "DECK_MASTER",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: hex } } },
      { rect: { x: 0, y: FOOTER_Y, w: "100%", h: 0.005, fill: { color: "E0E0E0" } } },
      {
        text: {
          text: "Market Disruptor · Confidential",
          options: { x: M, y: FOOTER_Y + 0.05, fontSize: MIN_FONT, color: "999999", fontFace: "Helvetica" },
        },
      },
    ],
  });
}

// ── Reusable Slide Components ──

function addSlideHeader(
  slide: pptxgen.Slide,
  category: string,
  title: string,
  hex: string,
  slideNum: number,
  total: number
): LayoutCursor {
  slide.addText(category.toUpperCase(), {
    x: M, y: 0.3, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 3, fontFace: "Helvetica",
  });
  slide.addText(title, {
    x: M, y: 0.6, w: CW * 0.8, fontSize: 28, bold: true, color: "1a1a2e", fontFace: "Helvetica",
  });
  slide.addText(`${String(slideNum).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: W - M - 1, y: 0.6, w: 1, fontSize: MIN_FONT, color: "999999", align: "right", fontFace: "Helvetica",
  });
  return new LayoutCursor(1.3);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addMetricBox(slide: pptxgen.Slide, pres: pptxgen, label: string, value: string, x: number, y: number, w: number, hex: string) {
  slide.addShape(pres.ShapeType.rect, { x, y, w, h: 0.85, fill: { color: lighter(hex) }, rectRadius: 0.05 });
  slide.addShape(pres.ShapeType.rect, { x, y, w: 0.04, h: 0.85, fill: { color: hex } });
  slide.addText(label.toUpperCase(), {
    x: x + 0.15, y: y + 0.08, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
  });
  slide.addText(value, {
    x: x + 0.15, y: y + 0.35, w: w - 0.3, fontSize: 16, bold: true, color: "1a1a2e", fontFace: "Helvetica",
  });
}

function addBulletList(
  slide: pptxgen.Slide,
  items: string[],
  x: number,
  y: number,
  w: number,
  options?: { color?: string; fontSize?: number; numbered?: boolean }
) {
  if (!items?.length) return;
  const fs = Math.max(options?.fontSize || 13, MIN_FONT);
  slide.addText(
    items.map((t: string) => ({
      text: t,
      options: {
        bullet: options?.numbered ? { type: "number" as const } : true,
        fontSize: fs,
        color: options?.color || "333333",
      },
    })),
    { x, y, w, valign: "top", lineSpacingMultiple: 1.4 }
  );
}

// ── Cover Slide ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addCover(pres: pptxgen, product: Product, deck: any, hex: string) {
  const slide = pres.addSlide();
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: hex } });

  slide.addText("MARKET DISRUPTOR", {
    x: M, y: 1.2, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 4, fontFace: "Helvetica",
  });
  slide.addText("INVESTOR PITCH DECK", {
    x: M, y: 1.5, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 4, fontFace: "Helvetica",
  });

  slide.addText(product.name, {
    x: M, y: 2.2, w: CW * 0.8, fontSize: 40, bold: true, color: "1a1a2e", fontFace: "Helvetica",
  });

  const tagline = deck.tagline || deck.elevatorPitch?.split(".")?.[0] || "";
  if (tagline) {
    slide.addText(tagline, {
      x: M, y: 3.3, w: CW * 0.7, fontSize: 20, color: "666666", fontFace: "Helvetica",
    });
  }

  slide.addShape(pres.ShapeType.rect, { x: M, y: 4.2, w: 1, h: 0.03, fill: { color: hex } });

  // Product image on cover (right side)
  if (product.image) {
    try {
      slide.addImage({ path: product.image, x: W - M - 4, y: 1.5, w: 4, h: 3, rounding: true });
    } catch {
      // Image fetch may fail — skip gracefully
    }
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  slide.addText(today, { x: M, y: 6.2, fontSize: MIN_FONT, color: "999999", fontFace: "Helvetica" });
  slide.addText("Confidential", {
    x: M, y: 6.5, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
  });

  // Corner accent
  slide.addShape(pres.ShapeType.line, { x: W - M, y: H - 0.8, w: 0, h: 0.5, line: { color: hex, width: 1.5 } });
  slide.addShape(pres.ShapeType.line, { x: W - M - 0.5, y: H - 0.3, w: 0.5, h: 0, line: { color: hex, width: 1.5 } });
}

// ── Main Export ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateInvestorPitchPPTX(product: Product, deck: any, accentColor?: string) {
  const pres = new pptxgen();
  const hex = resolveHex(accentColor);

  pres.defineLayout({ name: "WIDE16x9", width: W, height: H });
  pres.layout = "WIDE16x9";
  pres.author = "Market Disruptor";
  pres.subject = `${product.name} Investor Pitch`;

  setupMaster(pres, hex);

  const TOTAL = 11;

  // ── Cover ──
  addCover(pres, product, deck, hex);

  // ── 1. Problem ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Problem Discovery", "The Problem", hex, 2, TOTAL);

    if (deck.problemStatement) {
      const y = cursor.place(1.5);
      s.addShape(pres.ShapeType.rect, { x: M, y, w: 0.04, h: 1.2, fill: { color: hex } });
      s.addText("PROBLEM STATEMENT", {
        x: M + 0.2, y, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
      });
      s.addText(deck.problemStatement, {
        x: M + 0.2, y: y + 0.3, w: CW * 0.55, fontSize: 16, color: "333333", lineSpacingMultiple: 1.4, fontFace: "Helvetica",
      });

      if (deck.customerPersona?.painPoints?.length) {
        s.addText("KEY PAIN POINTS", {
          x: M + CW * 0.6, y, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
        });
        addBulletList(s, deck.customerPersona.painPoints.slice(0, 4), M + CW * 0.6, y + 0.3, CW * 0.38, { numbered: true, fontSize: 14 });
      }
    }

    if (deck.customerPersona?.name && cursor.hasRoom(1.0)) {
      const metricY = cursor.place(1.0);
      addMetricBox(s, pres, "Target Customer", `${deck.customerPersona.name} · Age ${deck.customerPersona.age}`, M, metricY, CW * 0.5, hex);
    }
  }

  // ── 2. Solution ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Strategic Thesis", "The Solution", hex, 3, TOTAL);

    if (deck.elevatorPitch) {
      const y = cursor.place(1.2);
      s.addShape(pres.ShapeType.rect, { x: M, y, w: 0.04, h: 0.8, fill: { color: hex } });
      s.addText("ELEVATOR PITCH", {
        x: M + 0.2, y, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
      });
      s.addText(deck.elevatorPitch, {
        x: M + 0.2, y: y + 0.25, w: CW, fontSize: 18, bold: true, color: hex, lineSpacingMultiple: 1.3, fontFace: "Helvetica",
      });
    }

    if (deck.solutionStatement) {
      const y = cursor.place(1.5);
      s.addText(deck.solutionStatement, {
        x: M, y, w: CW * 0.55, fontSize: 14, color: "333333", lineSpacingMultiple: 1.4, fontFace: "Helvetica",
      });

      if (deck.competitiveAdvantages?.length) {
        s.addText("DIFFERENTIATORS", {
          x: M + CW * 0.6, y, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
        });
        addBulletList(s, deck.competitiveAdvantages.slice(0, 4), M + CW * 0.6, y + 0.3, CW * 0.38, { numbered: true });
      }
    }
  }

  // ── 3. Why Now ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Market Timing", "Why Now", hex, 4, TOTAL);

    if (deck.whyNow) {
      const y = cursor.place(2.0);
      s.addText(deck.whyNow, {
        x: M, y, w: CW, fontSize: 16, color: "333333", lineSpacingMultiple: 1.4, fontFace: "Helvetica",
      });
    }

    if (deck.marketOpportunity?.growthRate && cursor.hasRoom(1.0)) {
      const y = cursor.place(1.0);
      addMetricBox(s, pres, "Market CAGR", deck.marketOpportunity.growthRate, M, y, CW * 0.4, hex);
    }

    // Timing signal cards
    if (cursor.hasRoom(1.5)) {
      const y = cursor.place(1.4);
      const timingCards = ["Market Shift", "Tech Enabler", "Demand Signal"];
      timingCards.forEach((card, i) => {
        const x = M + i * (CW / 3 + 0.1);
        const cardW = CW / 3 - 0.1;
        s.addShape(pres.ShapeType.rect, { x, y, w: cardW, h: 1.2, fill: { color: lighter(hex) }, rectRadius: 0.05 });
        s.addShape(pres.ShapeType.rect, { x, y, w: cardW, h: 0.03, fill: { color: hex } });
        s.addText(card, { x: x + 0.15, y: y + 0.15, fontSize: 12, bold: true, color: "1a1a2e", fontFace: "Helvetica" });
      });
    }
  }

  // ── 4. Market ──
  if (deck.marketOpportunity) {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Market Sizing", "Market Opportunity", hex, 5, TOTAL);
    const mo = deck.marketOpportunity;

    // TAM/SAM/SOM metric boxes
    const labels: [string, string][] = [["TAM", mo.tam], ["SAM", mo.sam], ["SOM", mo.som]];
    labels.forEach(([lbl, val]) => {
      if (val && cursor.hasRoom(1.0)) {
        const y = cursor.place(0.95);
        addMetricBox(s, pres, lbl, val, M, y, CW * 0.45, hex);
      }
    });

    // Growth rate visual
    if (mo.growthRate) {
      s.addShape(pres.ShapeType.rect, { x: M + CW * 0.5, y: 1.4, w: CW * 0.48, h: 1.0, fill: { color: lighter(hex) }, rectRadius: 0.05 });
      s.addText("GROWTH RATE", {
        x: M + CW * 0.5 + 0.15, y: 1.5, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
      });
      s.addText(mo.growthRate, { x: M + CW * 0.5 + 0.15, y: 1.8, fontSize: 24, bold: true, color: hex, fontFace: "Helvetica" });
    }

    if (mo.keyDrivers?.length) {
      s.addText("KEY DRIVERS", {
        x: M + CW * 0.5, y: 2.8, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
      });
      addBulletList(s, mo.keyDrivers.slice(0, 4), M + CW * 0.5, 3.1, CW * 0.48, { fontSize: 12 });
    }
  }

  // ── 5. Product / Innovation ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Product Analysis", "Product / Innovation", hex, 6, TOTAL);

    // Product image
    if (product.image && cursor.hasRoom(2.5)) {
      const y = cursor.place(2.2);
      try {
        s.addImage({ path: product.image, x: M, y, w: 3.5, h: 2.0, rounding: true });
      } catch {
        // Image fetch may fail in PPTX — skip gracefully
      }
    }

    if (deck.productInnovation) {
      const y = cursor.place(1.2);
      s.addShape(pres.ShapeType.rect, { x: M, y, w: 0.04, h: 0.8, fill: { color: hex } });
      s.addText(deck.productInnovation, {
        x: M + 0.2, y: y + 0.05, w: CW, fontSize: 15, color: "333333", lineSpacingMultiple: 1.4, fontFace: "Helvetica",
      });
    }

    const halfW = CW * 0.48;
    if (deck.competitiveAdvantages?.length && cursor.hasRoom(2.0)) {
      const y = cursor.place(2.5);
      s.addText("COMPETITIVE ADVANTAGES", {
        x: M, y, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
      });
      addBulletList(s, deck.competitiveAdvantages.slice(0, 4), M, y + 0.3, halfW, { numbered: true });

      if (deck.investorHighlights?.length) {
        s.addText("INVESTOR HIGHLIGHTS", {
          x: M + halfW + 0.2, y, fontSize: MIN_FONT, bold: true, color: "16a34a", charSpacing: 2, fontFace: "Helvetica",
        });
        addBulletList(s, deck.investorHighlights.slice(0, 4), M + halfW + 0.2, y + 0.3, halfW);
      }
    }
  }

  // ── 6. Business Model ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Financial Model", "Business Model", hex, 7, TOTAL);
    const ue = deck.financialModel?.unitEconomics || deck.businessModel?.unitEconomics;

    if (ue) {
      const y = cursor.place(1.0);
      const metrics: [string, string][] = [["COGS", ue.cogs], ["Price", ue.retailPrice], ["Gross Margin", ue.grossMargin], ["Payback", ue.paybackPeriod]];
      metrics.forEach(([lbl, val], i) => {
        addMetricBox(s, pres, lbl, val || "—", M + i * (CW / 4 + 0.05), y, CW / 4 - 0.05, hex);
      });
    }

    if (deck.businessModel?.revenueStreams?.length && cursor.hasRoom(2.0)) {
      const y = cursor.place(2.0);
      s.addText("REVENUE STREAMS", {
        x: M, y, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
      });
      addBulletList(s, deck.businessModel.revenueStreams.slice(0, 4), M, y + 0.3, CW * 0.55, { fontSize: 14 });
    }

    if (ue?.ltv && ue?.cac && cursor.hasRoom(1.0)) {
      const y = cursor.place(1.0);
      addMetricBox(s, pres, "LTV", ue.ltv, M, y, CW * 0.45, "16a34a");
      addMetricBox(s, pres, "CAC", ue.cac, M + CW * 0.5, y, CW * 0.45, "d97706");
    }
  }

  // ── 7. Traction ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Validation", "Traction & Metrics", hex, 8, TOTAL);

    if (deck.tractionSignals?.length) {
      const y = cursor.place(2.0);
      s.addText("TRACTION SIGNALS", {
        x: M, y, fontSize: MIN_FONT, bold: true, color: "16a34a", charSpacing: 2, fontFace: "Helvetica",
      });
      addBulletList(s, deck.tractionSignals.slice(0, 4), M, y + 0.3, CW * 0.48, { numbered: true });
    }

    if (deck.keyMetrics?.length) {
      s.addText("KEY PERFORMANCE INDICATORS", {
        x: M + CW * 0.52, y: 1.3, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deck.keyMetrics.slice(0, 5).forEach((m: any, i: number) => {
        const y = 1.7 + i * 0.85;
        s.addShape(pres.ShapeType.rect, { x: M + CW * 0.52, y, w: CW * 0.46, h: 0.7, fill: { color: lighter(hex) }, rectRadius: 0.04 });
        s.addText(m.metric, { x: M + CW * 0.52 + 0.1, y: y + 0.08, fontSize: 12, bold: true, color: "1a1a2e", fontFace: "Helvetica" });
        s.addText(m.target, { x: M + CW * 0.52 + 0.1, y: y + 0.35, fontSize: 11, bold: true, color: hex, fontFace: "Helvetica" });
      });
    }

    // Revival score visual
    if (cursor.hasRoom(1.4)) {
      const y = cursor.place(1.4);
      s.addShape(pres.ShapeType.rect, { x: M, y, w: CW * 0.3, h: 1.2, fill: { color: lighter(hex) }, rectRadius: 0.06 });
      s.addText("REVIVAL SCORE", {
        x: M + 0.15, y: y + 0.15, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
      });
      s.addText(`${product.revivalScore || "—"}/10`, {
        x: M + 0.15, y: y + 0.5, fontSize: 32, bold: true, color: hex, fontFace: "Helvetica",
      });
    }
  }

  // ── 8. Risks ──
  if (deck.risks?.length) {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Risk Assessment", "Risks & Mitigation", hex, 9, TOTAL);
    const sevColors: Record<string, string> = { high: "dc2626", medium: "d97706", low: "16a34a" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deck.risks.slice(0, 4).forEach((r: any) => {
      if (!cursor.hasRoom(1.2)) return; // Content guard: skip if no room
      const y = cursor.place(1.2);
      const sColor = sevColors[r.severity] || "999999";
      s.addShape(pres.ShapeType.rect, { x: M, y, w: CW, h: 1.1, fill: { color: "F8F8FA" }, rectRadius: 0.05 });
      s.addShape(pres.ShapeType.rect, { x: M, y, w: 0.04, h: 1.1, fill: { color: sColor } });
      s.addText(r.risk, {
        x: M + 0.2, y: y + 0.1, w: CW * 0.65, fontSize: 14, bold: true, color: "1a1a2e", fontFace: "Helvetica",
      });
      s.addText(r.severity.toUpperCase(), {
        x: M + CW * 0.85, y: y + 0.1, fontSize: MIN_FONT, bold: true, color: sColor, charSpacing: 2, fontFace: "Helvetica",
      });
      s.addText("Mitigation: " + r.mitigation, {
        x: M + 0.2, y: y + 0.5, w: CW - 0.4, fontSize: 12, color: "555555", lineSpacingMultiple: 1.3, fontFace: "Helvetica",
      });
    });
  }

  // ── 9. GTM ──
  if (deck.gtmStrategy) {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Growth Strategy", "Go-to-Market", hex, 10, TOTAL);
    const gtm = deck.gtmStrategy;

    const phases: [string, string][] = [
      ["Phase 1: Launch", gtm.phase1],
      ["Phase 2: Scale", gtm.phase2],
      ["Phase 3: Dominate", gtm.phase3],
    ];

    phases.forEach(([label, content], i) => {
      if (!content || !cursor.hasRoom(1.5)) return;
      const y = cursor.place(1.3);
      s.addShape(pres.ShapeType.ellipse, { x: M, y: y + 0.1, w: 0.35, h: 0.35, fill: { color: hex } });
      s.addText(String(i + 1), {
        x: M, y: y + 0.1, w: 0.35, h: 0.35, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Helvetica",
      });
      s.addText(label.toUpperCase(), {
        x: M + 0.5, y, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
      });
      s.addText(content, {
        x: M + 0.5, y: y + 0.3, w: CW * 0.55, fontSize: 13, color: "333333", lineSpacingMultiple: 1.3, fontFace: "Helvetica",
      });
    });

    if (gtm.keyChannels?.length) {
      s.addText("CHANNELS", {
        x: M + CW * 0.65, y: 1.4, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
      });
      addBulletList(s, gtm.keyChannels.slice(0, 4), M + CW * 0.65, 1.7, CW * 0.33, { fontSize: 13 });
    }

    if (gtm.launchBudget && cursor.hasRoom(1.0)) {
      const y = cursor.place(1.0);
      addMetricBox(s, pres, "Launch Budget", gtm.launchBudget, M + CW * 0.65, y, CW * 0.33, hex);
    }
  }

  // ── 10. The Ask ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    const cursor = addSlideHeader(s, "Capital Strategy", "The Ask", hex, 11, TOTAL);
    const fundingAsk = deck.financialModel?.fundingAsk || deck.investmentAsk?.amount || "TBD";

    // Large funding ask metric
    const askY = cursor.place(1.6);
    s.addShape(pres.ShapeType.rect, { x: M, y: askY, w: CW, h: 1.4, fill: { color: lighter(hex) }, rectRadius: 0.06 });
    s.addShape(pres.ShapeType.rect, { x: M, y: askY, w: 0.05, h: 1.4, fill: { color: hex } });
    s.addText("TOTAL FUNDING ASK", {
      x: M + 0.3, y: askY + 0.15, fontSize: MIN_FONT, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica",
    });
    s.addText(fundingAsk, {
      x: M + 0.3, y: askY + 0.55, fontSize: 32, bold: true, color: hex, fontFace: "Helvetica",
    });

    // Scenarios
    const scenarios = deck.financialModel?.scenarios || deck.investmentAsk?.scenarios;
    if (scenarios) {
      const scLabels: [string, unknown, number][] = [
        ["Conservative", scenarios.conservative, 40],
        ["Base Case", scenarios.base, 65],
        ["Optimistic", scenarios.optimistic, 100],
      ];
      scLabels.forEach(([lbl, sc, barPct]) => {
        if (!sc || !cursor.hasRoom(0.8)) return;
        const y = cursor.place(0.7);
        s.addText(lbl as string, {
          x: M, y: y + 0.1, w: 1.2, fontSize: MIN_FONT, bold: true, color: "999999", align: "right", fontFace: "Helvetica",
        });
        s.addShape(pres.ShapeType.rect, {
          x: M + 1.4, y: y + 0.05, w: CW * 0.35, h: 0.55, fill: { color: lighter(hex) }, rectRadius: 0.04,
        });
        s.addShape(pres.ShapeType.rect, {
          x: M + 1.4, y: y + 0.05, w: CW * 0.35 * ((barPct as number) / 100), h: 0.55, fill: { color: hex + "30" }, rectRadius: 0.04,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s.addText((sc as any).revenue || "—", {
          x: M + 1.6, y: y + 0.12, fontSize: 14, bold: true, color: "1a1a2e", fontFace: "Helvetica",
        });
      });
    }

    // Use of funds
    const funds = deck.financialModel?.useOfFunds || deck.investmentAsk?.useOfFunds;
    if (funds?.length && cursor.hasRoom(2.0)) {
      s.addText("USE OF FUNDS", {
        x: M + CW * 0.6, y: 3.2, fontSize: MIN_FONT, bold: true, color: hex, charSpacing: 2, fontFace: "Helvetica",
      });
      addBulletList(s, funds.slice(0, 5), M + CW * 0.6, 3.5, CW * 0.38, { numbered: true, fontSize: 12 });
    }

    // Exit
    const exit = deck.financialModel?.exitStrategy || deck.investmentAsk?.exitStrategy;
    if (exit && cursor.hasRoom(1.0)) {
      const y = cursor.place(1.0);
      addMetricBox(s, pres, "Exit Strategy", exit, M, y, CW * 0.5, hex);
    }
  }

  pres.writeFile({ fileName: `${product.name.replace(/[^a-z0-9]/gi, "_")}_pitch.pptx` });
}
