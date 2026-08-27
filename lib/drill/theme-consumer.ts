import { THEME } from '@/lib/drill/theme';

// A non-React utility module. Before the case-3 refactor this imported
// THEME straight from components/drill/case-3-counter.tsx. That made the
// screen's module depend on this utility for Fast Refresh safety — see
// FINDINGS.md for what actually happened when we tried it (state survived
// anyway, because the utility's only consumer was itself a safe route
// boundary) and why importing from a plain data module is still the more
// robust fix regardless.
export function describeTheme(): string {
  return `case-3 accent: ${THEME.accent}`;
}
