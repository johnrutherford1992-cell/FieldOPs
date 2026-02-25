"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { db, generateId } from "@/lib/db";
import { generateMockLegalLetter } from "@/lib/report-prompts";
import type { LegalLetterType, LegalCorrespondence } from "@/lib/types";
import BigButton from "@/components/ui/BigButton";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Scale,
  FileText,
  Plus,
  X,
  Loader2,
  Printer,
  Send,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ContractReference {
  clauseNumber: string;
  quotedText: string;
}

const LETTER_TYPES: {
  id: LegalLetterType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "back_charge",
    label: "Back-Charge Notice",
    description: "Formal billing notice for costs incurred",
    icon: <AlertTriangle className="w-6 h-6" />,
  },
  {
    id: "delay_notice",
    label: "Delay Notice",
    description: "Document schedule impact and delays",
    icon: <Clock className="w-6 h-6" />,
  },
  {
    id: "cure_notice",
    label: "Notice to Cure",
    description: "Request correction of deficiency",
    icon: <AlertTriangle className="w-6 h-6" />,
  },
  {
    id: "change_directive",
    label: "Change Directive",
    description: "Authorize and document scope changes",
    icon: <Plus className="w-6 h-6" />,
  },
  {
    id: "rfi_followup",
    label: "RFI Follow-Up",
    description: "Follow up on overdue RFI responses",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "general",
    label: "General Correspondence",
    description: "Standard business correspondence",
    icon: <Scale className="w-6 h-6" />,
  },
];

const getStatusColor = (status: string): "green" | "amber" | "red" | "gray" => {
  switch (status) {
    case "draft":
      return "amber";
    case "reviewed":
      return "green";
    case "sent":
      return "green";
    default:
      return "gray";
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "draft":
      return "Draft";
    case "reviewed":
      return "Reviewed";
    case "sent":
      return "Sent";
    default:
      return status;
  }
};

