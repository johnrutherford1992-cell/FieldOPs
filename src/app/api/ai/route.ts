import { NextRequest, NextResponse } from "next/server";

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
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
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
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

const SYSTEM_PROMPT_INSIGHTS = `You are an AI assistant for FieldOps, a construction field intelligence platform used by Blackstone Construction. You analyze structured project data (daily logs, manpower, equipment, work performed, safety incidents, delays, conflicts, change orders, inspections, RFIs, etc.) and provide clear, actionable insights.

Rules:
- Answer concisely and specifically based on the data provided
- Use construction industry terminology naturally
- Highlight any safety concerns, schedule risks, or cost implications
- When numbers are involved, provide specific figures from the data
- Format responses with markdown for readability
- If the data doesn't contain enough information to answer, say so clearly`;

const SYSTEM_PROMPT_REPORT = `You are an AI report generator for FieldOps, a construction field intelligence platform. You generate professional construction reports from structured project data.

Rules:
- Generate well-structured, professional reports suitable for the specified audience
- Use construction industry standard formatting and terminology
- Include specific data points, dates, and figures from the provided data
- Structure reports with clear sections, headers, and summaries
- For Excel-targeted reports: structure data as JSON arrays with column headers, making it easy to convert to spreadsheet format. Return a JSON object with "sheets" array, each sheet having "name" and "rows" (array of objects).
- For Word/PDF-targeted reports: generate well-formatted HTML with professional styling
- For PowerPoint-targeted reports: structure as JSON with "slides" array, each slide having "title", "subtitle" (optional), and "bullets" (array of strings) or "table" (object with headers and rows)
- Always indicate the output format in your response by starting with a format tag: [FORMAT:HTML], [FORMAT:EXCEL_JSON], or [FORMAT:SLIDES_JSON]`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    switch (action) {
      case "insight": {
        const { question, projectData } = body as {
          question: string;
          projectData: string;
          apiKey: string;
          action: string;
        };

        const userPrompt = `Here is the current project data:\n\n${projectData}\n\nQuestion: ${question}`;
        const answer = await callClaude(apiKey, SYSTEM_PROMPT_INSIGHTS, userPrompt);
        return NextResponse.json({ answer });
      }

      case "generate-report": {
        const { reportType, reportTitle, projectData, format, customInstructions } =
          body as {
            reportType: string;
            reportTitle: string;
            projectData: string;
            format: "excel" | "pdf" | "word" | "powerpoint";
            customInstructions?: string;
            apiKey: string;
            action: string;
          };

        const formatInstructions = {
          excel:
            "Generate this report structured for Excel. Return a JSON object starting with [FORMAT:EXCEL_JSON] that has a 'sheets' array. Each sheet should have 'name' (string) and 'rows' (array of objects where keys are column headers).",
          pdf: "Generate this report as well-formatted HTML starting with [FORMAT:HTML]. Use professional styling with tables, headers, and clear sections suitable for PDF printing.",
          word: "Generate this report as well-formatted HTML starting with [FORMAT:HTML]. Use professional styling with headers, paragraphs, tables, and bullet points suitable for a Word document.",
          powerpoint:
            "Generate this report structured for PowerPoint. Return a JSON object starting with [FORMAT:SLIDES_JSON] that has a 'slides' array. Each slide should have 'title' (string), optional 'subtitle' (string), and either 'bullets' (string array) or 'table' (object with 'headers' string array and 'rows' string[][] array).",
        };

        const userPrompt = `Generate a "${reportTitle}" report (type: ${reportType}).

Format: ${formatInstructions[format]}

${customInstructions ? `Additional instructions: ${customInstructions}\n\n` : ""}Project data:\n\n${projectData}`;

        const report = await callClaude(apiKey, SYSTEM_PROMPT_REPORT, userPrompt);
        return NextResponse.json({ report, format });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("AI API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process AI request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
