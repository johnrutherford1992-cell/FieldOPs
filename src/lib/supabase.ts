import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Column name conversion helpers ----

/** Convert camelCase JS object keys to snake_case for Supabase/Postgres */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    const value = obj[key];
    // Don't recurse into arrays or nested objects — JSONB columns stay as-is
    result[snakeKey] = value;
  }
  return result;
}

/** Convert snake_case Postgres row keys to camelCase for JS */
export function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

/** Convert an array of snake_case rows to camelCase */
export function rowsToCamel<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => toCamelCase(row) as T);
}

/** Convert a single camelCase record to snake_case for upsert */
export function recordToSnake(record: Record<string, unknown>): Record<string, unknown> {
  return toSnakeCase(record);
}

/** Convert an array of camelCase records to snake_case for bulk upsert */
export function recordsToSnake(records: Record<string, unknown>[]): Record<string, unknown>[] {
  return records.map((r) => toSnakeCase(r));
}
