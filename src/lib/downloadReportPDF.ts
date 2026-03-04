import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import { PrintableReport } from "@/components/export/PrintableReport";
import type { Product } from "@/data/mockProducts";
import React from "react";

/**
 * Renders the PrintableReport component off-screen, captures it with html2canvas,
 * and produces a true PDF download (no print dialog).
 * Works on both desktop and mobile browsers.
 */
export async function downloadReportAsPDF(
  product: Product,
  analysisData: Record<string, unknown> | null,
  options?: { title?: string; mode?: string; onProgress?: (msg: string) => void }
): Promise<void> {
  const progress = options?.onProgress || (() => {});

  progress("Preparing report layout…");

  // 1. Create an off-screen container at a fixed desktop width
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 900px;
    background: white;
    color: #1a1a2e;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    z-index: -1;
    padding: 40px;
  `;
  document.body.appendChild(container);

  // 2. Render the PrintableReport into the off-screen container
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(
      React.createElement(PrintableReport, {
        product,
        analysisData,
        analysisTitle: options?.title,
        mode: options?.mode,
      })
    );
    // Give React a tick to render
    setTimeout(resolve, 500);
  });

  progress("Rendering pages…");

  try {
    // 3. Capture the rendered HTML as a canvas
    const canvas = await html2canvas(container, {
      scale: 2, // high-res
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 900,
      windowWidth: 900,
      logging: false,
    });

    progress("Generating PDF…");

    // 4. Calculate page dimensions for A4
    const PDF_WIDTH_MM = 210;
    const PDF_HEIGHT_MM = 297;
    const MARGIN_MM = 10;

    const contentWidthMM = PDF_WIDTH_MM - 2 * MARGIN_MM;
    const contentHeightMM = PDF_HEIGHT_MM - 2 * MARGIN_MM;

    // Canvas pixels → mm scale
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;
    const pxPerMm = imgWidthPx / contentWidthMM;
    const pageHeightPx = contentHeightMM * pxPerMm;

    const pdf = new jsPDF("p", "mm", "a4");
    let yOffsetPx = 0;
    let pageNum = 0;

    while (yOffsetPx < imgHeightPx) {
      if (pageNum > 0) pdf.addPage();

      // Slice the canvas for this page
      const sliceHeight = Math.min(pageHeightPx, imgHeightPx - yOffsetPx);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = imgWidthPx;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, yOffsetPx, imgWidthPx, sliceHeight,
          0, 0, imgWidthPx, sliceHeight
        );
      }

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
      const sliceHeightMM = sliceHeight / pxPerMm;

      pdf.addImage(pageImgData, "JPEG", MARGIN_MM, MARGIN_MM, contentWidthMM, sliceHeightMM);

      yOffsetPx += pageHeightPx;
      pageNum++;

      progress(`Rendering page ${pageNum}…`);
    }

    // 5. Trigger download
    const filename = `${(product?.name || "analysis").replace(/[^a-zA-Z0-9]/g, "-")}-report.pdf`;
    pdf.save(filename);

    progress("Done!");
  } finally {
    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  }
}
