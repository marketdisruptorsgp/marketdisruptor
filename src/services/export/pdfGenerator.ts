import jsPDF from "jspdf";
import type { Product } from "@/data/mockProducts";
import { formatPitchToSlides, type SlideModel } from "./pitchFormatter";

const DARK = [17, 24, 39] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const PRIMARY = [79, 70, 229] as [number, number, number];
const GREEN = [22, 163, 74] as [number, number, number];
const AMBER = [217, 119, 6] as [number, number, number];

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 20;
const MR = 20;
const CW = PAGE_W - ML - MR;

const EVIDENCE_COLORS: Record<string, [number, number, number]> = {
  VERIFIED: DARK,
  MODELED: [79, 70, 229],
  ASSUMPTION: AMBER,
};

function rgb(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }
function fill(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }

/** Draw geometric "L" corner accent at bottom-right */
function drawCornerAccent(doc: jsPDF) {
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.4);
  const x = PAGE_W - MR;
  const y = PAGE_H - 22;
  doc.line(x, y - 12, x, y);
  doc.line(x - 12, y, x, y);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
}

/** Draw thin accent bar at top of page */
function drawAccentBar(doc: jsPDF) {
  fill(doc, PRIMARY);
  doc.rect(0, 0, PAGE_W, 2, "F");
}

/** Draw subtle dot grid pattern */
function drawDotGrid(doc: jsPDF) {
  doc.setFillColor(100, 100, 120);
  for (let x = ML; x < PAGE_W - MR; x += 12) {
    for (let y = 30; y < PAGE_H - 30; y += 12) {
      doc.circle(x, y, 0.25, "F");
    }
  }
  // Reset opacity by drawing nothing visible
}

/** Draw diagonal accent lines in top-right corner */
function drawDiagonalAccent(doc: jsPDF) {
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.15);
  doc.line(PAGE_W - 50, 4, PAGE_W, 54);
  doc.line(PAGE_W - 35, 4, PAGE_W, 39);
  doc.line(PAGE_W - 20, 4, PAGE_W, 24);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
}

/** Draw TAM/SAM/SOM concentric circles for market slide */
function drawMarketCircles(doc: jsPDF, slide: SlideModel, x: number, y: number) {
  const marketBullets = slide.sections.find(s => s.heading === "Market Size")?.bullets || [];
  const tam = marketBullets[0]?.replace("TAM: ", "") || "";
  const sam = marketBullets[1]?.replace("SAM: ", "") || "";
  const som = marketBullets[2]?.replace("SOM: ", "") || "";
  
  // Outer circle (TAM)
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.3);
  fill(doc, [79, 70, 229] as [number, number, number]);
  // Draw as outlines with very light fill
  doc.setFillColor(237, 235, 254);
  doc.circle(x, y, 28, "FD");
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  rgb(doc, PRIMARY);
  doc.text("TAM", x, y - 20, { align: "center" });
  doc.setFontSize(6);
  rgb(doc, DARK);
  doc.text(tam, x, y - 15, { align: "center" });
  
  // Middle circle (SAM)
  doc.setFillColor(225, 222, 252);
  doc.circle(x, y, 19, "FD");
  doc.setFontSize(5);
  rgb(doc, PRIMARY);
  doc.text("SAM", x, y - 10, { align: "center" });
  doc.setFontSize(6);
  rgb(doc, DARK);
  doc.text(sam, x, y - 5, { align: "center" });
  
  // Inner circle (SOM)
  doc.setFillColor(213, 208, 250);
  doc.circle(x, y, 10, "FD");
  doc.setFontSize(5);
  rgb(doc, PRIMARY);
  doc.text("SOM", x, y - 2, { align: "center" });
  doc.setFontSize(6);
  rgb(doc, DARK);
  doc.text(som, x, y + 3, { align: "center" });
  
  doc.setDrawColor(220, 220, 220);
}

/** Draw risk severity bar */
function drawRiskBar(doc: jsPDF, severity: string, x: number, y: number) {
  const barW = 25;
  const barH = 2;
  // Background
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(x, y, barW, barH, 1, 1, "F");
  // Fill
  const pct = severity === "high" ? 1 : severity === "medium" ? 0.6 : 0.3;
  const color: [number, number, number] = severity === "high" ? [220, 38, 38] : severity === "medium" ? AMBER : GREEN;
  fill(doc, color);
  doc.roundedRect(x, y, barW * pct, barH, 1, 1, "F");
}

function addSlideFooter(doc: jsPDF, slide: SlideModel, pageNum: number, totalPages: number) {
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, PAGE_H - 18, PAGE_W - MR, PAGE_H - 18);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(`${slide.metadata.dataSource || "Analysis"} · ${new Date(slide.metadata.timestamp).toLocaleDateString()}`, ML, PAGE_H - 13);
  doc.text("Market Disruptor | Confidential", PAGE_W / 2, PAGE_H - 13, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MR, PAGE_H - 13, { align: "right" });

  drawCornerAccent(doc);
}

function drawEvidenceTag(doc: jsPDF, tag: string, x: number, y: number) {
  const color = EVIDENCE_COLORS[tag] || GRAY;
  const w = tag.length * 1.8 + 6;
  fill(doc, color);
  doc.roundedRect(x, y - 3, w, 5, 1.5, 1.5, "F");
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  rgb(doc, WHITE);
  doc.text(tag, x + 3, y);
}

