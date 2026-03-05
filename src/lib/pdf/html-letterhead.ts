// ============================================================
// HTML Template Wrapper for html2pdf.js Path
// Used for JHA, Weekly Reports, Legal Correspondence
// ============================================================

interface HtmlLetterheadParams {
  htmlContent: string;
  projectName: string;
  projectAddress: string;
  documentTitle: string;
  documentDate: string;
}

export function wrapInLetterhead(params: HtmlLetterheadParams): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          color: #000;
          font-size: 11pt;
          line-height: 1.5;
          padding: 0.5in 0.75in;
        }
        .letterhead-header {
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .company-name {
          font-size: 16pt;
          font-weight: bold;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .project-info {
          font-size: 9pt;
          color: #8c8c8c;
          margin-top: 4px;
        }
        .doc-title {
          font-size: 14pt;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .doc-date {
          font-size: 9pt;
          color: #8c8c8c;
          margin-bottom: 16px;
        }
        .content {
          line-height: 1.6;
        }
        .content h1, .content h2, .content h3 {
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .content table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        .content th, .content td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: left;
          font-size: 10pt;
        }
        .content th {
          background: #f3f4f6;
          font-weight: bold;
        }
        .content ul, .content ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        .content li { margin-bottom: 4px; }
        .footer-notice {
          margin-top: 32px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
          font-size: 7pt;
          color: #8c8c8c;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="letterhead-header">
        <div class="company-name">Blackstone Construction</div>
        <div class="project-info">${escapeHtml(params.projectName)} | ${escapeHtml(params.projectAddress)}</div>
      </div>
      <div class="doc-title">${escapeHtml(params.documentTitle)}</div>
      <div class="doc-date">${escapeHtml(params.documentDate)}</div>
      <div class="content">${params.htmlContent}</div>
      <div class="footer-notice">
        CONFIDENTIAL — Blackstone Construction, LLC. This document may contain privileged information.
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
