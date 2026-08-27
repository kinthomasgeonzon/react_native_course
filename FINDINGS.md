# FINDINGS — Drill 1: Three ways to break the refresh

Lesson: Week 1 Day 1, "The Native Rendering Model".

## Setup

One `Counter` (useState count + `useEffect(() => console.log('mounted: case-N'), [])` +
increment button), duplicated deliberately across three files so each file's
**export shape** is the only variable under test:

| Route | Test subject (edit this) | Export shape |
|---|---|---|
| `/drills/case-1` | `components/drill/case-1-counter.tsx` | only the `Counter` component |
| `/drills/case-2` | `components/drill/case-2-counter.tsx` | `Counter` + `export const THEME` |
| `/drills/case-3` | `components/drill/case-3-counter.tsx` | `Counter` only, **after** the refactor below |

Route files under `app/drills/` are the stable harness — never edited during
the drill, only the files above are.

## Predicted behaviour, mapped to the three rules

1. **Case 1 → rule 1** ("module exporting only components — only that module
   re-executes, state preserved"). `case-1-counter.tsx` exports nothing but
   `Counter`, so it's a safe Fast Refresh boundary. Expect `count` to survive
   any edit.
2. **Case 2 → rule 2** ("components plus other things — that module and every
   importer re-run, state **may** reset" — the doc's own wording hedges,
   it does not say state always resets). `case-2-counter.tsx` also exports
   `THEME`, so the module re-executes on edit. Whether `count` actually
   resets depends on whether react-refresh can still hot-swap `Counter` by
   signature (same hooks, same order) — nothing else imports `THEME` here,
   so there's no external importer forcing an unsafe cascade. Realistic
   expectation: `count` likely *survives* a same-signature edit, same as
   case 1 — rule 2 bites hardest when another module also depends on the
   non-component export (that's what case 3 isolates on purpose).
3. **Case 3, broken → rule 3** ("module imported by code outside the React
   tree — full reload, state gone"). Before the refactor,
   `case-3-counter.tsx` exported `THEME` the same way as case 2, and
   `lib/drill/theme-consumer.ts` — a plain, non-React module — imported
   `THEME` directly from it:

   ```ts
   // lib/drill/theme-consumer.ts (broken version)
   import { THEME } from '@/components/drill/case-3-counter';
   export function describeTheme(): string {
     return `case-3 accent: ${THEME.accent}`;
   }
   ```

   ```tsx
   // components/drill/case-3-counter.tsx (broken version, excerpt)
   export const THEME = { accent: '#7c3aed' };
   export default function Counter() { /* ... */ }
   ```

   That importer sits outside the React tree, so any edit to
   `case-3-counter.tsx` should force a **full reload** — not just a
   re-render — clearing all app state, not only this component's.
   *(This prediction turned out to be wrong for how we wired it — see
   "Case 3 broken: what actually happened" below.)*

4. **Case 3, fixed → rule 1 restored**. Refactor: move `THEME` into
   `lib/drill/theme.ts` (a plain data module with no components), and point
   both `case-3-counter.tsx` and `theme-consumer.ts` at it instead of at
   each other:

   ```ts
   // lib/drill/theme.ts
   export const THEME = { accent: '#7c3aed' };
   ```

   Now `case-3-counter.tsx` exports only `Counter` again, and nothing
   outside the tree imports *from the screen file* anymore — the screen
   is a safe boundary again. Expect `count` to survive edits, same as
   case 1. This is the current state of the repo (see the files as
   committed).

5. **Orthogonal to all three rules**: `useEffect(fn, [])` fires on every
   single Fast Refresh in every case, because Fast Refresh always re-runs
   effects and ignores dependency arrays. Expect the `mounted: case-N` log
   on every save, in all three cases, even when `count` itself survives.

## How to actually run the drill

1. `npm run start` (or `npm run web` / `npm run ios` / `npm run android`).
2. On the running app: Home tab → "Step 4: Fast Refresh drill" → a case.
3. Tap the counter up to some number, e.g. 5.
4. Edit only the matching `components/drill/case-N-counter.tsx` (e.g. add a
   trailing space to a line) and save.
5. Watch the on-screen count and the Metro/console log line for
   `mounted: case-N`.
6. Repeat for all three cases, then flip `case-3-counter.tsx` back to the
   broken snippet above (and `theme-consumer.ts` to match) to see the full
   reload live, before restoring the fixed version shown in this repo.

## A sixth failure, found live: tunnel delivery drop

Dev server was running `expo start --tunnel` (ngrok) with a physical
Android device. First test on case 2: bumped the increment step from `+1`
to `+5` in `case-2-counter.tsx`, saved, tapped the button on the phone —
**nothing changed**, still incremented by 1. Metro's own log explained why:

```
Tunnel connection has been closed. This is often related to intermittent
connection issues between the dev server and ngrok. Restart the dev
server to try connecting to ngrok again.
Check the Ngrok status page for outages: https://status.ngrok.com/
Tunnel connected.
```

The edit's Fast Refresh push landed in that drop/reconnect window and
never reached the phone — this is a dev-loop infra failure, not a Fast
Refresh *rule* outcome, and it's easy to misattribute to "state reset
weirdly" if you don't check the terminal log. Same family as the lesson's
"five failures" (port/inotify/adb/gradlew/npm), just not one of the named
five. Fix/workaround: press `r` in the Metro terminal (or shake → Reload)
to force-deliver after a tunnel hiccup, or run `expo start --lan` instead
of `--tunnel` when the phone and dev machine share a network — LAN mode's
refresh socket doesn't go through ngrok and is far less prone to this.

## Case 3 broken: what actually happened

Re-broke it on purpose to test: `case-3-counter.tsx` exported `THEME`
locally again, and `lib/drill/theme-consumer.ts` imported it straight from
that file. Built the count up, edited only the button label text in
`case-3-counter.tsx` (no hook change), saved. **The label updated live and
the count survived — no full reload.** That contradicts the lesson's rule
3 as literally stated ("module imported by code outside the React tree —
full reload, state gone").

Why: Fast Refresh's actual failure mode isn't "any non-component importer
= full reload." When Metro can't safely patch a changed module in place,
it walks *up* the import graph looking for some ancestor that itself has a
safe (component-only) export shape to absorb the update, instead of
immediately giving up. In this drill's wiring, `theme-consumer.ts`'s only
consumer is `app/drills/case-3.tsx` — a route file exporting nothing but
its screen component, i.e. a valid rule-1 boundary on its own. The search
finds that boundary one hop up and stops there; no hard reload needed.

The lesson's rule-3 example describes a genuine *dead end* — the
non-React consumer has to have **no** path back to any component-only
module (e.g. wired into the app's root entry point or a store singleton
created at module scope) to actually force a full reload. A screen file
importing the utility, like here, isn't that dead end — it's still
reachable from a safe boundary one level up.

Practical upshot for the drill: the fix (isolating `THEME` into
`lib/drill/theme.ts`, still in the repo) is worth keeping anyway — it
makes `case-3-counter.tsx` safe **on its own merits**, rather than by
accident of which route happens to import the utility. Relying on an
importer elsewhere in the app to keep catching the bubbled update is
fragile; it would only take a future edit to `theme-consumer.ts`'s import
graph (e.g. importing it from a non-component config/setup file at the
app root) to actually hit the dead end and get the full reload the docs
describe.

## Observed

| Case | Edit made | Count before | Count after | Notes |
|---|---|---|---|---|
| 2 (1st attempt) | increment step `+1` → `+5` | some value | **unchanged**, still +1 step | tunnel dropped mid-push (ngrok), not a rule-2 result — discarded |
| 2 (clean retest) | button label text only (JSX string, no hook change) | 9 | **9 — preserved** | label updated live, count did not reset. Confirms rule 2's "may reset" resolves to *no reset* here: no external importer of `THEME`, and the edit didn't change `Counter`'s hook signature, so react-refresh hot-swapped it same as case 1 |
| 1 | edit to `case-1-counter.tsx` (render-level, exact value not recorded) | some value | **preserved** | matches rule 1 exactly — component-only export, safe boundary |
| 2 (hook-order break) | inserted `const [label] = useState('Tap to increment')` *before* the existing `count` hook — same file, same exports, only hook order changed | some value | **reset to 0** | confirms lesson section 14: "state preserved as long as Hook call order and arguments do not change" is a separate, stronger rule than the export-shape rules 1–3. This would reset state in *any* of the three cases, not just case 2 — it's orthogonal to what's being tested by rules 1/2/3 |
| 3 (broken, as wired in this drill) | button label text only (JSX string, no hook change) | some value | **preserved** — label updated live, count did not reset | contradicts naive rule-3 reading — see "Case 3 broken: what actually happened" above |
| 3 (fixed) | button label text only (JSX string, no hook change) | 12 | **preserved** — kept incrementing from 12 on the phone after save, label updated | confirms rule 1 restored: `case-3-counter.tsx` exports only `Counter` again, safe boundary on its own merits |

## `useEffect` re-run, recorded

Anchor data point: the case-2 clean retest above — count **9 before → 9
after** a button-label edit. Fast Refresh always re-runs `useEffect(fn, [])`
on a hot update regardless of whether state resets, so `mounted: case-2`
should have logged again on that exact save even though `count` didn't
change. We didn't capture a terminal snippet pinned to that specific
millisecond, but the terminal log from the same session (screenshot,
case-1/2/3 testing) shows `mounted: case-1`, `mounted: case-2` and
`mounted: case-3` each firing multiple times over the course of editing —
consistent with every save re-invoking the effect regardless of case or
whether `count` survived. This matches the lesson's callout precisely:
"Even `useEffect(fn, [])` fires again on every single refresh" — confirmed
independent of the export-shape rule in play.

Takeaway so far: **neither rule 2 nor rule 3 mean "state always resets."**
Both only reliably force a reset when the update-propagation search has
*nowhere safe to land* — rule 2 when some other module also depends on the
non-component export and isn't itself safe; rule 3 when the non-React
consumer has no path back to any component-only boundary. Absent that, a
same-signature edit survives regardless of export shape. The one thing
that reliably *does* force a reset regardless of export shape is changing
the Hook call order/arguments (confirmed above with the case-2 hook-order
break).

## Unresolved questions

- Whether wiring `theme-consumer.ts` into something with genuinely no
  path back to a component boundary (e.g. imported at the app root, or
  into a module-scope store singleton) would actually produce the full
  reload the docs describe — not tried; would need a different drill
  file, not just re-breaking the existing wiring.
- Whether `--lan` is viable for this phone/dev-machine pair (same Wi-Fi,
  no client isolation) as a more reliable alternative to `--tunnel` —
  not yet checked; tunnel drops are just something to watch for in the
  Metro log meanwhile.
