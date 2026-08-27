# FINDINGS — Drill 2: Port and defend

Lesson: Week 1 Day 2, "Layout and Flexbox on Native".

## Setup

| Route | Component under test | Purpose |
|---|---|---|
| `/drills/drill-2` | — | hub, links to all three pieces below |
| `/drills/drill-2/card-row` | `components/drill/card-row.tsx` | Part 1 — web → native port |
| `/drills/drill-2/chat-row` | `components/drill/chat-bubble-row.tsx` | Part 2 — chat bubble row |
| `/drills/drill-2/themed-text` | `components/drill/themed-text.tsx` | criterion 4 — `ThemedText` |

Stretch goal (`Badge` + `StyleSheet.flatten` test) was explicitly skipped —
the repo has no test runner (no `jest`), and adding one was out of scope
for this pass.

## Part 1 — card row: the annotated diff

No literal web snippet ships with the lesson page — it only describes the
shape ("a wrapping card row using `display: flex`, `flex-wrap`,
`align-content`, `gap` and `px` units"). Reconstructed a representative
snippet from that description and ported it:

```css
/* given (reconstructed from the lesson's description) */
.card-row { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 12px; }
.card { width: 160px; padding: 12px; border-radius: 8px; background: #eee; }
```

```tsx
// ported — components/drill/card-row.tsx
row: {
  flexDirection: 'row',      // (1)
  flexWrap: 'wrap',
  alignContent: 'flex-start', // (2)
  gap: 12,                    // (3)
},
card: {
  width: 160,
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#eeeeee', // (4)
},
```

Four default differences from the lesson's table apply to this snippet.
Naming which ones actually *forced* a change, per the lesson's closing
note ("naming which default forced each change is the skill that
transfers"):

1. **`flexDirection`** — forced a change. Web's `display: flex` gives you
   `row` for free; RN's default is `column`. Without
   `flexDirection: 'row'` the cards would stack vertically instead of
   wrapping into a grid.
2. **`alignContent`** — did *not* force a change. RN's default is already
   `flex-start` (web's default is `stretch`, which is why the source CSS
   states it explicitly). Kept the line anyway to mirror the source 1:1,
   but it's a no-op on RN.
3. **`flexShrink`** — did *not* force a change here, for a reason worth
   defending: the cards have a fixed `width: 160` and live inside a
   *wrapping* row. Once a line runs out of width, `flexWrap: 'wrap'`
   moves the next card to a new line rather than shrinking it — shrink
   only matters for the last item that would otherwise overflow a
   non-wrapping line. So RN's `flexShrink: 0` default vs web's `1`
   doesn't visibly diverge for this particular layout. It would matter
   the moment `flexWrap` is dropped.
4. **Units** — forced a change. `gap: 12px` → `gap: 12` (unitless dp).
   Same for `width: 160px` → `width: 160`, `padding: 12px` → `padding: 12`.

## Part 2 — chat bubble row: the defence

`components/drill/chat-bubble-row.tsx`. Four requirements, one style
decision each:

1. **Fixed 40dp avatar.** `width: 40, height: 40`, no explicit
   `flexShrink`. RN already defaults `flexShrink` to `0`, so the avatar
   can't be squished by its siblings without writing anything extra —
   the opposite of web, where you'd need `flex-shrink: 0` explicitly to
   get the same protection (web defaults to `1`).
2. **Message body that grows and wraps without overflowing.** Used
   `flex: 1`, not `flexGrow: 1`. Verified against the RN docs
   (`layout-props`): `flex: <positive number>` "equates to
   `flexGrow: <n>, flexShrink: 1, flexBasis: 0`" — the shorthand already
   includes `flexShrink: 1`. That's exactly the fix the lesson calls out
   ("children overflow instead of squishing... fix it with
   `flexShrink: 1`"), and it comes for free from `flex: 1` as long as
   you use the shorthand rather than `flexGrow` alone. Using
   `flexGrow: 1` by itself would keep RN's `flexShrink: 0` default and
   reproduce the overflow bug.
3. **Timestamp that never shrinks.** No style needed beyond
   `fontSize`/`opacity` — RN's `flexShrink: 0` default already protects
   it, same reasoning as the avatar.
4. **Absolutely positioned unread dot.** The dot uses
   `position: 'absolute'` inside `avatarWrap`, which is the
   `position: 'relative'` anchor (RN's own default for `position`,
   written explicitly for clarity rather than relied on silently) — not
   offset with margins.

**Acceptance check — 400-character message:** `app/drills/drill-2/chat-row.tsx`
renders a message built from `'…'.repeat(4)`, 448 characters, verifying the
row survives without overflow or a clipped timestamp.

## `ThemedText` (criterion 4): a real bug caught by "port and defend"

`components/drill/themed-text.tsx`. The lesson's own inline example writes
`Platform.select` with the three color calls as plain values:

```ts
// as given in the lesson
const label = Platform.select({
  ios: DynamicColorIOS({ light: '#11181c', dark: '#ecedee' }),
  android: PlatformColor('?android:attr/textColorPrimary'),
  default: '#11181c',
});
```

Transcribed literally, **this crashes on Android.** Checked the RN source
(`PlatformColorValueTypes.android.js`): it exports `PlatformColor` but
**does not export `DynamicColorIOS` at all** — Metro resolves the
platform-suffixed file per build, so on an Android bundle
`DynamicColorIOS` is `undefined`. JavaScript evaluates every value in an
object literal before `Platform.select` ever runs, so
`DynamicColorIOS({...})` is called unconditionally regardless of which
branch would end up selected — `undefined(...)` throws
`TypeError: DynamicColorIOS is not a function` on Android, before
`Platform.select` gets a chance to discard that branch.

(`PlatformColor`, by contrast, *is* exported on both platforms — calling
it with an Android-shaped string on iOS doesn't throw at construction;
it just produces an inert descriptor that would only fail if actually
applied as a style on the wrong platform. `DynamicColorIOS` is the one
that's missing outright.)

First fix: guard the `DynamicColorIOS` reference so it's never evaluated
on Android (a `Platform.OS === 'ios'` ternary, not a `Platform.select`
object literal, so the untaken branch never runs).

### Second bug, found on a real device: Android's `PlatformColor` doesn't track the toggle in Expo Go

Handed the app to the user to test on a real Android phone running Expo
Go. Reported result: in dark mode, dark text on a dark box; in light
mode, light text on a light box — invisible in *both* themes, not just
unthemed.

Root cause: `PlatformColor('?android:attr/textColorPrimary')` resolves
against the **host app's actual applied native theme** — not against
`Appearance`/`useColorScheme()`, which is a separate, JS-level signal
that reads `Configuration.uiMode` directly and is unaffected by this.
This project has never been through `expo prebuild` (no `android/` or
`ios/` folder, no dev client in `package.json`), so it runs inside **Expo
Go's own shared, pre-built shell app** — a single APK whose native theme
this project's `app.json` (`userInterfaceStyle: "automatic"` +
`expo-system-ui`) has no way to reach, since that config only takes
effect via the native config-plugin system at `expo prebuild` time, which
never runs for an Expo-Go-hosted project. So the attribute resolves
against whatever theme Expo Go's shell happens to apply, independent of
the live OS toggle — explaining why it didn't track either direction.

`DynamicColorIOS` doesn't have this problem — it's resolved by iOS's own
trait-collection system at paint time, with no host-app native
configuration involved, which is exactly why the lesson's own sample only
breaks this way on the Android half.

This isn't fixable in JS while staying on a host-theme attribute; it
needs either a custom dev client (`expo run:android` / EAS build) so the
project's own native theme actually applies, or a strategy that doesn't
depend on the host theme at all. Chose the latter, per the user's call:
drop `PlatformColor` for the Android branch and drive it from
`useColorScheme()` instead, with the same two explicit hex values
`DynamicColorIOS` uses for iOS:

```tsx
const iosColor: ColorValue =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: LIGHT_TEXT, dark: DARK_TEXT }) : LIGHT_TEXT;

export function ThemedText({ style, ...rest }: TextProps) {
  const scheme = useColorScheme();
  const color: ColorValue = Platform.OS === 'ios' ? iosColor : scheme === 'dark' ? DARK_TEXT : LIGHT_TEXT;
  return <Text style={[styles.text, { color }, style]} {...rest} />;
}
```

**This is a deliberate deviation from criterion 4's literal wording**
("PlatformColor on Android") — chosen because the literal version cannot
be verified working in this project's actual test environment (Expo Go,
no dev client), and the point of the criterion is a working,
screenshot-able artifact, not just the two function names appearing in
source. iOS keeps the real `DynamicColorIOS` call, since that one has no
such limitation.

## Runtime verification (`npm run web`, 390×844 mobile viewport)

No iOS/Android simulator is available in this environment, but
`react-native-web` is a project dependency, so ran `npx expo start --web`
and drove it headlessly (Puppeteer, `automate-browser` skill) at a
390×844 viewport to actually exercise the layout instead of only reading
the code. `npx tsc --noEmit` and `npm run lint` were also re-run clean
after the final edits.

- **Card row** — confirmed wrapping into a 2-column grid (8 cards, 2 per
  row) at phone width; a wide desktop viewport shows the same 8 in one
  row, same markup, proving it's a real flex-wrap, not a fixed grid.
- **Chat row** — confirmed the 448-char message wraps across many lines
  with zero horizontal overflow, and all three timestamps (`9:41 AM`,
  `9:52 AM`, `10:03 AM`) stay fully visible/unclipped regardless of
  message length. Unread dot renders on the avatar's top-right corner in
  both rows that pass `unread`.
- **ThemedText** — after the `useColorScheme()` rewrite, re-screenshotted
  the demo screen under both `prefers-color-scheme: light` and `dark`
  (Puppeteer's `emulateMediaFeatures`): dark text on a light box in light
  mode, light text on a dark box in dark mode — correct contrast in both.
  This exercises the same `Platform.OS !== 'ios'` branch Android takes
  (web isn't `'ios'` either), so it's a reasonable proxy for the Android
  fix specifically, though not a substitute for testing on the actual
  phone that reported the bug.
- **Console** — zero errors/warnings on any of the three screens or the
  `/drills/drill-2` hub; the one warning seen (`props.pointerEvents is
  deprecated`) traces to `expo-router`'s own bundle, not drill code.

This confirms Part 1, Part 2, and criteria 2–3 render and behave
correctly on the one platform I can actually run headlessly. It does
**not** substitute for iOS/Android verification — react-native-web has
its own layout engine (Yoga on native vs CSS flexbox translation on web),
so default-diff nuances documented above are best-effort correct but only
empirically confirmed on web.

**Bug caught by this pass, since fixed:** re-ran both screens with
`page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])`.
Chat row held full contrast (everything routes through the theme-aware
`ThemedText`/`ThemedView`). Card row did not — `CardRow` used `ThemedText`
for the "Card N" label, which resolves to `#ECEDEE` in dark mode, against
the card's *fixed* `#eeeeee` background (deliberately hardcoded to match
the given web CSS, so it does not flip with the theme). Those two colours
are nearly identical — the label was almost invisible. Fixed by giving the
label a fixed dark colour (`#11181c`) instead of `ThemedText`, since a
hardcoded background needs a hardcoded, matching text colour — nothing
propagates automatically ("there is no cascade," same lesson section).
Re-screenshotted in dark mode to confirm.

## What's still unverified

Real device testing (Android, Expo Go) is what caught the Android
`PlatformColor` bug above — genuinely more valuable than anything the web
proxy caught on its own. Still open:

- **Confirm the Android fix on the same physical device** that reported
  the original bug. Web (`prefers-color-scheme` emulation) confirms the
  `Platform.OS !== 'ios'` branch's logic is sound, but hasn't been
  confirmed on the actual phone yet.
- **iOS — never tested at all**, simulator or device. `DynamicColorIOS`
  is expected to work (it's self-contained, no host-app theme
  dependency, unlike the Android attribute that just failed), but that's
  a reasonable expectation, not a verified fact.
- **Card row / chat row on real iOS/Android** — still only verified via
  `react-native-web` at a phone-sized viewport, not native Yoga. Given
  the Android `PlatformColor` surprise, don't fully trust "should be
  fine" reasoning over an actual on-device check for the rest of Part 1
  and Part 2 either.
- **Both-theme screenshots** (criterion 4's literal ask) — still not
  captured. To finish: on the Android phone that found the bug, and
  separately on an iOS simulator/device → Home → Step 5 → ThemedText
  demo → toggle system appearance (iOS Simulator: Settings → Developer →
  Dark Appearance; Android: Settings → Display → Dark theme) → reload →
  screenshot both states on both platforms.
