import jsPDF from "jspdf";
import type { Product } from "@/data/mockProducts";

// ── Helpers ────────────────────────────────────────────────
const PRIMARY = [79, 70, 229] as [number, number, number];    // #4f46e5 indigo
const DARK    = [17, 24, 39] as [number, number, number];     // #111827
const GRAY    = [107, 114, 128] as [number, number, number];  // #6b7280
const WHITE   = [255, 255, 255] as [number, number, number];
const GREEN   = [22, 163, 74] as [number, number, number];
const RED     = [239, 68, 68] as [number, number, number];
const AMBER   = [217, 119, 6] as [number, number, number];

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const ML = 16;      // margin left
const MR = 16;      // margin right
const CW = PAGE_W - ML - MR; // content width

function rgb(doc: jsPDF, c: [number,number,number]) { doc.setTextColor(c[0], c[1], c[2]); }
function fill(doc: jsPDF, c: [number,number,number]) { doc.setFillColor(c[0], c[1], c[2]); }
function stroke(doc: jsPDF, c: [number,number,number]) { doc.setDrawColor(c[0], c[1], c[2]); }

function label(doc: jsPDF, text: string, x: number, y: number, size = 7) {
  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  rgb(doc, GRAY);
  doc.text(text.toUpperCase(), x, y);
}

function body(doc: jsPDF, text: string, x: number, y: number, maxW = CW, size = 9): number {
  doc.setFontSize(size);
  doc.setFont("helvetica", "normal");
  rgb(doc, DARK);
  const lines = doc.splitTextToSize(String(text ?? ""), maxW);
  doc.text(lines, x, y);
  return y + lines.length * (size * 0.4);
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  fill(doc, PRIMARY); stroke(doc, PRIMARY);
  doc.rect(ML, y - 4, 3, 8, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  rgb(doc, PRIMARY);
  doc.text(title, ML + 6, y + 1);
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, y + 6, PAGE_W - MR, y + 6);
  return y + 14;
}

