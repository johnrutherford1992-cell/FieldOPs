import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock jha-prompts to avoid importing the full module ──
vi.mock("@/lib/jha-prompts", () => ({
  buildJHAPrompt: vi.fn(() => "mocked JHA prompt"),
  buildToolboxTalkPrompt: vi.fn(() => "mocked toolbox prompt"),
}));

// Import the POST handler after mocks are set up
import { POST } from "@/app/api/jha/route";

// ── Mock global fetch for Claude API calls ──
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

function createRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/jha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/jha", () => {
  // ────────────────────────────────────────────────────────
  // TEST 8: Returns 400 when apiKey is missing
  // ────────────────────────────────────────────────────────
  it("returns 400 when apiKey is missing", async () => {
    const request = createRequest({
      projectName: "Test Project",
      date: "2025-06-15",
      tasks: [],
      weather: { conditions: "Clear", temperature: 75, temperatureUnit: "F" },
      equipment: [],
      crewSize: 5,
      siteNotes: "",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("API key required");
  });

  // ────────────────────────────────────────────────────────
  // TEST 9: Returns JHA and toolbox talk on success
  // ────────────────────────────────────────────────────────
  it("returns JHA and toolbox talk HTML on success", async () => {
    // Mock Claude API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "<div>Generated content</div>" }],
      }),
    });

    const request = createRequest({
      apiKey: "sk-test-key",
      projectName: "Test Project",
      date: "2025-06-15",
      tasks: [
        {
          csiDivision: "03",
          activity: "Concrete Forming",
          task: "Wall Form Setup",
          taktZone: "L1-A",
        },
      ],
      weather: { conditions: "Clear", temperature: 75, temperatureUnit: "F" },
      equipment: [],
      crewSize: 5,
      siteNotes: "Test notes",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jha).toBe("<div>Generated content</div>");
    expect(data.toolboxTalk).toBe("<div>Generated content</div>");

    // Verify Claude API was called twice (JHA + Toolbox Talk)
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify the API key was passed in headers
    const firstCall = mockFetch.mock.calls[0]!;
    expect(firstCall[0]).toBe("https://api.anthropic.com/v1/messages");
    expect(firstCall[1].headers["x-api-key"]).toBe("sk-test-key");
  });
});
