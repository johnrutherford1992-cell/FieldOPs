import { NextRequest, NextResponse } from "next/server";
import {
  buildWeeklyReportPrompt,
  buildChangeOrderPrompt,
  buildLegalLetterPrompt,
} from "@/lib/report-prompts";
import type {
  Project,
  DailyLog,
  ReportFormat,
  ChangeEntry,
  LegalLetterType,
} from "@/lib/types";

// ---- Shared Claude API caller ----
async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );
  return textContent?.text || "";
}

// ---- POST handler ----
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    switch (action) {
      case "weekly-report": {
        const { project, logs, formatType, weekStart, weekEnd } = body as {
          project: Project;
          logs: DailyLog[];
          formatType: ReportFormat;
          weekStart: string;
          weekEnd: string;
          apiKey: string;
          action: string;
        };
        const prompt = buildWeeklyReportPrompt(project, logs, formatType, weekStart, weekEnd);
        const report = await callClaude(apiKey, prompt);
        return NextResponse.json({ report });
      }

      case "change-order": {
        const { project, changeEntry, dailyLogDate, affectedSubNames } = body as {
          project: Project;
          changeEntry: ChangeEntry;
          dailyLogDate: string;
          affectedSubNames: string[];
          apiKey: string;
          action: string;
        };
        const prompt = buildChangeOrderPrompt(project, changeEntry, dailyLogDate, affectedSubNames);
        const draft = await callClaude(apiKey, prompt);
        return NextResponse.json({ draft });
      }

      case "legal-letter": {
        const {
          project,
          letterType,
          recipientName,
          recipientCompany,
          description,
          contractReferences,
          relatedDailyLogDate,
        } = body as {
          project: Project;
          letterType: LegalLetterType;
          recipientName: string;
          recipientCompany: string;
          description: string;
          contractReferences: { clauseNumber: string; quotedText: string }[];
          relatedDailyLogDate?: string;
          apiKey: string;
          action: string;
        };
        const prompt = buildLegalLetterPrompt(
          project,
          letterType,
          recipientName,
          recipientCompany,
          description,
          contractReferences,
          relatedDailyLogDate
        );
        const letter = await callClaude(apiKey, prompt);
        return NextResponse.json({ letter });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
