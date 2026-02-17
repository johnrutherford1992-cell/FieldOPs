"use client";

import { ShieldCheck, Download, Printer } from "lucide-react";

interface JHADisplayProps {
  projectName: string;
  date: string;
  htmlContent: string;
  onExportPDF?: () => void;
}

export default function JHADisplay({
  projectName,
  date,
  htmlContent,
  onExportPDF,
}: JHADisplayProps) {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div className="space-y-4">
      {/* Document header */}
      <div className="bg-accent-violet text-white rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-medium">
              Job Hazard Analysis
            </h2>
            <p className="text-white/60 text-sm">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/logos/blackstone-white.png"
            alt="Blackstone"
            className="h-5 opacity-60"
          />
          <span className="text-white/40 text-xs">|</span>
          <span className="text-white/60 text-sm">{projectName}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-glass text-onyx rounded-lg text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-glass text-onyx rounded-lg text-sm font-medium active:scale-[0.98] transition-transform"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Rendered JHA content */}
      <div
        className="jha-rendered-content bg-glass border border-white/[0.06] rounded-xl p-5 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
