import pptxgen from "pptxgenjs";
import type { Product } from "@/data/mockProducts";

// Slide dimensions (inches, 16:9)
const W = 13.33;
const H = 7.5;
const M = 0.75;
const CW = W - M * 2; // 11.83"
const FOOTER_Y = 7.05;

// Mode color mapping
function accentHex(accentColor?: string): string {
  if (!accentColor) return "4b68f5";
  if (accentColor.includes("343")) return "d64174";
  if (accentColor.includes("271")) return "9030ea";
  return "4b68f5";
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

function setupMaster(pres: pptxgen, hex: string) {
  pres.defineSlideMaster({
    title: "DECK_MASTER",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: hex } } },
      { rect: { x: 0, y: FOOTER_Y, w: "100%", h: 0.005, fill: { color: "E0E0E0" } } },
      { text: { text: "Market Disruptor · Confidential", options: { x: M, y: FOOTER_Y + 0.05, fontSize: 7, color: "999999", fontFace: "Helvetica" } } },
    ],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addCover(pres: pptxgen, product: Product, deck: any, hex: string) {
  const slide = pres.addSlide();
  // Accent band
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: hex } });
  // Labels
  slide.addText("MARKET DISRUPTOR", { x: M, y: 1.2, fontSize: 10, bold: true, color: hex, charSpacing: 4, fontFace: "Helvetica" });
  slide.addText("INVESTOR PITCH DECK", { x: M, y: 1.5, fontSize: 10, bold: true, color: "999999", charSpacing: 4, fontFace: "Helvetica" });
  // Product name
  slide.addText(product.name, { x: M, y: 2.2, w: CW * 0.8, fontSize: 40, bold: true, color: "1a1a2e", fontFace: "Helvetica" });
  // Tagline
  const tagline = deck.tagline || deck.elevatorPitch?.split(".")?.[0] || "";
  if (tagline) {
    slide.addText(tagline, { x: M, y: 3.3, w: CW * 0.7, fontSize: 20, color: "666666", fontFace: "Helvetica" });
  }
  // Accent line
  slide.addShape(pres.ShapeType.rect, { x: M, y: 4.2, w: 1, h: 0.03, fill: { color: hex } });
  // Date
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  slide.addText(today, { x: M, y: 6.2, fontSize: 10, color: "999999", fontFace: "Helvetica" });
  slide.addText("Confidential", { x: M, y: 6.5, fontSize: 9, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica" });
  // Corner accent
  slide.addShape(pres.ShapeType.line, { x: W - M, y: H - 0.8, w: 0, h: 0.5, line: { color: hex, width: 1.5 } });
  slide.addShape(pres.ShapeType.line, { x: W - M - 0.5, y: H - 0.3, w: 0.5, h: 0, line: { color: hex, width: 1.5 } });
}

function addSlideHeader(slide: pptxgen.Slide, category: string, title: string, hex: string, slideNum: number, total: number) {
  slide.addText(category.toUpperCase(), { x: M, y: 0.3, fontSize: 9, bold: true, color: hex, charSpacing: 3, fontFace: "Helvetica" });
  slide.addText(title, { x: M, y: 0.6, w: CW * 0.8, fontSize: 28, bold: true, color: "1a1a2e", fontFace: "Helvetica" });
  slide.addText(`${String(slideNum).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: W - M - 1, y: 0.6, w: 1, fontSize: 10, color: "999999", align: "right", fontFace: "Helvetica",
  });
}

function addQuoteBlock(slide: pptxgen.Slide, text: string, label: string, y: number, hex: string) {
  slide.addShape(pres_rect_stub as any, { x: M, y, w: 0.04, h: 0.8, fill: { color: hex } });
  slide.addText(label.toUpperCase(), { x: M + 0.2, y, fontSize: 8, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica" });
  slide.addText(text, { x: M + 0.2, y: y + 0.25, w: CW - 0.3, fontSize: 16, color: "333333", fontFace: "Helvetica", lineSpacingMultiple: 1.4 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addMetricBox(slide: pptxgen.Slide, label: string, value: string, x: number, y: number, w: number, hex: string) {
  slide.addShape(pres_rect_stub as any, { x, y, w, h: 0.85, fill: { color: lighter(hex) }, rectRadius: 0.05 });
  slide.addShape(pres_rect_stub as any, { x, y, w: 0.04, h: 0.85, fill: { color: hex } });
  slide.addText(label.toUpperCase(), { x: x + 0.15, y: y + 0.08, fontSize: 8, bold: true, color: "999999", charSpacing: 2, fontFace: "Helvetica" });
  slide.addText(value, { x: x + 0.15, y: y + 0.35, w: w - 0.3, fontSize: 16, bold: true, color: "1a1a2e", fontFace: "Helvetica" });
}

// Stub — pptxgenjs shape types are accessed from the instance
let pres_rect_stub: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateInvestorPitchPPTX(product: Product, deck: any, accentColor?: string) {
  const pres = new pptxgen();
  const hex = accentHex(accentColor);
  pres_rect_stub = pres.ShapeType.rect;

  pres.defineLayout({ name: "WIDE16x9", width: W, height: H });
  pres.layout = "WIDE16x9";
  pres.author = "Market Disruptor";
  pres.subject = `${product.name} Investor Pitch`;

  setupMaster(pres, hex);

  const TOTAL = 11; // cover + 10 content slides

  // ── Cover ──
  addCover(pres, product, deck, hex);

  // ── 1. Problem ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Problem Discovery", "The Problem", hex, 2, TOTAL);
    s.addShape(pres.ShapeType.rect, { x: M, y: 1.3, w: 0.04, h: 1.2, fill: { color: hex } });
    s.addText("PROBLEM STATEMENT", { x: M + 0.2, y: 1.3, fontSize: 8, bold: true, color: "999999", charSpacing: 2 });
    s.addText(deck.problemStatement || "", { x: M + 0.2, y: 1.6, w: CW * 0.55, fontSize: 16, color: "333333", lineSpacingMultiple: 1.4 });
    if (deck.customerPersona?.painPoints?.length) {
      s.addText("KEY PAIN POINTS", { x: M + CW * 0.6, y: 1.3, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        deck.customerPersona.painPoints.slice(0, 4).map((p: string) => ({ text: p, options: { bullet: { type: "number" }, fontSize: 14, color: "333333" } })),
        { x: M + CW * 0.6, y: 1.6, w: CW * 0.38, valign: "top", lineSpacingMultiple: 1.5 }
      );
    }
    if (deck.customerPersona?.name) {
      addMetricBox(s, "Target Customer", `${deck.customerPersona.name} · Age ${deck.customerPersona.age}`, M, 4.2, CW * 0.5, hex);
    }
  }

  // ── 2. Solution ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Strategic Thesis", "The Solution", hex, 3, TOTAL);
    s.addShape(pres.ShapeType.rect, { x: M, y: 1.3, w: 0.04, h: 0.8, fill: { color: hex } });
    s.addText("ELEVATOR PITCH", { x: M + 0.2, y: 1.3, fontSize: 8, bold: true, color: "999999", charSpacing: 2 });
    s.addText(deck.elevatorPitch || "", { x: M + 0.2, y: 1.55, w: CW, fontSize: 18, bold: true, color: hex, lineSpacingMultiple: 1.3 });
    s.addText(deck.solutionStatement || "", { x: M, y: 2.8, w: CW * 0.55, fontSize: 14, color: "333333", lineSpacingMultiple: 1.4 });
    if (deck.competitiveAdvantages?.length) {
      s.addText("DIFFERENTIATORS", { x: M + CW * 0.6, y: 2.8, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        deck.competitiveAdvantages.slice(0, 4).map((a: string) => ({ text: a, options: { bullet: { type: "number" }, fontSize: 13, color: "333333" } })),
        { x: M + CW * 0.6, y: 3.1, w: CW * 0.38, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
  }

  // ── 3. Why Now ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Market Timing", "Why Now", hex, 4, TOTAL);
    s.addText(deck.whyNow || "", { x: M, y: 1.4, w: CW, fontSize: 16, color: "333333", lineSpacingMultiple: 1.4 });
    if (deck.marketOpportunity?.growthRate) {
      addMetricBox(s, "Market CAGR", deck.marketOpportunity.growthRate, M, 3.8, CW * 0.4, hex);
    }
    // Timing cards
    const timingCards = ["Market Shift", "Tech Enabler", "Demand Signal"];
    timingCards.forEach((card, i) => {
      const x = M + i * (CW / 3 + 0.1);
      s.addShape(pres.ShapeType.rect, { x, y: 5.0, w: CW / 3 - 0.1, h: 1.2, fill: { color: lighter(hex) }, rectRadius: 0.05 });
      s.addShape(pres.ShapeType.rect, { x, y: 5.0, w: CW / 3 - 0.1, h: 0.03, fill: { color: hex } });
      s.addText(card, { x: x + 0.15, y: 5.15, fontSize: 12, bold: true, color: "1a1a2e" });
    });
  }

  // ── 4. Market ──
  if (deck.marketOpportunity) {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Market Sizing", "Market Opportunity", hex, 5, TOTAL);
    const mo = deck.marketOpportunity;
    // TAM/SAM/SOM boxes
    const labels = [["TAM", mo.tam], ["SAM", mo.sam], ["SOM", mo.som]];
    labels.forEach(([lbl, val], i) => {
      addMetricBox(s, lbl, val, M, 1.4 + i * 1.1, CW * 0.45, hex);
    });
    // Growth rate
    s.addShape(pres.ShapeType.rect, { x: M + CW * 0.5, y: 1.4, w: CW * 0.48, h: 1.0, fill: { color: lighter(hex) }, rectRadius: 0.05 });
    s.addText("GROWTH RATE", { x: M + CW * 0.5 + 0.15, y: 1.5, fontSize: 8, bold: true, color: "999999", charSpacing: 2 });
    s.addText(mo.growthRate || "N/A", { x: M + CW * 0.5 + 0.15, y: 1.8, fontSize: 24, bold: true, color: hex });
    // Key drivers
    if (mo.keyDrivers?.length) {
      s.addText("KEY DRIVERS", { x: M + CW * 0.5, y: 2.8, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        mo.keyDrivers.slice(0, 4).map((d: string) => ({ text: d, options: { bullet: true, fontSize: 12, color: "333333" } })),
        { x: M + CW * 0.5, y: 3.1, w: CW * 0.48, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
  }

  // ── 5. Product ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Product Analysis", "Product / Innovation", hex, 6, TOTAL);
    if (deck.productInnovation) {
      s.addShape(pres.ShapeType.rect, { x: M, y: 1.3, w: 0.04, h: 0.8, fill: { color: hex } });
      s.addText(deck.productInnovation, { x: M + 0.2, y: 1.35, w: CW, fontSize: 15, color: "333333", lineSpacingMultiple: 1.4 });
    }
    const halfW = CW * 0.48;
    if (deck.competitiveAdvantages?.length) {
      s.addText("COMPETITIVE ADVANTAGES", { x: M, y: 2.6, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        deck.competitiveAdvantages.slice(0, 4).map((a: string) => ({ text: a, options: { bullet: { type: "number" }, fontSize: 13, color: "333333" } })),
        { x: M, y: 2.9, w: halfW, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
    if (deck.investorHighlights?.length) {
      s.addText("INVESTOR HIGHLIGHTS", { x: M + halfW + 0.2, y: 2.6, fontSize: 8, bold: true, color: "16a34a", charSpacing: 2 });
      s.addText(
        deck.investorHighlights.slice(0, 4).map((h: string) => ({ text: h, options: { bullet: { type: "number" }, fontSize: 13, color: "333333" } })),
        { x: M + halfW + 0.2, y: 2.9, w: halfW, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
  }

  // ── 6. Business Model ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Financial Model", "Business Model", hex, 7, TOTAL);
    const ue = deck.financialModel?.unitEconomics || deck.businessModel?.unitEconomics;
    if (ue) {
      const metrics = [["COGS", ue.cogs], ["Price", ue.retailPrice], ["Gross Margin", ue.grossMargin], ["Payback", ue.paybackPeriod]];
      metrics.forEach(([lbl, val], i) => {
        addMetricBox(s, lbl, val || "—", M + i * (CW / 4 + 0.05), 1.4, CW / 4 - 0.05, hex);
      });
    }
    if (deck.businessModel?.revenueStreams?.length) {
      s.addText("REVENUE STREAMS", { x: M, y: 2.8, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        deck.businessModel.revenueStreams.slice(0, 4).map((r: string) => ({ text: r, options: { bullet: true, fontSize: 14, color: "333333" } })),
        { x: M, y: 3.1, w: CW * 0.55, valign: "top", lineSpacingMultiple: 1.5 }
      );
    }
    if (ue?.ltv && ue?.cac) {
      addMetricBox(s, "LTV", ue.ltv, M, 4.6, CW * 0.45, "16a34a");
      addMetricBox(s, "CAC", ue.cac, M + CW * 0.5, 4.6, CW * 0.45, "d97706");
    }
  }

  // ── 7. Traction ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Validation", "Traction & Metrics", hex, 8, TOTAL);
    if (deck.tractionSignals?.length) {
      s.addText("TRACTION SIGNALS", { x: M, y: 1.3, fontSize: 8, bold: true, color: "16a34a", charSpacing: 2 });
      s.addText(
        deck.tractionSignals.slice(0, 4).map((t: string) => ({ text: t, options: { bullet: { type: "number" }, fontSize: 13, color: "333333" } })),
        { x: M, y: 1.6, w: CW * 0.48, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
    if (deck.keyMetrics?.length) {
      s.addText("KEY PERFORMANCE INDICATORS", { x: M + CW * 0.52, y: 1.3, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      deck.keyMetrics.slice(0, 5).forEach((m: any, i: number) => {
        const y = 1.7 + i * 0.85;
        s.addShape(pres.ShapeType.rect, { x: M + CW * 0.52, y, w: CW * 0.46, h: 0.7, fill: { color: lighter(hex) }, rectRadius: 0.04 });
        s.addText(m.metric, { x: M + CW * 0.52 + 0.1, y: y + 0.08, fontSize: 12, bold: true, color: "1a1a2e" });
        s.addText(m.target, { x: M + CW * 0.52 + 0.1, y: y + 0.35, fontSize: 11, bold: true, color: hex });
      });
    }
    // Revival score
    s.addShape(pres.ShapeType.rect, { x: M, y: 5.2, w: CW * 0.3, h: 1.2, fill: { color: lighter(hex) }, rectRadius: 0.06 });
    s.addText("REVIVAL SCORE", { x: M + 0.15, y: 5.35, fontSize: 8, bold: true, color: "999999", charSpacing: 2 });
    s.addText(`${product.revivalScore || "—"}/10`, { x: M + 0.15, y: 5.7, fontSize: 32, bold: true, color: hex });
  }

  // ── 8. Risks ──
  if (deck.risks?.length) {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Risk Assessment", "Risks & Mitigation", hex, 9, TOTAL);
    const sevColors: Record<string, string> = { high: "dc2626", medium: "d97706", low: "16a34a" };
    deck.risks.slice(0, 4).forEach((r: any, i: number) => {
      const y = 1.4 + i * 1.3;
      const sColor = sevColors[r.severity] || "999999";
      s.addShape(pres.ShapeType.rect, { x: M, y, w: CW, h: 1.1, fill: { color: "F8F8FA" }, rectRadius: 0.05 });
      s.addShape(pres.ShapeType.rect, { x: M, y, w: 0.04, h: 1.1, fill: { color: sColor } });
      s.addText(r.risk, { x: M + 0.2, y: y + 0.1, w: CW * 0.65, fontSize: 14, bold: true, color: "1a1a2e" });
      s.addText(r.severity.toUpperCase(), { x: M + CW * 0.85, y: y + 0.1, fontSize: 9, bold: true, color: sColor, charSpacing: 2 });
      s.addText("Mitigation: " + r.mitigation, { x: M + 0.2, y: y + 0.5, w: CW - 0.4, fontSize: 12, color: "555555", lineSpacingMultiple: 1.3 });
    });
  }

  // ── 9. GTM ──
  if (deck.gtmStrategy) {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Growth Strategy", "Go-to-Market", hex, 10, TOTAL);
    const gtm = deck.gtmStrategy;
    const phases = [
      ["Phase 1: Launch", gtm.phase1],
      ["Phase 2: Scale", gtm.phase2],
      ["Phase 3: Dominate", gtm.phase3],
    ];
    phases.forEach(([label, content], i) => {
      const y = 1.4 + i * 1.4;
      s.addShape(pres.ShapeType.ellipse, { x: M, y: y + 0.1, w: 0.35, h: 0.35, fill: { color: hex } });
      s.addText(String(i + 1), { x: M, y: y + 0.1, w: 0.35, h: 0.35, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
      s.addText(label.toUpperCase(), { x: M + 0.5, y, fontSize: 9, bold: true, color: "999999", charSpacing: 2 });
      s.addText(content || "", { x: M + 0.5, y: y + 0.3, w: CW * 0.55, fontSize: 13, color: "333333", lineSpacingMultiple: 1.3 });
    });
    if (gtm.keyChannels?.length) {
      s.addText("CHANNELS", { x: M + CW * 0.65, y: 1.4, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        gtm.keyChannels.slice(0, 4).map((ch: string) => ({ text: ch, options: { bullet: true, fontSize: 13, color: "333333" } })),
        { x: M + CW * 0.65, y: 1.7, w: CW * 0.33, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
    if (gtm.launchBudget) {
      addMetricBox(s, "Launch Budget", gtm.launchBudget, M + CW * 0.65, 4.0, CW * 0.33, hex);
    }
  }

  // ── 10. The Ask ──
  {
    const s = pres.addSlide({ masterName: "DECK_MASTER" });
    addSlideHeader(s, "Capital Strategy", "The Ask", hex, 11, TOTAL);
    const fundingAsk = deck.financialModel?.fundingAsk || deck.investmentAsk?.amount || "TBD";
    // Large centered metric
    s.addShape(pres.ShapeType.rect, { x: M, y: 1.3, w: CW, h: 1.4, fill: { color: lighter(hex) }, rectRadius: 0.06 });
    s.addShape(pres.ShapeType.rect, { x: M, y: 1.3, w: 0.05, h: 1.4, fill: { color: hex } });
    s.addText("TOTAL FUNDING ASK", { x: M + 0.3, y: 1.45, fontSize: 9, bold: true, color: "999999", charSpacing: 2 });
    s.addText(fundingAsk, { x: M + 0.3, y: 1.85, fontSize: 32, bold: true, color: hex });

    // Scenarios
    const scenarios = deck.financialModel?.scenarios || deck.investmentAsk?.scenarios;
    if (scenarios) {
      const scLabels = [["Conservative", scenarios.conservative], ["Base Case", scenarios.base], ["Optimistic", scenarios.optimistic]];
      scLabels.forEach(([lbl, sc], i) => {
        if (!sc) return;
        const y = 3.2 + i * 0.9;
        const widths = [40, 65, 100];
        s.addText(lbl, { x: M, y: y + 0.1, w: 1.2, fontSize: 10, bold: true, color: "999999", align: "right" });
        s.addShape(pres.ShapeType.rect, { x: M + 1.4, y: y + 0.05, w: CW * 0.35, h: 0.55, fill: { color: lighter(hex) }, rectRadius: 0.04 });
        s.addShape(pres.ShapeType.rect, { x: M + 1.4, y: y + 0.05, w: CW * 0.35 * (widths[i] / 100), h: 0.55, fill: { color: hex + "30" }, rectRadius: 0.04 });
        s.addText((sc as any).revenue || "—", { x: M + 1.6, y: y + 0.12, fontSize: 14, bold: true, color: "1a1a2e" });
      });
    }

    // Use of funds
    const funds = deck.financialModel?.useOfFunds || deck.investmentAsk?.useOfFunds;
    if (funds?.length) {
      s.addText("USE OF FUNDS", { x: M + CW * 0.6, y: 3.2, fontSize: 8, bold: true, color: hex, charSpacing: 2 });
      s.addText(
        funds.slice(0, 5).map((f: string) => ({ text: f, options: { bullet: { type: "number" }, fontSize: 12, color: "333333" } })),
        { x: M + CW * 0.6, y: 3.5, w: CW * 0.38, valign: "top", lineSpacingMultiple: 1.4 }
      );
    }
    // Exit
    const exit = deck.financialModel?.exitStrategy || deck.investmentAsk?.exitStrategy;
    if (exit) {
      addMetricBox(s, "Exit Strategy", exit, M, 6.0, CW * 0.5, hex);
    }
  }

  pres.writeFile({ fileName: `${product.name.replace(/[^a-z0-9]/gi, "_")}_pitch.pptx` });
}
