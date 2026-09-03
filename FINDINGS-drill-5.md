# FINDINGS — Drill 5: Five thousand rows

Lesson: Week 1 Day 5, "Lists and Virtualization".

## Setup

| Route | Component under test | Purpose |
|---|---|---|
| `/drills/drill-5` | — | hub, links to the two screens below |
| `/drills/drill-5/benchmark` | `ScrollView`, `FlatList` (react-native core) | mount-time + jank comparison, 5,000 rows |
| `/drills/drill-5/row-list` | `FlatList` + `RowItem` + `RowSeparator` | production list: `keyExtractor`, `ItemSeparatorComponent`, pull-to-refresh via `RefreshControl` |

`lib/drill/rows.ts` is a plain data module (`Row` type, deterministic `makeRows`, seeded `seededShuffle`
for refresh) — same Fast-Refresh-safety discipline as `theme.ts`/`button-palette.ts`. `components/drill/row-item.tsx`
and `row-separator.tsx` are shared by both screens so the benchmark measures the exact same per-row cost
the production list pays.

## Requirements, mapped to decisions

### Deliverable 1 — a table of mount time and observed jank for both

`benchmark.tsx` mounts one variant at a time, never both, so a 5,000-row ScrollView and a 5,000-row
FlatList never share memory pressure or contaminate each other's numbers. Mount time is a
`performance.now()` delta between "user pressed Mount" and the list's own `onLayout` firing — the first
point at which React has committed a full render+layout pass for that subtree, which for a synchronous
commit means every one of the 5,000 `RowItem`s has already mounted by the time it fires. Jank is a
`requestAnimationFrame` loop started right after mount, tracking frame-to-frame gaps; anything over
33.3ms (more than 2 dropped frames at 60fps) counts as janky. Refs, not state, hold the running
counters, snapshotted into React state every 500ms rather than every frame — the point of the monitor
is to observe jank, not become a second source of it via a 60Hz re-render.

### Deliverable 2 — a written explanation of why they differ

On-screen text on the benchmark screen, expanded here: `ScrollView` mounts and lays out all 5,000 rows
immediately — every `RowItem` exists in the tree from the first frame, on-screen or not, and the whole
tree re-renders together on layout changes. `FlatList` only renders rows inside (and slightly past) the
visible window and recycles the rest as the list scrolls, so its active render set stays roughly
constant regardless of `data.length`. That's the direct cause of everything measured below.

### Deliverable 3 — the converted list

`row-list.tsx`: `data` is `Row[]` (`{id, name}`), `keyExtractor={(row) => row.id}` explicit rather than
relying on an implicit `key` field, `ItemSeparatorComponent={RowSeparator}`, and pull-to-refresh wired
through an actual `<RefreshControl>` element passed to the `refreshControl` prop — not the
`refreshing`/`onRefresh` `FlatList` shorthand — since the checklist names `RefreshControl` specifically.
`onRefresh` reshuffles the same 5,000 rows with a seeded (not `Math.random`) shuffle, so a refresh is
visibly provable (`shuffled N×` in the on-screen caption) without a real backend.

## Real findings from testing (Playwright, `npx expo start --web`, three full runs per variant)

### Mount time: FlatList is ~100–165× faster than ScrollView at 5,000 rows

| Run | ScrollView mount | FlatList mount |
|---|---|---|
| 1 | 2418.4ms | 20.7ms |
| 2 | 2154.0ms | 14.7ms |
| 3 | 2007.2ms | 16.7ms |

ScrollView trended down across runs (2418 → 2007ms) — plausibly JS engine warm-up rather than a real
cost reduction, since the same 5,000-item array and the same `RowItem` component were reused for every
run. FlatList stayed flat (14.7–20.7ms), within measurement noise, regardless of run order.

### Frame gap while scrolling: one large stall for ScrollView, none for FlatList

| Run | ScrollView max gap | ScrollView janky frames | FlatList max gap | FlatList janky frames |
|---|---|---|---|---|
| 1 | 1000.0ms | 1/38 | 16.8ms | 0/216 |
| 2 | 1066.7ms | 1/37 | 16.8ms | 0/216 |
| 3 | 1083.4ms | 1/37 | 16.8ms | 0/216 |

FlatList's max gap sits at exactly one 60fps frame (16.8ms) with zero frames over the jank threshold
across ~3s of continuous scrolling in every run — the virtualized render set stayed small enough that
scrolling never blocked the JS thread.

ScrollView's number needs a caveat, not a headline: the frame monitor starts immediately after
`onLayout` fires, and only 1 of ~37–38 sampled frames is ever janky — one huge first gap, not sustained
stutter through the rest of the scroll. That's consistent with the monitor's first frame absorbing the
tail of the same synchronous mount cost the table's Mount column already measures (committing and
laying out 5,000 native views blocks the one JS/UI thread this web preview runs on), rather than
scrolling itself being ~60× slower on ScrollView. The mount-time and frame-gap numbers here are likely
measuring overlapping parts of the same underlying cost, not two independent problems — worth
re-measuring on native, where JS and UI actually run on separate threads, before treating "a 1000ms
scroll stall" as distinct from "a 2000ms mount".

### Row list: virtualization confirmed, separators confirmed, pull-to-refresh not exercisable on web

- `FlatList` kept ~92 rows in the DOM at any scroll position (matching the viewport) out of the full
  5,000 — virtualization confirmed working, not just asserted from reading the API.
- `RowSeparator`'s hairline renders between every row, confirmed in the DOM and visually.
- Pull-to-refresh could not be triggered from a headless browser: `shuffled 0×` stayed at 0 after an
  overscroll attempt (wheel-up past the top). No gesture path exists for it on `react-native-web` — the
  same category of per-platform gap as drill-3's `KeyboardAvoidingView` and drill-4's parent-bounds
  clipping. The component is wired correctly per the API (`refreshControl={<RefreshControl ... />}`);
  what's unverified is the actual pull gesture, which needs a real touch device or simulator.

### Console

Two warnings, both pre-existing and unrelated to drill 5 — `props.pointerEvents is deprecated`, from
expo-router's own bundle, the same one drill-2/3/4 already traced there.

## What's still unverified

- **Real native mount-time and scroll-jank numbers**, on a low-end Android device or a throttled
  emulator — what the lesson actually asks for. The numbers above are real, but from a web preview
  where JS and UI share one thread; native RN runs them on separate threads, so ScrollView's
  scroll-time cost in particular should be re-measured there rather than assumed to carry over
  unchanged.
- **Whether the ~2000ms mount and the ~1000ms "scroll" frame gap are one effect or two** (see caveat
  above) — only resolvable with a profiler that can distinguish mount-commit time from post-mount
  scroll time, which `performance.now()` + `onLayout` can't fully do on their own.
- **Pull-to-refresh's actual native gesture and spinner** — unreachable from this session's web-only
  environment.

## Unresolved questions

(none)
