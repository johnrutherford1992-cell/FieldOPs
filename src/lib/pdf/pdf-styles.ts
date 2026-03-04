// ============================================================
// PDF Brand Constants — Blackstone Construction
// Mirrors tailwind.config.ts brand palette for PDF generation
// ============================================================

export const BRAND = {
  onyx: '#000000',
  alabaster: '#f2f0e6',
  slate: '#2d2d2f',
  warmGray: '#8c8c8c',
  accentGreen: '#2d8a4e',
  accentAmber: '#d4a017',
  accentRed: '#c0392b',
  white: '#ffffff',
  lightGray: '#f3f4f6',
  borderGray: '#e5e7eb',
} as const;

export const FONT_SIZES = {
  title: 18,
  subtitle: 14,
  heading: 12,
  body: 10,
  small: 8,
  footer: 7,
} as const;

export const PAGE_MARGINS = {
  top: 72,     // 1 inch
  bottom: 72,
  left: 54,    // 0.75 inch
  right: 54,
} as const;

export function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
