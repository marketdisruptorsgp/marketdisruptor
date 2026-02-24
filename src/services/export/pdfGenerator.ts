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

function addSlideFooter(doc: jsPDF, slide: SlideModel, pageNum: number, totalPages: number) {
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, PAGE_H - 18, PAGE_W - MR, PAGE_H - 18);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(`${slide.metadata.dataSource || "Analysis"} · ${new Date(slide.metadata.timestamp).toLocaleDateString()}`, ML, PAGE_H - 13);
  doc.text("Market Disruptor | Confidential", PAGE_W / 2, PAGE_H - 13, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MR, PAGE_H - 13, { align: "right" });
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
  let y = 24;

  // Header band
  fill(doc, PRIMARY);
  doc.rect(0, 0, PAGE_W, 16, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  rgb(doc, WHITE);
  doc.text(slide.title.toUpperCase(), ML, 10);

  // Slide title
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

  // Sections
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
    y += 6;

    // Bullets
    for (const bullet of section.bullets.slice(0, 5)) {
      if (y > PAGE_H - 40) break;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      rgb(doc, DARK);
      const lines = doc.splitTextToSize(`•  ${bullet}`, CW - 6);
      doc.text(lines, ML + 3, y);
      y += lines.length * 3.8 + 2;
    }

    y += 4;
  }

  // Data callout
  if (slide.dataCallout && y < PAGE_H - 60) {
    y += 4;
    fill(doc, [245, 245, 250] as [number, number, number]);
    doc.roundedRect(ML, y - 2, CW, 18, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    rgb(doc, GRAY);
    doc.text(slide.dataCallout.label.toUpperCase(), ML + 6, y + 5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    rgb(doc, PRIMARY);
    doc.text(slide.dataCallout.value, ML + 6, y + 13);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateInvestorPitchPDF(product: Product, deck: any): void {
  const slides = formatPitchToSlides(deck, product.name);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const totalPages = slides.length + 1; // +1 for cover

  // Cover page
  fill(doc, PRIMARY);
  doc.rect(0, 0, PAGE_W, 100, "F");
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 80, PAGE_W, 20, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  rgb(doc, [199, 210, 254] as [number, number, number]);
  doc.text("MARKET DISRUPTOR — INVESTOR PITCH DECK", ML, 24);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  rgb(doc, WHITE);
  const nameLines = doc.splitTextToSize(product.name, CW);
  doc.text(nameLines, ML, 42);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  rgb(doc, [199, 210, 254] as [number, number, number]);
  doc.text(`${product.category} · Revival Score ${product.revivalScore}/10`, ML, 42 + nameLines.length * 10 + 6);

  doc.setFontSize(7);
  rgb(doc, GRAY);
  doc.text(`Generated ${new Date().toLocaleDateString()} · Confidential · ${slides.length} Slides`, ML, PAGE_H - 12);

  // Render each slide on its own page
  slides.forEach((slide, i) => {
    doc.addPage();
    renderSlide(doc, slide);
    addSlideFooter(doc, slide, i + 2, totalPages);
  });

  // Add page numbers to cover
  doc.setPage(1);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(`1 / ${totalPages}`, PAGE_W - MR, PAGE_H - 13, { align: "right" });

  doc.save(`${product.name.replace(/[^a-z0-9]/gi, "_")}_investor_pitch.pdf`);
}