function pill(doc: jsPDF, text: string, x: number, y: number, bg: [number,number,number], textColor: [number,number,number] = WHITE) {
  const w = Math.min(CW, text.length * 2.2 + 6);
  fill(doc, bg);
  doc.roundedRect(x, y - 3.5, w, 5.5, 1.5, 1.5, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  rgb(doc, textColor);
  doc.text(text, x + 3, y);
  return x + w + 3;
}

function checkY(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - 16) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ── Cover page ─────────────────────────────────────────────
function addCover(doc: jsPDF, product: Product, subtitle = "") {
  fill(doc, PRIMARY);
  doc.rect(0, 0, PAGE_W, 90, "F");

  // gradient overlay band
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 70, PAGE_W, 20, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  rgb(doc, [199, 210, 254]);
  doc.text("PRODUCT INTELLIGENCE AI — ANALYSIS REPORT", ML, 20);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  rgb(doc, WHITE);
  const nameLines = doc.splitTextToSize(product.name, CW);
  doc.text(nameLines, ML, 36);

  const nameH = nameLines.length * 9;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  rgb(doc, [199, 210, 254]);
  doc.text(`${product.category} · ${product.era} · Revival Score ${product.revivalScore}/10`, ML, 36 + nameH + 4);

  if (subtitle) {
    doc.setFontSize(8);
    rgb(doc, [199, 210, 254]);
    doc.text(subtitle, ML, 36 + nameH + 11);
  }

  // pill badges at bottom of hero
  let bx = ML;
  const by = 80;
  [product.category, product.era, `Score ${product.revivalScore}/10`].forEach(t => {
    bx = pill(doc, t, bx, by, [99, 102, 241] as [number,number,number], WHITE);
  });

  // Generated line
  doc.setFontSize(7);
  rgb(doc, GRAY);
  doc.text(`Generated ${new Date().toLocaleDateString()} · Confidential`, ML, PAGE_H - 10);
}

// ── Full analysis PDF ───────────────────────────────────────
export function downloadFullAnalysisPDF(product: Product) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addCover(doc, product, "Full Intelligence Report");

  let y = 106;

  // Overview
  y = sectionTitle(doc, "Product Overview", y);
  if (product.keyInsight) {
    y = checkY(doc, y, 18);
    label(doc, "Key Insight", ML, y); y += 5;
    y = body(doc, `"${product.keyInsight}"`, ML, y, CW) + 4;
  }
  y = checkY(doc, y, 14);
  label(doc, "Description", ML, y); y += 5;
  y = body(doc, product.description, ML, y, CW) + 4;
  label(doc, "Specs", ML, y); y += 5;
  y = body(doc, product.specs, ML, y, CW) + 6;
  if (product.marketSizeEstimate) {
    y = checkY(doc, y, 10);
    label(doc, "Market Size Estimate", ML, y); y += 5;
    y = body(doc, product.marketSizeEstimate, ML, y, CW) + 6;
  }
  if (product.trendAnalysis) {
    y = checkY(doc, y, 14);
    label(doc, "Trend Analysis", ML, y); y += 5;
    y = body(doc, product.trendAnalysis, ML, y, CW) + 6;
  }

  // Pricing
  if (product.pricingIntel) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Pricing Intelligence", y);
    const pi = product.pricingIntel;
    const cols = [
      ["Current Market Price", pi.currentMarketPrice],
      ["eBay Avg Sold", pi.ebayAvgSold],
      ["Etsy Avg Sold", pi.etsyAvgSold],
      ["Original MSRP", pi.msrpOriginal],
      ["Collector Premium", pi.collectorPremium],
      ["Price Trend", pi.priceDirection?.toUpperCase()],
    ] as [string, string][];
    const colW = CW / 3;
    cols.forEach(([lbl, val], i) => {
      const cx = ML + (i % 3) * colW;
      const cy = y + Math.floor(i / 3) * 16;
      y = checkY(doc, cy, 16);
      label(doc, lbl, cx, cy);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
      doc.text(String(val ?? "—"), cx, cy + 5);
    });
    y += 20;
    label(doc, "Margin Analysis", ML, y); y += 5;
    y = body(doc, pi.margins, ML, y, CW) + 6;
  }

  // Supply Chain
  if (product.supplyChain) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Supply Chain", y);
    const sc = product.supplyChain;
    const printContacts = (title: string, items: { name: string; role?: string; region: string; url?: string; moq?: string }[]) => {
      if (!items?.length) return;
      y = checkY(doc, y, 16);
      label(doc, title, ML, y); y += 5;
      items.forEach(s => {
        y = checkY(doc, y, 12);
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
        doc.text(s.name, ML + 2, y);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, GRAY);
        const detail = [s.role, s.region, s.moq ? `MOQ: ${s.moq}` : "", s.url].filter(Boolean).join(" · ");
        const dLines = doc.splitTextToSize(detail, CW - 2);
        doc.text(dLines, ML + 2, y + 4);
        y += 4 + dLines.length * 3.5 + 3;
      });
      y += 2;
    };
    printContacts("Suppliers & IP Owners", sc.suppliers);
    printContacts("Manufacturers / OEM", sc.manufacturers);
    printContacts("Vendors", sc.vendors.map(v => ({ name: v.name, region: v.type, url: v.url, moq: undefined, role: v.notes })));
    printContacts("Distributors", sc.distributors);
  }

  // Action Plan
  if (product.actionPlan) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Action Plan", y);
    const ap = product.actionPlan;
    label(doc, "Strategic Direction", ML, y); y += 5;
    y = body(doc, ap.strategy, ML, y, CW) + 5;
    if (ap.quickWins?.length) {
      label(doc, "Quick Wins", ML, y); y += 5;
      ap.quickWins.forEach(w => {
        y = checkY(doc, y, 8);
        rgb(doc, GREEN); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("✓", ML, y);
        rgb(doc, DARK);
        const lines = doc.splitTextToSize(w, CW - 6);
        doc.text(lines, ML + 5, y);
        y += lines.length * 3.5 + 2;
      });
      y += 3;
    }
    if (ap.phases?.length) {
      label(doc, "Execution Phases", ML, y); y += 5;
      ap.phases.forEach(ph => {
        y = checkY(doc, y, 18);
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, PRIMARY);
        doc.text(`${ph.phase}  ·  ${ph.timeline}  ·  ${ph.budget}`, ML, y);
        y += 4;
        ph.actions?.forEach(a => {
          y = checkY(doc, y, 7);
          doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, DARK);
          const lines = doc.splitTextToSize(`• ${a}`, CW - 4);
          doc.text(lines, ML + 3, y);
          y += lines.length * 3.5 + 1;
        });
        y += 4;
      });
    }
  }

  // Flipped Ideas
  if (product.flippedIdeas?.length) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Flipped Product Ideas", y);
    product.flippedIdeas.forEach((idea, i) => {
      y = checkY(doc, y, 20);
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
      doc.text(`${i + 1}. ${idea.name}`, ML, y); y += 5;
      doc.setFontSize(8); doc.setFont("helvetica", "italic"); rgb(doc, GRAY);
      doc.text(idea.visualNotes || "", ML + 3, y); y += 4;
      doc.setFont("helvetica", "normal"); rgb(doc, DARK);
      const descLines = doc.splitTextToSize(idea.description || "", CW - 3);
      doc.text(descLines, ML + 3, y);
      y += descLines.length * 3.5 + 6;
    });
  }

  // Reviews
  if (product.reviews?.length) {
    y = checkY(doc, y, 20);
    y = sectionTitle(doc, "Reviews & Sentiment", y);
    product.reviews.forEach(r => {
      y = checkY(doc, y, 8);
      const c = r.sentiment === "positive" ? GREEN : r.sentiment === "negative" ? RED : AMBER;
      fill(doc, c); doc.circle(ML + 1.5, y - 1, 1.5, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, DARK);
      const lines = doc.splitTextToSize(r.text, CW - 6);
      doc.text(lines, ML + 5, y);
      y += lines.length * 3.5 + 3;
    });
  }

  doc.save(`${product.name.replace(/[^a-z0-9]/gi, "_")}_analysis.pdf`);
}

