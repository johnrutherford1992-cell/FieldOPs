import { NextRequest, NextResponse } from "next/server";
import { buildJHAPrompt, buildToolboxTalkPrompt } from "@/lib/jha-prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiKey,
      projectName,
      date,
      tasks,
      weather,
      equipment,
      crewSize,
      siteNotes,
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 400 }
      );
    }

    // Build prompts
    const jhaPrompt = buildJHAPrompt(
      projectName,
      date,
      tasks,
      weather,
      equipment,
      crewSize,
      siteNotes
    );

    const toolboxPrompt = buildToolboxTalkPrompt(
      projectName,
      date,
      tasks,
      weather,
      equipment
    );

    // Call Claude API for JHA
    const [jhaResponse, toolboxResponse] = await Promise.all([
      callClaude(apiKey, jhaPrompt),
      callClaude(apiKey, toolboxPrompt),
    ]);

    return NextResponse.json({
      jha: jhaResponse,
      toolboxTalk: toolboxResponse,
    });
  } catch (error) {
    console.error("JHA generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate JHA" },
      { status: 500 }
    );
  }
}

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
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  // Extract text content from Claude response
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );

  return textContent?.text || "";
}
