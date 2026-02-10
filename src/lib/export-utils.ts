import { saveAs } from "file-saver";

// ---- Excel Export ----
export async function exportToExcel(
  data: { sheets: { name: string; rows: Record<string, unknown>[] }[] },
  filename: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  for (const sheet of data.sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${filename}.xlsx`);
}

// ---- Word Export (HTML-based .doc) ----
export function exportToWord(html: string, filename: string): void {
  const fullHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.5; }
      h1 { font-size: 18pt; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 6px; }
      h2 { font-size: 14pt; color: #1a1a1a; margin-top: 18pt; }
      h3 { font-size: 12pt; color: #444; }
      table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
      th { background-color: #1a1a1a; color: white; padding: 8px 12px; text-align: left; font-weight: bold; }
      td { padding: 6px 12px; border: 1px solid #ddd; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      .highlight { background-color: #fff3cd; padding: 8px; border-left: 4px solid #ffc107; margin: 12pt 0; }
      .danger { color: #dc3545; font-weight: bold; }
    </style>
    </head><body>${html}</body></html>`;
  const blob = new Blob([fullHtml], { type: "application/msword" });
  saveAs(blob, `${filename}.doc`);
}

// ---- PowerPoint Export (HTML slide deck) ----
export function exportToPowerPoint(
  data: {
    slides: {
      title: string;
      subtitle?: string;
      bullets?: string[];
      table?: { headers: string[]; rows: string[][] };
    }[];
  },
  filename: string
): void {
  // Generate an HTML-based slide deck that can be opened and converted
  let slidesHtml = "";
  for (let i = 0; i < data.slides.length; i++) {
    const slide = data.slides[i];
    slidesHtml += `
      <div style="page-break-before: ${i > 0 ? "always" : "auto"}; padding: 40px 60px; min-height: 500px; border: 1px solid #e0e0e0; margin-bottom: 20px; background: white;">
        <h1 style="font-size: 28pt; color: #1a1a1a; margin: 0 0 8px 0; font-family: Calibri, Arial, sans-serif;">${slide.title}</h1>
        ${slide.subtitle ? `<p style="font-size: 16pt; color: #666; margin: 0 0 24px 0; font-family: Calibri, Arial, sans-serif;">${slide.subtitle}</p>` : ""}
        ${
          slide.bullets
            ? `<ul style="font-size: 18pt; line-height: 1.6; color: #333; font-family: Calibri, Arial, sans-serif; padding-left: 24px;">
            ${slide.bullets.map((b) => `<li style="margin-bottom: 8px;">${b}</li>`).join("")}
          </ul>`
            : ""
        }
        ${
          slide.table
            ? `<table style="border-collapse: collapse; width: 100%; margin-top: 16px; font-family: Calibri, Arial, sans-serif;">
            <tr>${slide.table.headers.map((h) => `<th style="background: #1a1a1a; color: white; padding: 10px 14px; text-align: left; font-size: 12pt;">${h}</th>`).join("")}</tr>
            ${slide.table.rows.map((row) => `<tr>${row.map((cell) => `<td style="padding: 8px 14px; border: 1px solid #ddd; font-size: 11pt;">${cell}</td>`).join("")}</tr>`).join("")}
          </table>`
            : ""
        }
        <div style="position: relative; bottom: 0; right: 0; text-align: right; font-size: 9pt; color: #999; margin-top: 24px;">Slide ${i + 1} of ${data.slides.length}</div>
      </div>`;
  }

  const fullHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:p="urn:schemas-microsoft-com:office:powerpoint"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      @media print { @page { size: landscape; margin: 0.5in; } }
      body { font-family: Calibri, Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
    </style>
    </head><body>${slidesHtml}</body></html>`;

  const blob = new Blob([fullHtml], {
    type: "application/vnd.ms-powerpoint",
  });
  saveAs(blob, `${filename}.ppt`);
}

// ---- PDF Export (print-based) ----
export function exportToPDF(html: string, filename: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html><head>
    <title>${filename}</title>
    <style>
      @media print { @page { margin: 0.75in; } }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { font-size: 20pt; color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }
      h2 { font-size: 15pt; color: #1a1a1a; margin-top: 24px; }
      h3 { font-size: 12pt; color: #444; }
      table { border-collapse: collapse; width: 100%; margin: 16px 0; }
      th { background-color: #1a1a1a; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 6px 12px; border: 1px solid #ddd; }
      tr:nth-child(even) { background-color: #f5f5f5; }
      ul, ol { padding-left: 24px; }
      li { margin-bottom: 4px; }
    </style>
    </head><body>${html}</body></html>
  `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// ---- Parse Claude Report Response ----
export function parseReportResponse(response: string): {
  format: "HTML" | "EXCEL_JSON" | "SLIDES_JSON";
  content: string;
} {
  if (response.startsWith("[FORMAT:EXCEL_JSON]")) {
    return {
      format: "EXCEL_JSON",
      content: response.replace("[FORMAT:EXCEL_JSON]", "").trim(),
    };
  }
  if (response.startsWith("[FORMAT:SLIDES_JSON]")) {
    return {
      format: "SLIDES_JSON",
      content: response.replace("[FORMAT:SLIDES_JSON]", "").trim(),
    };
  }
  // Default to HTML — strip the tag if present
  return {
    format: "HTML",
    content: response.replace("[FORMAT:HTML]", "").trim(),
  };
}
