import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

const MARGIN = 24;

/** Render one or more DOM nodes into a landscape A4 PDF, stacked in order. */
export async function exportNodesToPdf(nodes: HTMLElement[], filename: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - MARGIN * 2;

  let y = MARGIN;
  let first = true;

  for (const node of nodes) {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const ratio = canvas.height / canvas.width;
    const w = maxW;
    const h = w * ratio;

    if (!first && y + h > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.addImage(canvas.toDataURL("image/png"), "PNG", MARGIN, y, w, Math.min(h, pageH - MARGIN * 2));
    y += Math.min(h, pageH - MARGIN * 2) + 16;
    first = false;
  }

  doc.save(filename);
}
