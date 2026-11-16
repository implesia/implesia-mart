/**
 * Client-only helper to save the on-screen invoice/label sheets as a PDF
 * without opening the browser print dialog.
 */

const LABEL_MM = [101.6, 152.4] as const;
const INVOICE_MM = [210, 297] as const;

export function printPdfFilename(kind: "invoice" | "label" | "both", numbers: string[]) {
  const suffix = kind === "both" ? "print" : kind;
  const unique = numbers.map((number) => number.trim()).filter(Boolean);
  if (unique.length === 1) return `${unique[0]}-${suffix}.pdf`;
  return `orders-${suffix}.pdf`;
}

function pageSize(sheet: HTMLElement) {
  return sheet.classList.contains("sheet-label") ? LABEL_MM : INVOICE_MM;
}

export async function downloadPrintSheets(sheets: HTMLElement[], filename: string) {
  if (sheets.length === 0) {
    throw new Error("Nothing to download.");
  }
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  let pdf: InstanceType<typeof jsPDF> | null = null;
  for (const sheet of sheets) {
    const [width, height] = pageSize(sheet);
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_document, cloned) => {
        cloned.style.boxShadow = "none";
        cloned.style.margin = "0";
      },
    });
    const image = canvas.toDataURL("image/jpeg", 0.95);
    const orientation = height >= width ? "portrait" : "landscape";
    if (pdf == null) {
      pdf = new jsPDF({ orientation, unit: "mm", format: [width, height] });
    } else {
      pdf.addPage([width, height], orientation);
    }
    pdf.addImage(image, "JPEG", 0, 0, width, height);
  }
  if (pdf == null) {
    throw new Error("Nothing to download.");
  }
  pdf.save(filename);
}
