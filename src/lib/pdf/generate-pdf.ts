// ============================================================
// PDF Generation Orchestrator
// Routes document types to the correct rendering strategy
// ============================================================

import type { Project, DailyLog, NoticeLogEntry, ProductivityAnalytics, DelayEvent } from '@/lib/types';
import { wrapInLetterhead } from './html-letterhead';
import { formatDate } from './pdf-styles';

// ── Document types ──

export type PdfDocumentType =
  | 'jha'
  | 'daily-log'
  | 'weekly-report'
  | 'legal-letter'
  | 'notice-log'
  | 'analytics'
  | 'causation';

// ── Data payloads per document type ──

export interface HtmlPdfData {
  htmlContent: string;
  projectName: string;
  projectAddress: string;
  documentTitle: string;
  documentDate: string;
}

export interface DailyLogPdfData {
  log: DailyLog;
  project: Project;
}

export interface NoticeLogPdfData {
  notices: NoticeLogEntry[];
  project: Project;
}

export interface AnalyticsPdfData {
  analytics: ProductivityAnalytics[];
  project: Project;
}

export interface CausationPdfData {
  delayEvents: DelayEvent[];
  project: Project;
}

// ── Main entry point ──

export async function generatePdf(
  type: 'jha' | 'weekly-report' | 'legal-letter',
  data: HtmlPdfData
): Promise<Blob>;
export async function generatePdf(
  type: 'daily-log',
  data: DailyLogPdfData
): Promise<Blob>;
export async function generatePdf(
  type: 'notice-log',
  data: NoticeLogPdfData
): Promise<Blob>;
export async function generatePdf(
  type: 'analytics',
  data: AnalyticsPdfData
): Promise<Blob>;
export async function generatePdf(
  type: 'causation',
  data: CausationPdfData
): Promise<Blob>;
export async function generatePdf(
  type: PdfDocumentType,
  data: HtmlPdfData | DailyLogPdfData | NoticeLogPdfData | AnalyticsPdfData | CausationPdfData
): Promise<Blob> {
  switch (type) {
    case 'jha':
    case 'weekly-report':
    case 'legal-letter':
      return generateFromHtml(data as HtmlPdfData);
    case 'daily-log':
      return generateFromReactPdf('daily-log', data as DailyLogPdfData);
    case 'notice-log':
      return generateFromReactPdf('notice-log', data as NoticeLogPdfData);
    case 'analytics':
      return generateFromReactPdf('analytics', data as AnalyticsPdfData);
    case 'causation':
      return generateFromReactPdf('causation', data as CausationPdfData);
  }
}

// ── HTML → PDF (html2pdf.js) ──

async function generateFromHtml(data: HtmlPdfData): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default;

  const wrappedHtml = wrapInLetterhead({
    htmlContent: data.htmlContent,
    projectName: data.projectName,
    projectAddress: data.projectAddress,
    documentTitle: data.documentTitle,
    documentDate: data.documentDate,
  });

  // Create an off-screen container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '8.5in';
  container.innerHTML = wrappedHtml;
  document.body.appendChild(container);

  try {
    const blob: Blob = await html2pdf()
      .set({
        margin: 0,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(container)
      .outputPdf('blob');
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

// ── Structured data → PDF (@react-pdf/renderer) ──

async function generateFromReactPdf(
  type: 'daily-log',
  data: DailyLogPdfData
): Promise<Blob>;
async function generateFromReactPdf(
  type: 'notice-log',
  data: NoticeLogPdfData
): Promise<Blob>;
async function generateFromReactPdf(
  type: 'analytics',
  data: AnalyticsPdfData
): Promise<Blob>;
async function generateFromReactPdf(
  type: 'causation',
  data: CausationPdfData
): Promise<Blob>;
async function generateFromReactPdf(
  type: string,
  data: DailyLogPdfData | NoticeLogPdfData | AnalyticsPdfData | CausationPdfData
): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  const React = (await import('react')).default;

  let element: React.ReactElement;

  switch (type) {
    case 'daily-log': {
      const { DailyLogDocument } = await import('./daily-log-pdf');
      const d = data as DailyLogPdfData;
      element = React.createElement(DailyLogDocument, {
        log: d.log,
        project: d.project,
      });
      break;
    }
    case 'notice-log': {
      const { NoticeLogDocument } = await import('./notice-log-pdf');
      const d = data as NoticeLogPdfData;
      element = React.createElement(NoticeLogDocument, {
        notices: d.notices,
        project: d.project,
      });
      break;
    }
    case 'analytics': {
      const { AnalyticsDocument } = await import('./analytics-pdf');
      const d = data as AnalyticsPdfData;
      element = React.createElement(AnalyticsDocument, {
        analytics: d.analytics,
        project: d.project,
      });
      break;
    }
    case 'causation': {
      const { CausationDocument } = await import('./causation-pdf');
      const d = data as CausationPdfData;
      element = React.createElement(CausationDocument, {
        delayEvents: d.delayEvents,
        project: d.project,
      });
      break;
    }
    default:
      throw new Error(`Unknown document type: ${type}`);
  }

  return await pdf(element).toBlob();
}

// ── Download helper ──

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ── Convenience: generate + download in one call ──

export async function exportPdf(
  type: PdfDocumentType,
  data: HtmlPdfData | DailyLogPdfData | NoticeLogPdfData | AnalyticsPdfData | CausationPdfData,
  filename: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await generatePdf(type as any, data as any);
  downloadPdf(blob, filename);
}

// Re-export formatDate for convenience
export { formatDate };
