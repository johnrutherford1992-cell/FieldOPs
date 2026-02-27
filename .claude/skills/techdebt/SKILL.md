---
name: techdebt
description: End-of-session tech debt audit. Finds duplicated code, dead exports, copy-paste patterns, and similar logic across the codebase, then refactors them into shared utilities or components.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Task
---

# Tech Debt Audit — Duplicate Code Killer

Run this at the end of every session to find and eliminate duplicated code across the FieldOps codebase.

## Procedure

### Phase 1: Detect Duplicated Code

Scan the `src/` directory for duplication across these categories:

1. **Identical or near-identical functions** — functions with the same logic appearing in multiple files (e.g., formatting helpers, date utilities, validation functions, ID generators).
2. **Copy-pasted UI patterns** — repeated JSX/component blocks that only differ by props or labels (e.g., stat cards, form field groups, empty states, loading skeletons).
3. **Repeated Tailwind class strings** — long identical `className` strings (8+ classes) used in 3+ places that should be extracted into a component or utility class.
4. **Duplicated type definitions** — interfaces or types in `src/lib/types.ts` or scattered across files that overlap substantially.
5. **Repeated data-fetching / DB access patterns** — identical IndexedDB queries or Dexie calls that should be consolidated into `src/lib/db.ts` helpers.
6. **Duplicated state logic** — similar `useState`/`useEffect` patterns across components that could be custom hooks.

Use these strategies to find duplicates:
- Search for common function names that appear in multiple files (e.g., `formatDate`, `formatCurrency`, `generateId`).
- Search for repeated string literals, especially long ones.
- Search for identical import blocks across files.
- Look for components with very similar structure by searching for repeated JSX element patterns.
- Check for inline utility functions that duplicate what already exists in `src/lib/`.

### Phase 2: Rank by Impact

For each duplicate found, assess:
- **Frequency**: How many times does it appear?
- **Size**: How many lines of code are duplicated per instance?
- **Risk**: Could the copies drift apart and cause bugs?

Prioritize: high-frequency + large-size + high-risk items first.

### Phase 3: Refactor

For each high-priority duplicate:

1. **Extract** the shared logic into the appropriate location:
   - Utility functions → `src/lib/utils.ts` (create if it doesn't exist)
   - Custom hooks → `src/lib/hooks/` directory (create if needed)
   - Shared UI patterns → `src/components/ui/`
   - DB helpers → `src/lib/db.ts`
   - Type consolidation → `src/lib/types.ts`

2. **Replace** all duplicate call sites with imports from the shared location.

3. **Verify** each change compiles: run `npm run typecheck` after each refactor group.

### Phase 4: Validate

After all refactors:
- Run `npm run check` (lint + typecheck + build) and fix any issues.
- Summarize what was deduplicated: list each extracted utility/component with the files it replaced code in.

## Output

End with a summary table:

| Extracted To | What | Replaced In (files) | Lines Saved |
|---|---|---|---|
| `src/lib/utils.ts:formatDate` | Date formatting helper | `daily-log/page.tsx`, `reports/page.tsx`, ... | ~15 |
| ... | ... | ... | ... |

**Total lines saved: N**

## Rules

- Do NOT change any public-facing behavior or UI.
- Do NOT add new dependencies.
- Do NOT refactor code that is only used once — only target actual duplicates (2+ occurrences).
- Keep extracted functions simple and well-typed.
- Prefer named exports over default exports for shared utilities.
- Follow existing code conventions from CLAUDE.md (Tailwind only, strict TypeScript, `@/*` path aliases).