function renderSlide(doc: jsPDF, slide: SlideModel) {
  drawAccentBar(doc);
  drawDiagonalAccent(doc);

  let y = 24;

  // Header band
  fill(doc, PRIMARY);
  doc.rect(0, 4, PAGE_W, 14, "F");

  // Category label (left side of header)
  if (slide.categoryLabel) {
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    rgb(doc, [199, 210, 254] as [number, number, number]);
    doc.text(slide.categoryLabel.toUpperCase(), ML, 10);
  }

  // Slide title in header band
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  rgb(doc, WHITE);
  doc.text(slide.title.toUpperCase(), slide.categoryLabel ? ML + doc.getTextWidth(slide.categoryLabel.toUpperCase()) + 6 : ML, 14);

  // Slide title (large)
  y = 30;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  rgb(doc, DARK);
  doc.text(slide.title, ML, y);

  // Headline claim
  if (slide.headline) {
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    rgb(doc, PRIMARY);
    const headlineLines = doc.splitTextToSize(slide.headline, CW);
    doc.text(headlineLines, ML, y);
    y += headlineLines.length * 5 + 4;
  } else {
    y += 8;
  }

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 8;

  // Market slide — draw concentric circles visual
  if (slide.id === "market") {
    drawMarketCircles(doc, slide, PAGE_W - MR - 35, y + 30);
  }

  // Sections
  const sectionMaxX = slide.id === "market" ? CW * 0.55 : CW;
  for (const section of slide.sections) {
    if (y > PAGE_H - 50) break;

    // Section heading + evidence tag
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    rgb(doc, DARK);
    doc.text(section.heading, ML, y);

    if (section.evidenceTag) {
      drawEvidenceTag(doc, section.evidenceTag, ML + doc.getTextWidth(section.heading) + 4, y);
    }

    // Risk severity bar
    if (slide.id === "risks" && section.dataRef) {
      drawRiskBar(doc, section.dataRef, PAGE_W - MR - 30, y - 1);
    }
    y += 6;

    // Bullets
    for (const bullet of section.bullets.slice(0, 5)) {
      if (y > PAGE_H - 40) break;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      rgb(doc, DARK);
      const lines = doc.splitTextToSize(`•  ${bullet}`, sectionMaxX - 6);
      doc.text(lines, ML + 3, y);
      y += lines.length * 3.8 + 2;
    }

    y += 4;
  }

  // Data callout — left accent border style
  if (slide.dataCallout && y < PAGE_H - 60) {
    y += 4;
    // Left accent border
    fill(doc, PRIMARY);
    doc.rect(ML, y - 2, 2.5, 18, "F");
    // Background
    fill(doc, [245, 245, 250] as [number, number, number]);
    doc.roundedRect(ML + 2.5, y - 2, CW - 2.5, 18, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    rgb(doc, GRAY);
    doc.text(slide.dataCallout.label.toUpperCase(), ML + 8, y + 5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    rgb(doc, PRIMARY);
    doc.text(slide.dataCallout.value, ML + 8, y + 13);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateInvestorPitchPDF(product: Product, deck: any): void {
  const slides = formatPitchToSlides(deck, product.name);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const totalPages = slides.length + 1; // +1 for cover

  // ── Cover page ──
  drawAccentBar(doc);

  // Subtle geometric diagonal line
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.3);
  doc.line(PAGE_W - 60, 0, PAGE_W, 60);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);

  // Labels
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  rgb(doc, PRIMARY);
  doc.text("MARKET DISRUPTOR", ML, 30);
  doc.setFontSize(7);
  rgb(doc, GRAY);
  doc.text("INVESTOR PITCH DECK", ML, 36);

  // Product name
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  rgb(doc, DARK);
  const nameLines = doc.splitTextToSize(product.name, CW);
  doc.text(nameLines, ML, 60);

  // AI-generated subtitle (first sentence of elevator pitch)
  const elevatorPitch = deck.elevatorPitch || "";
  const subtitle = elevatorPitch.split(".")?.[0];
  if (subtitle) {
    const subtitleY = 60 + nameLines.length * 12 + 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    rgb(doc, GRAY);
    const subtitleLines = doc.splitTextToSize(subtitle + ".", CW * 0.75);
    doc.text(subtitleLines, ML, subtitleY);
  }

  // Category & score
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(`${product.category} · Revival Score ${product.revivalScore}/10`, ML, PAGE_H - 40);

  // Date & meta
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), ML, PAGE_H - 32);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  rgb(doc, GRAY);
  doc.text(`Confidential · ${slides.length} Slides`, ML, PAGE_H - 26);

  // Cover page number
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(`1 / ${totalPages}`, PAGE_W - MR, PAGE_H - 13, { align: "right" });

  // Cover corner accent
  drawCornerAccent(doc);

  // ── Render each slide on its own page ──
  slides.forEach((slide, i) => {
    doc.addPage();
    renderSlide(doc, slide);
    addSlideFooter(doc, slide, i + 2, totalPages);
  });

  doc.save(`${product.name.replace(/[^a-z0-9]/gi, "_")}_investor_pitch.pdf`);
}
