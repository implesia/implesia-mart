/**
 * Client-only helper to save the on-screen invoice/label sheets as a PDF
 * directly from the DOM. Does not call window.print(), so the file has no
 * browser header or footer.
 *
 * html2canvas 1.x throws on Tailwind v4 oklch()/lab() colors. html2canvas-pro
 * parses those, and we also flatten computed colors to rgb as a safety net.
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

function toRgb(value: string) {
  if (!value || value === "none" || value === "transparent") return value;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return value;
  ctx.fillStyle = "#000";
  ctx.fillStyle = value;
  return typeof ctx.fillStyle === "string" ? ctx.fillStyle : value;
}

const COLOR_PROPS = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "columnRuleColor",
] as const;

function flattenComputedColors(root: HTMLElement) {
  const view = root.ownerDocument.defaultView;
  if (!view) return;
  const nodes = [root, ...root.querySelectorAll<HTMLElement>("*")];
  for (const el of nodes) {
    const cs = view.getComputedStyle(el);
    for (const prop of COLOR_PROPS) {
      const current = cs[prop];
      if (current && current !== "none") el.style[prop] = toRgb(current);
    }
    el.style.boxShadow = "none";
  }
}

function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll("img")];
  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

export async function downloadPrintSheets(sheets: HTMLElement[], filename: string) {
  if (sheets.length === 0) {
    throw new Error("Nothing to download.");
  }
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready.catch(() => undefined);
  }
  await Promise.all(sheets.map((sheet) => waitForImages(sheet)));
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  let pdf: InstanceType<typeof jsPDF> | null = null;
  for (const sheet of sheets) {
    const [width, height] = pageSize(sheet);
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_document, cloned) => {
        cloned.style.boxShadow = "none";
        cloned.style.margin = "0";
        cloned.style.outline = "none";
        flattenComputedColors(cloned);
      },
    });
    const image = canvas.toDataURL("image/png");
    const orientation = height >= width ? "portrait" : "landscape";
    if (pdf == null) {
      pdf = new jsPDF({ orientation, unit: "mm", format: [width, height] });
    } else {
      pdf.addPage([width, height], orientation);
    }
    pdf.addImage(image, "PNG", 0, 0, width, height);
  }
  if (pdf == null) {
    throw new Error("Nothing to download.");
  }
  pdf.save(filename);
}
