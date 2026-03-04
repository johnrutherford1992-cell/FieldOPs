'use client';

import { useState } from 'react';
import { Download, Mail, Send, Loader2 } from 'lucide-react';

interface ExportActionBarProps {
  onExportPdf: () => Promise<void>;
  onEmailSelf?: () => void;
  onForwardEmail?: () => void;
  pdfLabel?: string;
}

export default function ExportActionBar({
  onExportPdf,
  onEmailSelf,
  onForwardEmail,
  pdfLabel = 'Export PDF',
}: ExportActionBarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportPdf();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-onyx text-white rounded-lg text-sm font-heading font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isExporting ? 'Generating...' : pdfLabel}
      </button>

      {onEmailSelf && (
        <button
          onClick={onEmailSelf}
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-glass text-onyx rounded-lg text-sm font-heading font-medium active:scale-[0.98] transition-transform border border-gray-200"
        >
          <Mail className="w-4 h-4" />
          Email to Self
        </button>
      )}

      {onForwardEmail && (
        <button
          onClick={onForwardEmail}
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-glass text-onyx rounded-lg text-sm font-heading font-medium active:scale-[0.98] transition-transform border border-gray-200"
        >
          <Send className="w-4 h-4" />
          Forward
        </button>
      )}
    </div>
  );
}