export default function LegalPage() {
  const { activeProject, claudeApiKey, isLoading, setIsLoading } =
    useAppStore();
  const [view, setView] = useState<"compose" | "archive">("compose");
  const [step, setStep] = useState<"type" | "recipient" | "description" | "references" | "generated">(
    "type"
  );
  const [letters, setLetters] = useState<LegalCorrespondence[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<LegalCorrespondence | null>(null);

  // Form state
  const [selectedType, setSelectedType] = useState<LegalLetterType | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");
  const [description, setDescription] = useState("");
  const [contractReferences, setContractReferences] = useState<
    ContractReference[]
  >([]);
  const [newRefClause, setNewRefClause] = useState("");
  const [newRefQuote, setNewRefQuote] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState<string>("");

  // Load letters from database
  useEffect(() => {
    async function loadLetters() {
      if (!activeProject) return;
      const stored = await db.legalCorrespondence
        .where("projectId")
        .equals(activeProject.id)
        .toArray();
      setLetters(stored);
    }
    loadLetters();
  }, [activeProject]);

  const handleAddReference = () => {
    if (newRefClause.trim() && newRefQuote.trim()) {
      setContractReferences([
        ...contractReferences,
        { clauseNumber: newRefClause, quotedText: newRefQuote },
      ]);
      setNewRefClause("");
      setNewRefQuote("");
    }
  };

  const handleRemoveReference = (index: number) => {
    setContractReferences(contractReferences.filter((_, i) => i !== index));
  };

  const handleGenerateLetter = async () => {
    if (!activeProject || !selectedType) return;

    setIsLoading(true);
    try {
      let letterHtml: string;

      if (claudeApiKey) {
        // Call API with Claude key
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "legal-letter",
            apiKey: claudeApiKey,
            project: activeProject,
            letterType: selectedType,
            recipientName,
            recipientCompany,
            description,
            contractReferences,
          }),
        });

        if (!response.ok) throw new Error("Failed to generate letter");
        const data = await response.json();
        letterHtml = data.letter;
      } else {
        // Use mock generation
        letterHtml = generateMockLegalLetter(
          activeProject,
          selectedType,
          recipientName,
          recipientCompany,
          description,
          contractReferences
        );
      }

      // Save to database
      const newLetter: LegalCorrespondence = {
        id: generateId("letter"),
        projectId: activeProject.id,
        type: selectedType,
        triggeredBy: {
          dailyLogId: "",
          entryRef: "",
        },
        recipient: recipientCompany,
        contractReferences,
        generatedLetter: letterHtml,
        attachments: [],
        status: "draft",
        createdAt: new Date().toISOString(),
      };

      await db.legalCorrespondence.add(newLetter);
      setLetters([...letters, newLetter]);
      setGeneratedLetter(letterHtml);
      setStep("generated");
    } catch (error) {
      console.error("Error generating letter:", error);
      alert("Failed to generate letter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCompose = () => {
    setStep("type");
    setSelectedType(null);
    setRecipientName("");
    setRecipientCompany("");
    setDescription("");
    setContractReferences([]);
    setNewRefClause("");
    setNewRefQuote("");
    setGeneratedLetter("");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(generatedLetter);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleQuickSelectSubcontractor = (company: string, contactName: string) => {
    setRecipientCompany(company);
    setRecipientName(contactName);
  };

  // ---- Compose View ----
  if (view === "compose") {
    return (
      <AppShell>
        <div className="screen">
          <Header title="Legal Correspondence" backHref="/reports" />

          {/* Tab buttons */}
          <div className="flex gap-2 px-5 pt-5 border-b border-gray-100">
            <button
              onClick={() => setView("compose")}
              className="flex-1 pb-4 font-heading font-semibold text-field-base transition-colors text-onyx border-b-2 border-accent-violet"
            >
              Compose
            </button>
            <button
              onClick={() => setView("archive")}
              className="flex-1 pb-4 font-heading font-semibold text-field-base transition-colors text-warm-gray border-b-2 border-transparent"
            >
              Archive ({letters.length})
            </button>
          </div>

          <div className="px-5 pt-6 pb-8">
            {/* Generated Letter View */}
            {step === "generated" && (
              <div className="space-y-6">
                {/* Letter Preview */}
                <div
                  className="border-2 border-accent-violet rounded-lg p-6 bg-glass overflow-auto max-h-96"
                  dangerouslySetInnerHTML={{ __html: generatedLetter }}
                />

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 h-14 bg-accent-violet text-white rounded-lg font-heading font-semibold transition-all active:scale-95"
                  >
                    <Printer className="w-5 h-5" />
                    Print
                  </button>
                  <button
                    onClick={handleBackToCompose}
                    className="flex items-center justify-center gap-2 h-14 border-2 border-accent-violet text-accent-violet rounded-lg font-heading font-semibold transition-all active:scale-95"
                  >
                    <FileText className="w-5 h-5" />
                    New Letter
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Letter Type */}
            {step === "type" && (
              <div className="space-y-6">
                <h3 className="font-heading font-semibold text-field-base">
                  Select Letter Type
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {LETTER_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setStep("recipient");
                      }}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                        selectedType === type.id
                          ? "border-accent-violet bg-glass"
                          : "border-gray-100 bg-glass hover:border-gray-200"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">{type.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-semibold text-field-base">
                          {type.label}
                        </div>
                        <p className="text-field-sm text-warm-gray mt-1">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Recipient */}
            {step === "recipient" && (
              <div className="space-y-6">
                <h3 className="font-heading font-semibold text-field-base">
                  Recipient Information
                </h3>

                {/* Quick Select Subcontractors */}
                {activeProject && activeProject.subcontractors.length > 0 && (
                  <div className="space-y-3">
                    <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                      Quick Select Subcontractor
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {activeProject.subcontractors.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() =>
                            handleQuickSelectSubcontractor(
                              sub.company,
                              sub.primaryContact.name
                            )
                          }
                          className="flex-shrink-0 px-4 py-2 bg-accent-violet text-white rounded-lg font-body text-sm font-semibold transition-all active:scale-95 whitespace-nowrap"
                        >
                          {sub.company}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipient Name */}
                <div className="space-y-2">
                  <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-body focus:border-accent-violet outline-none transition-colors"
                  />
                </div>

                {/* Recipient Company */}
                <div className="space-y-2">
                  <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={recipientCompany}
                    onChange={(e) => setRecipientCompany(e.target.value)}
                    placeholder="ABC Plumbing, Inc."
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-body focus:border-accent-violet outline-none transition-colors"
                  />
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setStep("description")}
                  disabled={!recipientName.trim() || !recipientCompany.trim()}
                  className="w-full h-14 bg-accent-violet text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Continue
                </button>

                <button
                  onClick={() => setStep("type")}
                  className="w-full h-14 border-2 border-accent-violet text-accent-violet rounded-lg font-heading font-semibold transition-all active:scale-95"
                >
                  Back
                </button>
              </div>
            )}

            {/* Step 3: Description */}
            {step === "description" && (
              <div className="space-y-6">
                <h3 className="font-heading font-semibold text-field-base">
                  Matter Description
                </h3>

                <div className="space-y-2">
                  <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, delay, or matter that necessitates this correspondence..."
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-body focus:border-accent-violet outline-none transition-colors min-h-32 resize-none"
                  />
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setStep("references")}
                  disabled={!description.trim()}
                  className="w-full h-14 bg-accent-violet text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Continue
                </button>

                <button
                  onClick={() => setStep("recipient")}
                  className="w-full h-14 border-2 border-accent-violet text-accent-violet rounded-lg font-heading font-semibold transition-all active:scale-95"
                >
                  Back
                </button>
              </div>
            )}

            {/* Step 4: Contract References */}
            {step === "references" && (
              <div className="space-y-6">
                <h3 className="font-heading font-semibold text-field-base">
                  Contract References (Optional)
                </h3>

                {/* New Reference Form */}
                <div className="space-y-4 p-4 bg-glass rounded-lg border-2 border-gray-100">
                  <div className="space-y-2">
                    <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                      Clause Number
                    </label>
                    <input
                      type="text"
                      value={newRefClause}
                      onChange={(e) => setNewRefClause(e.target.value)}
                      placeholder="e.g., Section 3.2, Article 4"
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-body focus:border-accent-violet outline-none transition-colors bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                      Quoted Text
                    </label>
                    <textarea
                      value={newRefQuote}
                      onChange={(e) => setNewRefQuote(e.target.value)}
                      placeholder="Paste the relevant contract language here..."
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-body focus:border-accent-violet outline-none transition-colors bg-white min-h-20 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleAddReference}
                    disabled={!newRefClause.trim() || !newRefQuote.trim()}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-accent-violet text-white rounded-lg font-heading font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Add Reference
                  </button>
                </div>

                {/* References List */}
                {contractReferences.length > 0 && (
                  <div className="space-y-3">
                    <label className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                      Added References
                    </label>
                    {contractReferences.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-4 border-2 border-gray-100 rounded-lg bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-heading font-semibold text-field-sm mb-2">
                              {ref.clauseNumber}
                            </div>
                            <p className="text-field-sm text-warm-gray italic">
                              &quot;{ref.quotedText}&quot;
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveReference(idx)}
                            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                          >
                            <X className="w-5 h-5 text-warm-gray" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleGenerateLetter}
                    disabled={isLoading}
                    className="w-full h-14 bg-accent-violet text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Generate Letter
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setStep("description")}
                    className="w-full h-14 border-2 border-accent-violet text-accent-violet rounded-lg font-heading font-semibold transition-all active:scale-95"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // ---- Archive View ----
  return (
    <AppShell>
      <div className="screen">
        <Header title="Legal Correspondence" backHref="/reports" />

        {/* Tab buttons */}
        <div className="flex gap-2 px-5 pt-5 border-b border-gray-100">
          <button
            onClick={() => setView("compose")}
            className="flex-1 pb-4 font-heading font-semibold text-field-base transition-colors text-warm-gray border-b-2 border-transparent"
          >
            Compose
          </button>
          <button
            onClick={() => setView("archive")}
            className="flex-1 pb-4 font-heading font-semibold text-field-base transition-colors text-onyx border-b-2 border-accent-violet"
          >
            Archive ({letters.length})
          </button>
        </div>

        <div className="px-5 pt-6 pb-8">
          {selectedLetter ? (
            // Letter Detail View
            <div className="space-y-6">
              <button
                onClick={() => setSelectedLetter(null)}
                className="text-onyx font-heading font-semibold text-field-base flex items-center gap-2 transition-colors hover:text-warm-gray"
              >
                ← Back to Archive
              </button>

              {/* Letter Preview */}
              <div
                className="border-2 border-accent-violet rounded-lg p-6 bg-glass overflow-auto max-h-96"
                dangerouslySetInnerHTML={{
                  __html: selectedLetter.generatedLetter || "",
                }}
              />

              {/* Status and Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
                    Status:
                  </span>
                  <StatusBadge
                    label={getStatusLabel(selectedLetter.status)}
                    color={getStatusColor(selectedLetter.status)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const printWindow = window.open(
                        "",
                        "",
                        "width=800,height=600"
                      );
                      if (printWindow) {
                        printWindow.document.write(
                          selectedLetter.generatedLetter || ""
                        );
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    className="flex items-center justify-center gap-2 h-14 bg-accent-violet text-white rounded-lg font-heading font-semibold transition-all active:scale-95"
                  >
                    <Printer className="w-5 h-5" />
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedLetter(null)}
                    className="flex items-center justify-center gap-2 h-14 border-2 border-accent-violet text-accent-violet rounded-lg font-heading font-semibold transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : letters.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Scale className="w-12 h-12 text-warm-gray mb-4 opacity-50" />
              <h3 className="font-heading font-semibold text-field-base mb-2">
                No Letters Yet
              </h3>
              <p className="text-warm-gray text-field-sm mb-6 max-w-xs">
                Compose your first legal correspondence to build your archive.
              </p>
              <button
                onClick={() => setView("compose")}
                className="px-6 h-12 bg-accent-violet text-white rounded-lg font-heading font-semibold transition-all active:scale-95"
              >
                Start Composing
              </button>
            </div>
          ) : (
            // Letters List
            <div className="space-y-3">
              {letters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  className="w-full text-left"
                >
                  <BigButton
                    label={
                      LETTER_TYPES.find((t) => t.id === letter.type)?.label ||
                      letter.type
                    }
                    sublabel={letter.recipient}
                    icon={
                      LETTER_TYPES.find((t) => t.id === letter.type)?.icon || (
                        <FileText className="w-6 h-6" />
                      )
                    }
                    badge={getStatusLabel(letter.status)}
                    badgeColor={getStatusColor(letter.status)}
                    variant="light"
                    chevron={true}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
