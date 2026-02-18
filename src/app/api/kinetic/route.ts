import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// Kinetic Craft — Resource Scheduling API Bridge
// REST + HMAC-signed webhooks for cross-app resource allocation
// ============================================================

const KINETIC_API_URL = process.env.KINETIC_API_URL || "https://api.kinetic.craft/v1";
const KINETIC_API_KEY = process.env.KINETIC_API_KEY || "";
const KINETIC_WEBHOOK_SECRET = process.env.KINETIC_WEBHOOK_SECRET || "";

// ── POST: Submit resource request to Kinetic Craft ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { action, ...payload } = body;
    if (typeof action !== "string") {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    if (action === "request") {
      return handleResourceRequest(payload);
    } else if (action === "webhook") {
      return handleIncomingWebhook(payload);
    } else if (action === "cancel") {
      return handleCancelRequest(payload);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Kinetic API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ── Submit a new resource request ──

async function handleResourceRequest(payload: {
  fieldOpsProjectId: string;
  fieldOpsRequestId: string;
  resourceType: string;
  trade?: string;
  quantity: number;
  neededByDate: string;
  neededUntilDate?: string;
  priority: string;
  specialRequirements?: string;
  siteAddress: string;
  projectName: string;
}) {
  // If Kinetic API is not configured, return mock response
  if (!KINETIC_API_KEY) {
    const mockId = `kc-${Date.now().toString(36)}`;
    return NextResponse.json({
      status: "preview",
      message: "Kinetic Craft API not configured — returning mock response",
      kineticRequestId: mockId,
      responseStatus: "received",
      estimatedResponseTime: "2 hours",
      payload,
    });
  }

  // Forward to Kinetic Craft API
  const response = await fetch(`${KINETIC_API_URL}/resource-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KINETIC_API_KEY}`,
      "X-FieldOps-Request-Id": payload.fieldOpsRequestId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json(
      {
        status: "failed",
        error: `Kinetic API returned ${response.status}`,
        details: errorBody,
      },
      { status: 502 }
    );
  }

  const result = await response.json();
  return NextResponse.json({
    status: "success",
    ...result,
  });
}

// ── Cancel an existing request ──

async function handleCancelRequest(payload: {
  kineticRequestId: string;
  fieldOpsRequestId: string;
  reason?: string;
}) {
  if (!KINETIC_API_KEY) {
    return NextResponse.json({
      status: "preview",
      message: "Cancellation would be sent to Kinetic Craft",
      ...payload,
    });
  }

  const response = await fetch(
    `${KINETIC_API_URL}/resource-requests/${payload.kineticRequestId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KINETIC_API_KEY}`,
      },
      body: JSON.stringify({ reason: payload.reason }),
    }
  );

  const result = await response.json();
  return NextResponse.json(result);
}

// ── Handle incoming webhook from Kinetic Craft ──

async function handleIncomingWebhook(
  payload: {
    event: string;
    timestamp: string;
    fieldOpsRequestId: string;
    kineticRequestId: string;
    data: Record<string, unknown>;
    signature: string;
  }
) {
  if (!KINETIC_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 503 }
    );
  }

  if (!payload.signature || typeof payload.signature !== "string") {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  // Verify HMAC signature
  const payloadForSignature = {
    event: payload.event,
    timestamp: payload.timestamp,
    fieldOpsRequestId: payload.fieldOpsRequestId,
    kineticRequestId: payload.kineticRequestId,
    data: payload.data,
  };
  const expectedSignature = crypto
    .createHmac("sha256", KINETIC_WEBHOOK_SECRET)
    .update(JSON.stringify(payloadForSignature))
    .digest("hex");

  const providedSignatureBuffer = Buffer.from(payload.signature, "hex");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");
  const isSignatureValid =
    providedSignatureBuffer.length === expectedSignatureBuffer.length &&
    crypto.timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer);

  if (!isSignatureValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  // Process webhook event
  switch (payload.event) {
    case "allocation.created":
      return NextResponse.json({
        status: "acknowledged",
        message: "Allocation received — updating Field Ops",
        fieldOpsRequestId: payload.fieldOpsRequestId,
      });

    case "allocation.updated":
      return NextResponse.json({
        status: "acknowledged",
        message: "Allocation update received",
        fieldOpsRequestId: payload.fieldOpsRequestId,
      });

    case "allocation.cancelled":
      return NextResponse.json({
        status: "acknowledged",
        message: "Allocation cancellation received",
        fieldOpsRequestId: payload.fieldOpsRequestId,
      });

    case "conflict.detected":
      return NextResponse.json({
        status: "acknowledged",
        message: "Conflict alert received — will notify superintendent",
        fieldOpsRequestId: payload.fieldOpsRequestId,
      });

    default:
      return NextResponse.json({
        status: "ignored",
        message: `Unknown event type: ${payload.event}`,
      });
  }
}

// ── GET: Check Kinetic Craft connection status ──

export async function GET() {
  const isConfigured = !!KINETIC_API_KEY;

  if (!isConfigured) {
    return NextResponse.json({
      connected: false,
      message: "Kinetic Craft API not configured. Set KINETIC_API_KEY and KINETIC_API_URL in environment.",
      hint: "Resource requests will generate preview payloads until Kinetic Craft is connected.",
    });
  }

  try {
    const response = await fetch(`${KINETIC_API_URL}/health`, {
      headers: { Authorization: `Bearer ${KINETIC_API_KEY}` },
    });

    return NextResponse.json({
      connected: response.ok,
      message: response.ok ? "Kinetic Craft connected" : "Connection failed",
    });
  } catch {
    return NextResponse.json({
      connected: false,
      message: "Cannot reach Kinetic Craft API",
    });
  }
}
