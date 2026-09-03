import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { AppButton } from '@/components/drill/app-button';
import { RowItem } from '@/components/drill/row-item';
import { RowSeparator } from '@/components/drill/row-separator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { makeRows } from '@/lib/drill/rows';

const ROW_COUNT = 5000;
const ROWS = makeRows(ROW_COUNT);
// Anything slower than 2 frames at 60fps (33.3ms) counts as a dropped frame.
const JANK_THRESHOLD_MS = 33.3;
const LIVE_STATS_INTERVAL_MS = 500;

type Variant = 'scrollview' | 'flatlist';

type Metrics = { mountMs: number; maxFrameGapMs: number; jankyFrames: number; totalFrames: number };

// Drill 5, deliverables 1 and 2 — a controlled, one-at-a-time comparison so
// mounting one variant's 5,000 rows never contaminates the other's numbers,
// plus a live JS-thread frame monitor as a scroll-jank proxy. See
// FINDINGS-drill-5.md for the real numbers this produced and what they mean.
export default function BenchmarkScreen() {
  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);
  const [results, setResults] = useState<Partial<Record<Variant, Metrics>>>({});
  const [liveStats, setLiveStats] = useState({ maxGap: 0, janky: 0, total: 0 });

  const mountStartRef = useRef(0);
  const hasMeasuredMountRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number | null>(null);
  const maxGapRef = useRef(0);
  const jankyRef = useRef(0);
  const totalFramesRef = useRef(0);

  const stopFrameWatch = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startFrameWatch = useCallback(() => {
    lastFrameTsRef.current = null;
    maxGapRef.current = 0;
    jankyRef.current = 0;
    totalFramesRef.current = 0;
    const tick = (ts: number) => {
      if (lastFrameTsRef.current != null) {
        const gap = ts - lastFrameTsRef.current;
        totalFramesRef.current += 1;
        if (gap > maxGapRef.current) maxGapRef.current = gap;
        if (gap > JANK_THRESHOLD_MS) jankyRef.current += 1;
      }
      lastFrameTsRef.current = ts;
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // Snapshots the refs into state on a timer rather than every frame — the
  // point of the monitor is to observe jank, not to become a second source
  // of it via a 60Hz React re-render.
  useEffect(() => {
    if (!activeVariant) return;
    const id = setInterval(() => {
      setLiveStats({ maxGap: maxGapRef.current, janky: jankyRef.current, total: totalFramesRef.current });
    }, LIVE_STATS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeVariant]);

  useEffect(() => stopFrameWatch, [stopFrameWatch]);

  const mount = (variant: Variant) => {
    hasMeasuredMountRef.current = false;
    mountStartRef.current = performance.now();
    setLiveStats({ maxGap: 0, janky: 0, total: 0 });
    setActiveVariant(variant);
  };

  const handleMounted = () => {
    if (hasMeasuredMountRef.current || !activeVariant) return;
    hasMeasuredMountRef.current = true;
    const mountMs = performance.now() - mountStartRef.current;
    setResults((prev) => ({ ...prev, [activeVariant]: { mountMs, maxFrameGapMs: 0, jankyFrames: 0, totalFrames: 0 } }));
    startFrameWatch();
  };

  const unmount = () => {
    stopFrameWatch();
    if (activeVariant) {
      setResults((prev) => {
        const existing = prev[activeVariant];
        if (!existing) return prev;
        return {
          ...prev,
          [activeVariant]: {
            ...existing,
            maxFrameGapMs: maxGapRef.current,
            jankyFrames: jankyRef.current,
            totalFrames: totalFramesRef.current,
          },
        };
      });
    }
    setActiveVariant(null);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Benchmark' }} />
      <View style={styles.controls}>
        <AppButton title="Mount ScrollView" onPress={() => mount('scrollview')} disabled={activeVariant !== null} />
        <AppButton
          title="Mount FlatList"
          variant="secondary"
          onPress={() => mount('flatlist')}
          disabled={activeVariant !== null}
        />
        <AppButton title="Unmount" variant="danger" onPress={unmount} disabled={activeVariant === null} />
      </View>

      {activeVariant && (
        <ThemedText style={styles.caption}>
          Scroll to sample jank — live: max frame gap {liveStats.maxGap.toFixed(1)}ms · janky frames{' '}
          {liveStats.janky}/{liveStats.total}
        </ThemedText>
      )}

      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <ThemedText style={[styles.cell, styles.headerCell]}>Variant</ThemedText>
          <ThemedText style={[styles.cell, styles.headerCell]}>Mount</ThemedText>
          <ThemedText style={[styles.cell, styles.headerCell]}>Max gap</ThemedText>
          <ThemedText style={[styles.cell, styles.headerCell]}>Janky</ThemedText>
        </View>
        <ResultRow label="ScrollView" metrics={results.scrollview} />
        <ResultRow label="FlatList" metrics={results.flatlist} />
      </View>

      <ThemedText style={styles.explanation}>
        ScrollView mounts and lays out all {ROW_COUNT.toLocaleString()} rows immediately — every
        RowItem exists in the tree from the first frame, on-screen or not. FlatList only renders
        rows inside (and slightly past) the visible window and recycles the rest as you scroll, so
        its active render set stays roughly constant no matter how big `data` is. That is why
        ScrollView&apos;s mount time and per-scroll re-render cost scale with row count and
        FlatList&apos;s does not.
      </ThemedText>

      <View style={styles.listArea}>
        {activeVariant === 'scrollview' && (
          <ScrollView onLayout={handleMounted} testID="benchmark-scrollview">
            {ROWS.map((row) => (
              <RowItem key={row.id} row={row} />
            ))}
          </ScrollView>
        )}
        {activeVariant === 'flatlist' && (
          <FlatList
            data={ROWS}
            keyExtractor={(row) => row.id}
            renderItem={({ item }) => <RowItem row={item} />}
            ItemSeparatorComponent={RowSeparator}
            onLayout={handleMounted}
            testID="benchmark-flatlist"
          />
        )}
        {!activeVariant && (
          <ThemedText style={styles.placeholder}>Mount a variant above to measure it.</ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

function ResultRow({ label, metrics }: { label: string; metrics: Metrics | undefined }) {
  return (
    <View style={styles.tableRow}>
      <ThemedText style={styles.cell}>{label}</ThemedText>
      <ThemedText style={styles.cell}>{metrics ? `${metrics.mountMs.toFixed(1)}ms` : '—'}</ThemedText>
      <ThemedText style={styles.cell}>{metrics ? `${metrics.maxFrameGapMs.toFixed(1)}ms` : '—'}</ThemedText>
      <ThemedText style={styles.cell}>
        {metrics ? `${metrics.jankyFrames}/${metrics.totalFrames}` : '—'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontSize: 13, opacity: 0.7 },
  table: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(128,128,128,0.35)', borderRadius: 8 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.35)',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  cell: { flex: 1, padding: 8, fontSize: 13 },
  headerCell: { fontWeight: '700', opacity: 0.7 },
  explanation: { fontSize: 13, opacity: 0.8, lineHeight: 19 },
  listArea: { flex: 1, minHeight: 0 },
  placeholder: { textAlign: 'center', opacity: 0.5, paddingTop: 24 },
});
