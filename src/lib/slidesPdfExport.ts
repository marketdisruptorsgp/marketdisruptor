import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React from "react";
import ReactDOM from "react-dom/client";

/**
 * Renders each React slide node at 1920×1080 off-screen,
 * captures with html2canvas, and compiles into a landscape PDF.
 */
export async function downloadSlidesPDF(
  slides: React.ReactNode[],
  title: string
): Promise<void> {
  const SLIDE_W = 1920;
  const SLIDE_H = 1080;

  // Create off-screen container
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: ${SLIDE_W}px; height: ${SLIDE_H}px;
    overflow: hidden; z-index: -1;
    background: white;
  `;
  document.body.appendChild(container);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [SLIDE_W, SLIDE_H],
    hotfixes: ["px_scaling"],
  });

  let firstPage = true;

  for (let i = 0; i < slides.length; i++) {
    // Mount slide into container
    const slideWrapper = document.createElement("div");
    slideWrapper.style.cssText = `width: ${SLIDE_W}px; height: ${SLIDE_H}px; position: relative; overflow: hidden;`;
    container.innerHTML = "";
    container.appendChild(slideWrapper);

    const root = ReactDOM.createRoot(slideWrapper);
    root.render(React.createElement(React.Fragment, null, slides[i]));

    // Wait for render + images to load
    await new Promise((r) => setTimeout(r, 300));

    // Wait for any images to fully load
    const images = slideWrapper.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    // Capture with html2canvas
    const canvas = await html2canvas(slideWrapper, {
      width: SLIDE_W,
      height: SLIDE_H,
      scale: 2, // 2x for crisp rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Add to PDF
    if (!firstPage) {
      doc.addPage([SLIDE_W, SLIDE_H], "landscape");
    }
    firstPage = false;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    doc.addImage(imgData, "JPEG", 0, 0, SLIDE_W, SLIDE_H);

    // Cleanup
    root.unmount();
  }

  // Remove off-screen container
  document.body.removeChild(container);

  // Save
  const safeName = title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Pitch Deck";
  doc.save(`${safeName} - Presentation.pdf`);
}