// ── Pitch Deck PDF ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadPitchDeckPDF(product: Product, deck: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addCover(doc, product, "Investor Pitch Deck");

  let y = 106;

  // Elevator Pitch
  y = sectionTitle(doc, "Elevator Pitch", y);
  y = body(doc, deck.elevatorPitch, ML, y, CW, 11) + 6;

  // Problem / Solution / Why Now
  y = checkY(doc, y, 30);
  label(doc, "The Problem", ML, y); y += 5;
  y = body(doc, deck.problemStatement, ML, y, CW) + 4;
  label(doc, "The Solution", ML, y); y += 5;
  y = body(doc, deck.solutionStatement, ML, y, CW) + 4;
  label(doc, "Why Now", ML, y); y += 5;
  y = body(doc, deck.whyNow, ML, y, CW) + 6;

  // Investor highlights
  if (deck.investorHighlights?.length) {
    y = checkY(doc, y, 16);
    label(doc, "Investor Highlights", ML, y); y += 5;
    deck.investorHighlights.forEach((h: string) => {
      y = checkY(doc, y, 8);
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, PRIMARY);
      const lines = doc.splitTextToSize(`⚡ ${h}`, CW - 3);
      doc.text(lines, ML, y);
      y += lines.length * 3.5 + 2;
    });
    y += 4;
  }

  // Market Opportunity
  y = checkY(doc, y, 40);
  y = sectionTitle(doc, "Market Opportunity", y);
  const mo = deck.marketOpportunity;
  if (mo) {
    const colW = CW / 3;
    [["TAM", mo.tam, PRIMARY], ["SAM", mo.sam, [59,130,246] as [number,number,number]], ["SOM", mo.som, GREEN]].forEach(([lbl, val, col], i) => {
      const cx = ML + i * colW;
      fill(doc, col as [number,number,number]); doc.setFillColor(...(col as [number,number,number]));
      doc.roundedRect(cx, y - 2, colW - 3, 16, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); rgb(doc, WHITE);
      doc.text(String(lbl), cx + 3, y + 4);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); rgb(doc, WHITE);
      const vLines = doc.splitTextToSize(String(val ?? ""), colW - 6);
      doc.text(vLines, cx + 3, y + 9);
    });
    y += 22;
    label(doc, "Growth Rate", ML, y); y += 5;
    y = body(doc, mo.growthRate, ML, y, CW) + 4;
    if (mo.keyDrivers?.length) {
      label(doc, "Key Market Drivers", ML, y); y += 5;
      mo.keyDrivers.forEach((d: string, i: number) => {
        y = checkY(doc, y, 7);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, DARK);
        const lines = doc.splitTextToSize(`${i + 1}. ${d}`, CW - 3);
        doc.text(lines, ML, y);
        y += lines.length * 3.5 + 2;
      });
      y += 4;
    }
  }

  // Customer Persona
  if (deck.customerPersona) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, `Ideal Customer: ${deck.customerPersona.name}`, y);
    const cp = deck.customerPersona;
    label(doc, "Age / Segment", ML, y); y += 5;
    y = body(doc, cp.age, ML, y, CW) + 4;
    label(doc, "Buying Behavior", ML, y); y += 5;
    y = body(doc, cp.buyingBehavior, ML, y, CW) + 4;
    label(doc, "Price Willingness", ML, y); y += 5;
    y = body(doc, cp.willingness, ML, y, CW) + 4;
    if (cp.painPoints?.length) {
      label(doc, "Pain Points", ML, y); y += 5;
      cp.painPoints.forEach((p: string) => {
        y = checkY(doc, y, 7);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, DARK);
        const lines = doc.splitTextToSize(`• ${p}`, CW - 3);
        doc.text(lines, ML, y); y += lines.length * 3.5 + 2;
      });
      y += 4;
    }
  }

  // Financial Model
  if (deck.financialModel) {
    y = checkY(doc, y, 40);
    y = sectionTitle(doc, "Financial Model", y);
    const fm = deck.financialModel;
    if (fm.unitEconomics) {
      const ue = fm.unitEconomics;
      const cols = [["COGS", ue.cogs], ["Retail Price", ue.retailPrice], ["Gross Margin", ue.grossMargin], ["Contribution Margin", ue.contributionMargin], ["Payback Period", ue.paybackPeriod]];
      const cw5 = CW / 5;
      cols.forEach(([lbl, val], i) => {
        const cx = ML + i * cw5;
        label(doc, lbl, cx, y, 6.5);
        doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
        const vLines = doc.splitTextToSize(String(val ?? ""), cw5 - 2);
        doc.text(vLines, cx, y + 5);
      });
      y += 18;
    }
    // Scenarios
    if (fm.scenarios) {
      label(doc, "Revenue Scenarios (Year 1)", ML, y); y += 5;
      const scenarios: [string, unknown][] = [["Conservative", fm.scenarios.conservative], ["Base Case", fm.scenarios.base], ["Optimistic", fm.scenarios.optimistic]];
      const scW = CW / 3;
      scenarios.forEach(([name, s], i) => {
        if (!s) return;
        const sc = s as { units: string; revenue: string; profit: string; assumptions: string };
        const cx = ML + i * scW;
        const colors: [number,number,number][] = [[59,130,246], [99,102,241], [22,163,74]];
        doc.setDrawColor(...colors[i]); doc.setLineWidth(0.7);
        doc.rect(cx, y - 1, scW - 3, 22);
        doc.setLineWidth(0.2);
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); rgb(doc, colors[i] as [number,number,number]);
        doc.text(name, cx + 2, y + 4);
        doc.setFont("helvetica", "normal"); rgb(doc, DARK); doc.setFontSize(7);
        doc.text(`Units: ${sc.units}`, cx + 2, y + 9);
        doc.text(`Revenue: ${sc.revenue}`, cx + 2, y + 13);
        doc.text(`Profit: ${sc.profit}`, cx + 2, y + 17);
      });
      y += 28;
    }
    label(doc, "Pricing Strategy", ML, y); y += 5;
    y = body(doc, fm.pricingStrategy, ML, y, CW) + 4;
    label(doc, "Break-Even Analysis", ML, y); y += 5;
    y = body(doc, fm.breakEvenAnalysis, ML, y, CW) + 4;
    label(doc, "Funding Ask", ML, y); y += 5;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); rgb(doc, PRIMARY);
    doc.text(fm.fundingAsk, ML, y); y += 6;
    if (fm.useOfFunds?.length) {
      label(doc, "Use of Funds", ML, y); y += 5;
      fm.useOfFunds.forEach((f: string) => {
        y = checkY(doc, y, 7);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, DARK);
        doc.text(`• ${f}`, ML, y); y += 4;
      });
      y += 2;
    }
    if (fm.exitStrategy) {
      y = checkY(doc, y, 14);
      label(doc, "Exit Strategy", ML, y); y += 5;
      y = body(doc, fm.exitStrategy, ML, y, CW) + 6;
    }
  }

  // Suppliers
  const printContact = (title: string, items: { name: string; role: string; region: string; email?: string; phone?: string; moq?: string; leadTime?: string; notes: string }[]) => {
    if (!items?.length) return;
    y = checkY(doc, y, 16);
    label(doc, title, ML, y); y += 5;
    items.forEach(s => {
      y = checkY(doc, y, 18);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
      doc.text(`${s.name}`, ML + 2, y);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); rgb(doc, GRAY);
      doc.text(s.role, ML + 2 + doc.getTextWidth(`${s.name}`) + 2, y);
      y += 4;
      const detail = [s.region, s.email, s.phone, s.moq ? `MOQ: ${s.moq}` : "", s.leadTime ? `Lead: ${s.leadTime}` : ""].filter(Boolean).join(" · ");
      const dLines = doc.splitTextToSize(detail, CW - 4);
      doc.text(dLines, ML + 2, y); y += dLines.length * 3.5 + 2;
      const nLines = doc.splitTextToSize(s.notes, CW - 4);
      rgb(doc, DARK); doc.setFontSize(8);
      doc.text(nLines, ML + 2, y); y += nLines.length * 3.5 + 4;
    });
    y += 2;
  };

  if (deck.supplierContacts?.length || deck.distributorContacts?.length) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Suppliers & Distributors", y);
    printContact("Manufacturers & Suppliers", deck.supplierContacts);
    printContact("Distributors & Logistics", deck.distributorContacts);
  }

  // GTM
  if (deck.gtmStrategy) {
    y = checkY(doc, y, 40);
    y = sectionTitle(doc, "Go-to-Market Strategy", y);
    const gtm = deck.gtmStrategy;
    [["Phase 1: Launch", gtm.phase1, GREEN], ["Phase 2: Scale", gtm.phase2, PRIMARY], ["Phase 3: Dominate", gtm.phase3, AMBER]].forEach(([ph, text, col]) => {
      y = checkY(doc, y, 20);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, col as [number,number,number]);
      doc.text(ph as string, ML, y); y += 4;
      y = body(doc, text as string, ML + 3, y, CW - 3) + 4;
    });
    if (gtm.keyChannels?.length) {
      label(doc, "Key Channels", ML, y); y += 5;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, DARK);
      doc.text(gtm.keyChannels.join(" · "), ML, y); y += 5;
    }
    label(doc, "Launch Budget", ML, y); y += 5;
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); rgb(doc, GREEN);
    doc.text(gtm.launchBudget || "", ML, y); y += 8;
  }

  // Risks
  if (deck.risks?.length) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Risk Matrix", y);
    deck.risks.forEach((r: { risk: string; mitigation: string; severity: string }) => {
      y = checkY(doc, y, 18);
      const c = r.severity === "high" ? RED : r.severity === "medium" ? AMBER : GREEN;
      pill(doc, r.severity.toUpperCase(), ML, y, c);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
      const rLines = doc.splitTextToSize(r.risk, CW - 22);
      doc.text(rLines, ML + 20, y);
      y += Math.max(rLines.length * 3.5, 5) + 1;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, GRAY);
      const mLines = doc.splitTextToSize(`✓ ${r.mitigation}`, CW - 4);
      doc.text(mLines, ML + 3, y); y += mLines.length * 3.5 + 5;
    });
  }

  // Key Metrics
  if (deck.keyMetrics?.length) {
    y = checkY(doc, y, 30);
    y = sectionTitle(doc, "Key Success Metrics", y);
    deck.keyMetrics.forEach((m: { metric: string; target: string; why: string }) => {
      y = checkY(doc, y, 14);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); rgb(doc, DARK);
      doc.text(m.metric, ML, y);
      // target badge right
      const tx = PAGE_W - MR - doc.getTextWidth(m.target) - 4;
      pill(doc, m.target, tx, y, PRIMARY);
      y += 4;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); rgb(doc, GRAY);
      const wLines = doc.splitTextToSize(m.why, CW - 3);
      doc.text(wLines, ML, y); y += wLines.length * 3.5 + 5;
    });
  }

  doc.save(`${product.name.replace(/[^a-z0-9]/gi, "_")}_pitch_deck.pdf`);
}
