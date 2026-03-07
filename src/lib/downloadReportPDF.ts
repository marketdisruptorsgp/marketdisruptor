import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import { PrintableReport } from "@/components/export/PrintableReport";
import type { Product } from "@/data/mockProducts";
import { runStrategicAnalysis } from "@/lib/strategicEngine";
import React from "react";

const PDF_WIDTH_MM = 210;
const PDF_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const SECTION_GAP_MM = 3;
const RENDER_WIDTH_PX = 900;

type AnalysisType = "product" | "service" | "business_model";

function inferAnalysisType(mode?: string): AnalysisType {
  if (mode === "business" || mode === "business_model") return "business_model";
  if (mode === "service") return "service";
  return "product";
}

function waitForImages(scope: ParentNode): Promise<void> {
  const images = Array.from(scope.querySelectorAll("img"));
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
}

function buildStrategicSnapshot(
  product: Product,
  analysisData: Record<string, unknown> | null,
  mode?: string
): Record<string, unknown> | null {
  try {
    const ad = analysisData || {};
    const disruptData = (ad.disrupt ?? ad.disruptData ?? null) as unknown;
    const redesignData = (ad.redesign ?? ad.reimagine ?? ad.redesignData ?? null) as unknown;
    const stressTestData = (ad.stressTest ?? ad.stressTestData ?? null) as unknown;
    const pitchDeckData = (ad.pitchDeck ?? ad.pitchDeckData ?? null) as unknown;
    const governedData = (ad.governed ?? null) as Record<string, unknown> | null;
    const businessAnalysisData = (ad.businessAnalysisData ?? null) as unknown;

    const completedSteps = new Set<string>(["report"]);
    if (disruptData) completedSteps.add("disrupt");
    if (redesignData) completedSteps.add("redesign");
    if (stressTestData) completedSteps.add("stress-test");
    if (pitchDeckData) completedSteps.add("pitch");

    const result = runStrategicAnalysis({
      products: [product],
      selectedProduct: product,
      disruptData,
      redesignData,
      stressTestData,
      pitchDeckData,
      governedData,
      businessAnalysisData,
      intelligence: null,
      analysisType: inferAnalysisType(mode),
      analysisId: "pdf-export",
      completedSteps,
    });

    const nodeTypeCounts = result.graph.nodes.reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});

    return {
      metrics: result.metrics,
      graph: {
        nodes: result.graph.nodes.length,
        edges: result.graph.edges.length,
        nodeTypeCounts,
        topNodes: {
          primaryConstraint: result.graph.topNodes.primaryConstraint?.label ?? null,
          keyDriver: result.graph.topNodes.keyDriver?.label ?? null,
          breakthroughOpportunity: result.graph.topNodes.breakthroughOpportunity?.label ?? null,
          highestConfidence: result.graph.topNodes.highestConfidence?.label ?? null,
        },
      },
      topOpportunities: (result.opportunities || []).slice(0, 5).map((opp: any, index: number) => ({
        rank: index + 1,
        label: opp?.label || `Opportunity ${index + 1}`,
        impact: opp?.impact,
        confidence: opp?.confidence,
        source: opp?.source,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Renders the PrintableReport component off-screen, captures each logical section,
 * and assembles an A4 PDF download (no print dialog).
 * Section-based capture avoids truncation on very long analyses.
 */
export async function downloadReportAsPDF(
  product: Product,
  analysisData: Record<string, unknown> | null,
  options?: { title?: string; mode?: string; onProgress?: (msg: string) => void }
): Promise<void> {
  const progress = options?.onProgress || (() => {});
  progress("Preparing report layout…");

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; left: -99999px; top: 0;
    width: ${RENDER_WIDTH_PX}px;
    background: white;
    color: #1a1a2e;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    z-index: -1;
    padding: 40px;
  `;
  document.body.appendChild(container);

  const strategicSnapshot = buildStrategicSnapshot(product, analysisData, options?.mode);
  const enrichedAnalysisData = strategicSnapshot
    ? { ...(analysisData || {}), strategicSnapshot }
    : analysisData;

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(PrintableReport, {
          product,
          analysisData: enrichedAnalysisData,
          analysisTitle: options?.title,
          mode: options?.mode,
        })
      );
      setTimeout(resolve, 500);
    });

    await waitForImages(container);
    if ("fonts" in document && (document as Document & { fonts?: FontFaceSet }).fonts) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    const sectionNodes = Array.from(container.querySelectorAll<HTMLElement>("[data-pdf-section]"));
    const sections = sectionNodes.length > 0 ? sectionNodes : [container];

    progress("Rendering pages…");

    const contentWidthMM = PDF_WIDTH_MM - 2 * MARGIN_MM;
    const contentHeightMM = PDF_HEIGHT_MM - 2 * MARGIN_MM;

    const pdf = new jsPDF("p", "mm", "a4");
    let currentYMM = MARGIN_MM;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      progress(`Rendering section ${i + 1} of ${sections.length}…`);
      await waitForImages(section);

      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: RENDER_WIDTH_PX,
        width: section.scrollWidth || RENDER_WIDTH_PX,
        logging: false,
      });

      if (!canvas.width || !canvas.height) continue;

      const pxPerMm = canvas.width / contentWidthMM;
      const sectionHeightMM = canvas.height / pxPerMm;

      const ensurePageSpace = (neededMM: number) => {
        const remaining = PDF_HEIGHT_MM - MARGIN_MM - currentYMM;
        if (neededMM > remaining) {
          pdf.addPage();
          currentYMM = MARGIN_MM;
        }
      };

      // Section fits as a single block
      if (sectionHeightMM <= contentHeightMM) {
        ensurePageSpace(sectionHeightMM);

        const sectionImage = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(sectionImage, "JPEG", MARGIN_MM, currentYMM, contentWidthMM, sectionHeightMM);
        currentYMM += sectionHeightMM;
      } else {
        // Section is taller than a single page — split within this section only
        let offsetPx = 0;

        while (offsetPx < canvas.height) {
          const availableMM = PDF_HEIGHT_MM - MARGIN_MM - currentYMM;
          if (availableMM <= 0.5) {
            pdf.addPage();
            currentYMM = MARGIN_MM;
            continue;
          }

          const sliceHeightPx = Math.max(1, Math.floor(Math.min(canvas.height - offsetPx, availableMM * pxPerMm)));
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeightPx;

          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              offsetPx,
              canvas.width,
              sliceHeightPx,
              0,
              0,
              canvas.width,
              sliceHeightPx
            );
          }

          const sliceHeightMM = sliceHeightPx / pxPerMm;
          const sliceImage = sliceCanvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(sliceImage, "JPEG", MARGIN_MM, currentYMM, contentWidthMM, sliceHeightMM);

          offsetPx += sliceHeightPx;
          currentYMM += sliceHeightMM;

          if (offsetPx < canvas.height) {
            pdf.addPage();
            currentYMM = MARGIN_MM;
          }
        }
      }

      const isLastSection = i === sections.length - 1;
      if (!isLastSection) {
        if (currentYMM + SECTION_GAP_MM > PDF_HEIGHT_MM - MARGIN_MM) {
          pdf.addPage();
          currentYMM = MARGIN_MM;
        } else {
          currentYMM += SECTION_GAP_MM;
        }
      }
    }

    progress("Generating PDF…");
    const filename = `${(product?.name || "analysis").replace(/[^a-zA-Z0-9]/g, "-")}-report.pdf`;
    pdf.save(filename);
    progress("Done!");
  } finally {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
