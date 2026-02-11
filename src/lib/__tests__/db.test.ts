import { describe, it, expect } from "vitest";
import { generateId } from "@/lib/db";

// ────────────────────────────────────────────────────────
// TEST 7: ID generation format and uniqueness
// ────────────────────────────────────────────────────────
describe("generateId", () => {
  it("produces IDs in the format: prefix-timestamp36-random6", () => {
    const id = generateId("pe");

    // Format: prefix-base36timestamp-6charRandom
    const parts = id.split("-");
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("pe");

    // Timestamp part should be valid base36
    const timestampPart = parts[1]!;
    expect(timestampPart.length).toBeGreaterThan(0);
    expect(/^[0-9a-z]+$/.test(timestampPart)).toBe(true);

    // Random part should be 6 alphanumeric chars
    const randomPart = parts[2]!;
    expect(randomPart.length).toBe(6);
    expect(/^[0-9a-z]+$/.test(randomPart)).toBe(true);
  });

  it("generates unique IDs across multiple calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId("test")));
    expect(ids.size).toBe(100);
  });
});
