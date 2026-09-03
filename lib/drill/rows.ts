// Plain data module — exports no components, so importing it never affects
// any Fast Refresh boundary, same discipline as theme.ts and button-palette.ts.

export type Row = { id: string; name: string };

// Deterministic on purpose: the benchmark screen times mounting the same
// 5,000-row dataset for both ScrollView and FlatList, so the numbers it
// produces have to differ only because of the component, never the data.
export function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: `Row ${i + 1}`,
  }));
}

// A stable (seeded) shuffle, not Math.random — pull-to-refresh needs a
// visibly different order each time it's called, but a re-run of the whole
// app with the same seed sequence should still be reproducible.
export function seededShuffle(rows: Row[], seed: number): Row[] {
  const result = [...rows];
  let state = seed || 1;
  const next = () => {
    // xorshift32 — small, dependency-free, good enough for a demo shuffle.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
