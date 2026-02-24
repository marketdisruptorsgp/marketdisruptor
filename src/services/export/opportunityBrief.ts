import jsPDF from "jspdf";
import type { Product } from "@/data/mockProducts";

const DARK = [17, 24, 39] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const PRIMARY = [79, 70, 229] as [number, number, number];
const GREEN = [22, 163, 74] as [number, number, number];
const RED = [239, 68, 68] as [number, number, number];
const AMBER = [217, 119, 6] as [number, number, number];

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;
const MR = 18;
const CW = PAGE_W - ML - MR;

function rgb(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }
function fill(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  fill(doc, PRIMARY);
  doc.rect(ML, y - 4, 3, 8, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  rgb(doc, PRIMARY);
  doc.text(title, ML + 6, y + 1);
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, y + 6, PAGE_W - MR, y + 6);
  return y + 14;
}

function bodyText(doc: jsPDF, text: string, x: number, y: number, maxW = CW): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  rgb(doc, DARK);
  const lines = doc.splitTextToSize(String(text ?? ""), maxW);
  doc.text(lines, x, y);
  return y + lines.length * 4 + 2;
}

function checkPage(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - 22) {
    doc.addPage();
    return 22;
  }
  return y;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateOpportunityBriefPDF(product: Product, analysisData: Record<string, unknown> | null): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Cover
  fill(doc, PRIMARY);
  doc.rect(0, 0, PAGE_W, 80, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  rgb(doc, [199, 210, 254] as [number, number, number]);
  doc.text("MARKET DISRUPTOR — OPPORTUNITY BRIEF", ML, 20);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  rgb(doc, WHITE);
  const nameLines = doc.splitTextToSize(product.name, CW);
  doc.text(nameLines, ML, 36);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  rgb(doc, [199, 210, 254] as [number, number, number]);
  doc.text(`Revival Score: ${product.revivalScore}/10 · ${product.category}`, ML, 36 + nameLines.length * 8 + 4);

  let y = 96;

  // 1. Opportunity Summary
  y = sectionTitle(doc, "Opportunity Summary", y);
  if (product.keyInsight) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    rgb(doc, PRIMARY);
    const insightLines = doc.splitTextToSize(`"${product.keyInsight}"`, CW);
    doc.text(insightLines, ML, y);
    y += insightLines.length * 4.5 + 4;
  }
  y = bodyText(doc, product.description || "", ML, y);
  y += 4;

  // 2. Disruption Thesis
  const disrupt = analysisData?.disrupt as Record<string, unknown> | undefined;
  if (disrupt) {
    y = checkPage(doc, y, 30);
    y = sectionTitle(doc, "Disruption Thesis", y);

    const ideas = (disrupt as any)?.flippedIdeas || (disrupt as any)?.ideas;
    if (Array.isArray(ideas)) {
      ideas.slice(0, 3).forEach((idea: any, i: number) => {
        y = checkPage(doc, y, 14);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        rgb(doc, DARK);
        doc.text(`${i + 1}. ${idea.name || idea.title}`, ML, y);
        y += 4;
        if (idea.description) {
          y = bodyText(doc, idea.description, ML + 3, y);
        }
        y += 2;
      });
    }
  }

  // 3. Risk Profile
  const stressTest = analysisData?.stressTest as Record<string, unknown> | undefined;
  const pitchDeck = analysisData?.pitchDeck as Record<string, unknown> | undefined;
  const risks = (stressTest as any)?.risks || (pitchDeck as any)?.risks;
  if (Array.isArray(risks) && risks.length > 0) {
    y = checkPage(doc, y, 30);
    y = sectionTitle(doc, "Risk Profile", y);
    risks.slice(0, 5).forEach((r: any) => {
      y = checkPage(doc, y, 12);
      const sev = r.severity || "medium";
      const c = sev === "high" ? RED : sev === "medium" ? AMBER : GREEN;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      rgb(doc, c);
      doc.text(`[${sev.toUpperCase()}]`, ML, y);
      rgb(doc, DARK);
      doc.setFont("helvetica", "normal");
      const riskLines = doc.splitTextToSize(r.risk || r.name || "", CW - 20);
      doc.text(riskLines, ML + 18, y);
      y += riskLines.length * 3.5 + 2;
      if (r.mitigation) {
        doc.setFontSize(7.5);
        rgb(doc, GRAY);
        const mitLines = doc.splitTextToSize(`→ ${r.mitigation}`, CW - 6);
        doc.text(mitLines, ML + 3, y);
        y += mitLines.length * 3.2 + 4;
      }
    });
  }

  // 4. Recommended Next Actions
  y = checkPage(doc, y, 30);
  y = sectionTitle(doc, "Recommended Next Actions", y);
  const actions = [
    "Validate core assumptions with target customer interviews",
    "Build minimum viable product for market testing",
    "Develop financial projections with realistic unit economics",
    "Identify and approach strategic partners or investors",
    "Establish competitive monitoring framework",
  ];
  actions.forEach((a, i) => {
    y = checkPage(doc, y, 8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    rgb(doc, DARK);
    doc.text(`${i + 1}. ${a}`, ML, y);
    y += 5;
  });

  // 5. Confidence Summary
  y = checkPage(doc, y, 20);
  y += 4;
  y = sectionTitle(doc, "Confidence Summary", y);
  const score = product.revivalScore;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  rgb(doc, score >= 7 ? GREEN : score >= 5 ? AMBER : RED);
  doc.text(`Overall Revival Score: ${score}/10`, ML, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  rgb(doc, GRAY);
  doc.text(
    score >= 7 ? "High confidence — strong structural indicators" : score >= 5 ? "Moderate confidence — requires validation" : "Lower confidence — significant risks present",
    ML, y
  );

  // Footer on all pages
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.line(ML, PAGE_H - 14, PAGE_W - MR, PAGE_H - 14);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    rgb(doc, GRAY);
    doc.text("Market Disruptor | Confidential", ML, PAGE_H - 10);
    doc.text(`Page ${i} of ${total}`, PAGE_W - MR, PAGE_H - 10, { align: "right" });
  }

  doc.save(`${product.name.replace(/[^a-z0-9]/gi, "_")}_opportunity_brief.pdf`);
}
