import { NextRequest, NextResponse } from "next/server";

// ============================================================
// ADP Workforce Now — Construction Time Import API Route
// Handles OAuth token exchange, time entry export, and sync status
// ============================================================

// ADP API endpoints (sandbox → production swap via env)
const ADP_TOKEN_URL = process.env.ADP_TOKEN_URL || "https://api.adp.com/auth/oauth/v2/token";
const ADP_TIME_IMPORT_URL = process.env.ADP_TIME_IMPORT_URL || "https://api.adp.com/time/v2/workers";
const ADP_CLIENT_ID = process.env.ADP_CLIENT_ID || "";
const ADP_CLIENT_SECRET = process.env.ADP_CLIENT_SECRET || "";

// ── Types matching ADP Construction Time Import schema ──

interface ADPTimeRecord {
  associateOID: string;           // ADP worker identifier
  earningCode: string;            // e.g., "REG", "OT", "DT"
  hoursQuantity: number;
  rateAmount?: number;
  effectiveDate: string;          // YYYY-MM-DD
  positionID?: string;
  departmentCode?: string;
  costCenterCode?: string;        // maps to our cost code
  projectCode?: string;
  laborCategory?: string;
  entryComment?: string;
}

interface ADPBatchPayload {
  payDataInput: {
    payDataBatches: {
      batchID: string;
      payPeriod: {
        startDate: string;
        endDate: string;
      };
      payDataEntries: ADPTimeRecord[];
    }[];
  };
}

// ── OAuth 2.0 Token Exchange ──

async function getADPAccessToken(): Promise<string> {
  const response = await fetch(ADP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${ADP_CLIENT_ID}:${ADP_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ADP OAuth failed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ── Transform FieldOps TimeEntry → ADP TimeRecord ──

interface FieldOpsTimeEntry {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  costCodeId?: string;
  taktZone?: string;
  notes?: string;
  adpPayrollCode?: string;
}

function transformToADPRecords(
  entries: FieldOpsTimeEntry[],
  config: {
    earningsCode: string;
    overtimeEarningsCode: string;
    doubleTimeEarningsCode?: string;
  }
): ADPTimeRecord[] {
  const records: ADPTimeRecord[] = [];

  for (const entry of entries) {
    // Regular hours
    if (entry.regularHours > 0) {
      records.push({
        associateOID: entry.adpPayrollCode || entry.workerId,
        earningCode: config.earningsCode,
        hoursQuantity: entry.regularHours,
        effectiveDate: entry.date,
        costCenterCode: entry.costCodeId,
        entryComment: entry.notes ? `FieldOps: ${entry.notes}` : `FieldOps entry ${entry.id}`,
      });
    }

    // Overtime hours
    if (entry.overtimeHours > 0) {
      records.push({
        associateOID: entry.adpPayrollCode || entry.workerId,
        earningCode: config.overtimeEarningsCode,
        hoursQuantity: entry.overtimeHours,
        effectiveDate: entry.date,
        costCenterCode: entry.costCodeId,
        entryComment: `FieldOps OT: ${entry.id}`,
      });
    }

    // Double time hours
    if (entry.doubleTimeHours > 0 && config.doubleTimeEarningsCode) {
      records.push({
        associateOID: entry.adpPayrollCode || entry.workerId,
        earningCode: config.doubleTimeEarningsCode,
        hoursQuantity: entry.doubleTimeHours,
        effectiveDate: entry.date,
        costCenterCode: entry.costCodeId,
        entryComment: `FieldOps DT: ${entry.id}`,
      });
    }
  }

  return records;
}

// ── POST: Export approved time entries to ADP ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entries,
      config,
      batchId,
      payPeriodStart,
      payPeriodEnd,
    } = body as {
      entries: FieldOpsTimeEntry[];
      config: {
        companyCode: string;
        payGroupCode: string;
        earningsCode: string;
        overtimeEarningsCode: string;
        doubleTimeEarningsCode?: string;
      };
      batchId: string;
      payPeriodStart: string;
      payPeriodEnd: string;
    };

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "No time entries provided" },
        { status: 400 }
      );
    }

    // Transform to ADP format
    const adpRecords = transformToADPRecords(entries, config);

    // Build ADP batch payload
    const payload: ADPBatchPayload = {
      payDataInput: {
        payDataBatches: [
          {
            batchID: batchId,
            payPeriod: {
              startDate: payPeriodStart,
              endDate: payPeriodEnd,
            },
            payDataEntries: adpRecords,
          },
        ],
      },
    };

    // If ADP credentials are not configured, return the payload for review
    if (!ADP_CLIENT_ID || !ADP_CLIENT_SECRET) {
      return NextResponse.json({
        status: "preview",
        message: "ADP credentials not configured — returning payload for review",
        batchId,
        recordCount: adpRecords.length,
        entryCount: entries.length,
        payload,
        exportedEntryIds: entries.map((e) => e.id),
      });
    }

    // Get OAuth token
    const accessToken = await getADPAccessToken();

    // Submit to ADP
    const adpResponse = await fetch(ADP_TIME_IMPORT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "ADP-Company-Code": config.companyCode,
      },
      body: JSON.stringify(payload),
    });

    if (!adpResponse.ok) {
      const errorBody = await adpResponse.text();
      return NextResponse.json(
        {
          status: "failed",
          error: `ADP API returned ${adpResponse.status}`,
          details: errorBody,
          batchId,
        },
        { status: 502 }
      );
    }

    const adpResult = await adpResponse.json();

    return NextResponse.json({
      status: "success",
      batchId,
      recordCount: adpRecords.length,
      entryCount: entries.length,
      exportedEntryIds: entries.map((e) => e.id),
      adpResponse: adpResult,
    });
  } catch (error) {
    console.error("ADP export error:", error);
    return NextResponse.json(
      {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ── GET: Check ADP sync status / connection health ──

export async function GET() {
  const isConfigured = !!(ADP_CLIENT_ID && ADP_CLIENT_SECRET);

  if (!isConfigured) {
    return NextResponse.json({
      connected: false,
      message: "ADP credentials not configured. Set ADP_CLIENT_ID and ADP_CLIENT_SECRET in environment.",
      requiredEnvVars: [
        "ADP_CLIENT_ID",
        "ADP_CLIENT_SECRET",
        "ADP_TOKEN_URL (optional, defaults to production)",
        "ADP_TIME_IMPORT_URL (optional, defaults to production)",
      ],
    });
  }

  try {
    // Validate OAuth by requesting a token
    const accessToken = await getADPAccessToken();
    return NextResponse.json({
      connected: true,
      message: "ADP connection verified",
      tokenPreview: `${accessToken.substring(0, 8)}...`,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      message: error instanceof Error ? error.message : "Connection failed",
    });
  }
}
