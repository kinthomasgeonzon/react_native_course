# FINDINGS — Drill 4: One button to rule them all

Lesson: Week 1 Day 4, "Touch and Press Handling".

## Setup

| Route | Component under test | Purpose |
|---|---|---|
| `/drills/drill-4` | — | hub, links to the two screens below |
| `/drills/drill-4/gallery` | `components/drill/app-button.tsx` | variants, disabled, loading, 24×24 icon button + hitSlop debug outline |
| `/drills/drill-4/bounds-clipping` | same, `iconOnly` usage | written + live repro of "why your tap went somewhere else" |

`components/drill/app-button.tsx` is `AppButton`, the reusable component. `lib/drill/button-palette.ts`
is a plain data module (no components, so it never affects a Fast Refresh boundary — same discipline
as `lib/drill/theme.ts`) holding the variant → color map, so a stretch TouchableOpacity rewrite could
share it without duplicating the palette.

## Requirements, mapped to decisions

### `AppButton` on `Pressable`

All of `pressed` styling, `disabled`, `loading`, `variant` (primary/secondary/danger + a `ghost`
variant added for icon buttons), `android_ripple`, `hitSlop`, `accessibilityRole="button"` are plain
props — nothing hardcoded. `iconOnly` is one addition beyond the literal prop list: a boolean that
swaps the padded-pill layout for a fixed 24×24 box, so the icon button reuses the exact same
Pressable core (ripple, accessibility, disabled/loading gating) instead of a second hand-rolled
component.

**`disabled` vs `loading` — two different accessibility signals on purpose.** Both gate the press the
same way underneath (`Pressable disabled={disabled || loading}`), but `accessibilityState` reports
them separately: `{ disabled, busy: loading }`, exactly as the checklist's literal
`accessibilityState={{ disabled, busy }}` implies. `disabled` tells assistive tech "this will never
activate as things stand"; `busy` tells it "temporarily unavailable, will accept input again shortly."
Collapsing `loading` into `disabled` would misreport a mid-request Save button as permanently dead.

**"Opacity on iOS, ripple on Android"** — read literally, not as one blended cross-platform effect.
`android_ripple` already paints Android's feedback natively (ignored by iOS entirely); on iOS there's
no ripple, so `Pressable`'s `pressed` render-prop drives a plain `opacity: 0.6` dim instead
(`Platform.OS === 'ios' && pressed && styles.iosPressed`). No JS-driven background-color swap on
either platform — the native mechanism does the job on both.

**`unstable_pressDelay={0}`, written explicitly.** Confirmed against the current RN docs
(`reactnative.dev/docs/0.81/pressable` — the versioned URL under `docs.expo.dev/versions/v54.0.0/`
that AGENTS.md points at 404s for this exact page, so the RN docs site's own `/docs/0.81/` path was
used instead) that `unstable_pressDelay` is still the real prop name in this SDK, not renamed. Its
default is already "no delay," so this is the same habit drill-2 and drill-3 established: naming the
mechanism explicitly rather than leaning on an unstated default, since it's the literal knob the
lesson names for "press latency is imperceptible."

**Icon-only + no title → dev-time guard, not a type-level one.** `iconOnly` buttons have no `title`
for `accessibilityLabel` to fall back to, so a real caller must pass one explicitly. Enforced with a
`__DEV__`-only `console.warn`, not a conditional TypeScript type — the drill doesn't call for
type-level ceremony here, and a runtime nudge catches the real mistake (a genuinely inaccessible icon
button shipping) without adding a generic-heavy prop type nobody asked for.

### 24×24 icon button reaching 44/48

`ICON_VISUAL_SIZE = 24`, `hitSlop = 12` on every side → effective target `48×48`, the lesson's own
worked example. The gallery screen's debug-outline toggle renders a dashed 48×48 box, `pointerEvents="none"`,
centered exactly on the icon (`components/drill/app-button.tsx`'s `iconOnlyBase` centers the 24×24
box inside whatever wrapper it's given) — sized and positioned to double as the required
debug-outline screenshot.

### Bounds-clipping repro (`bounds-clipping.tsx`)

Layout: a 72×72 dashed "parent" `View` with **no `overflow` style at all** (the point being that this
isn't a CSS-overflow effect), and a `marginLeft: 72 - 12` push on the icon's wrapper — the math that
puts exactly half the 24-wide icon (12px) inside the parent's box and half (12px) past its right edge.
A "control" copy of the same button, fully inside its own 72×72 parent, sits below it to make the
contrast legible instead of asserting the bug from one demo alone.

## Real findings from testing (Puppeteer, `npx expo start --web`, one consolidated script — same
discipline as FINDINGS-drill-3.md's "one script/one page")

### 1. `hitSlop` only expands the hit region for touch input on `react-native-web`, not for mouse clicks

First pass used `page.mouse.click()` at points progressively further from the icon's visual edge
(0–20px). **None registered** — not even a click at the exact boundary pixel. That looked like
`hitSlop` was simply broken on web. Re-ran the identical points with `page.touchscreen.tap()` under
emulated touch (`page.emulate({ hasTouch: true, isMobile: true })`): a tap 6px past the edge
registered, one 11–14px past it did not — a clean match for `hitSlop={12}`.

**Conclusion**: `AppButton`'s `hitSlop` is correct; `react-native-web`'s Pressable only threads
`hitSlop` through its touch-responder path, not through plain mouse-event dispatch. Anyone testing an
RN-web build's touch targets with a bare Puppeteer `.click()` will get a false negative here —
touch emulation (or a real touchscreen) is required to see it work. This has no bearing on native
iOS/Android, where `hitSlop` is a first-class native prop regardless of input device.

### 2. The parent-bounds hit-test clipping the lesson describes does **not** reproduce on `react-native-web`, under either mouse or touch

Tapped the half-clipped icon's inside portion (registers, as expected) and its outside portion — the
part painted past the dashed parent's right edge. **It also registered**, under both mouse-click and
touch-emulated taps, and regardless of the parent having no `overflow` style set. `elementFromPoint`
at that coordinate resolves to the icon's own DOM node — the click just hit-tests wherever the pixels
are painted, with no ancestor-bounds check at all.

**Conclusion**: "a touch area never extends past its parent's bounds" is native gesture-responder
behavior with no web equivalent — `react-native-web` dispatches through ordinary DOM hit-testing,
which doesn't clip to an ancestor's layout box the way native's responder negotiation does. The repro
screen's geometry and written explanation are accurate to the real native bug; the untappable outcome
itself is **only observable on a real iOS/Android device or simulator**, never in this project's web
preview. Flagged directly in the screen's UI (a `Platform.OS === 'web'`-gated note) so nobody mistakes
"both counters go up on web" for the component being broken. This is the mirror image of drill-3's
`KeyboardAvoidingView` gap: there, web was blind to a feature it can't exercise (no virtual keyboard);
here, web fails to reproduce a bug that's real on native.

### 3. "onPress never fires when disabled or loading" — rigorously confirmed, not just visually

Added a `saveStarts` counter (`gallery.tsx`) purely as a test hook: it increments once per
`handleSave` call. Fired 5 rapid taps at the Save button while a save was in flight (`SAVE_DELAY_MS`
= 1200ms). `saveStarts` stayed at `1` throughout and after — React's re-render from the first tap's
`setIsSaving(true)` reliably beat the next simulated tap in this environment, so no double-fire was
observed. This is an environment-timing result (fast synthetic taps, not two independent human
fingers), not a hardware guarantee — noted rather than overstated.

## Runtime verification (`npx expo start --web`, 420×900/950 viewport)

Confirmed on the DOM (not just by reading the code), via one consolidated Puppeteer script:
- Primary/secondary/danger variants each fire `onPress` independently (`Primary: 1` etc.), and render
  visually distinct in both light and dark (`prefers-color-scheme`) — secondary and the icon button's
  `ghost` variant both route text/icon color through `useThemeColor`, so unlike drill-3's `TextInput`
  gap, nothing here defaults to unthemed black.
- Disabled button: 2 taps → counter stays at `0`.
- Loading: 5 rapid taps → exactly 1 save start; text cycles `Save` → `Saving…` → `Save`.
- Icon button: center tap and a touch-emulated tap 4px past the visual edge (within `hitSlop=12`)
  both register; a plain mouse click past the edge does not (see finding 1).
- Bounds-clipping: inside tap registers on both the clipped button and its control; the clipped
  button's outside tap also registers on web only (see finding 2) — not treated as a passing result,
  called out explicitly in-app and here.
- Console: zero new errors on either screen. The same pre-existing, unrelated
  `props.pointerEvents is deprecated` warning drill-2/drill-3 already traced to `expo-router`'s own
  bundle.
- `npx tsc --noEmit` and `expo lint`: both clean.

## What's still unverified

- **The bounds-clipping repro's actual untappable outcome** — confirmed by this session's own testing
  to be unreproducible on web (finding 2); needs a real iOS/Android device or simulator to see the
  outside tap genuinely fail, the way the lesson describes.
- **Platform-idiomatic feedback on a real device** — Android's `android_ripple` visual and iOS's
  opacity dim are both wired per the docs, but neither has been screenshotted on real hardware, same
  device gap drill-2 and drill-3 left open.
- **The required debug-outline screenshot** — the gallery screen's toggle renders the 48×48 outline
  and this session's own Puppeteer run confirms the tap target functionally reaches it (via touch
  emulation), but the actual screenshot artifact the checklist asks for should be captured on-device,
  where `hitSlop` is unambiguously native rather than routed through the web-only nuance in finding 1.
- **TalkBack/VoiceOver** reading `accessibilityState.busy` correctly during `loading` — wired per the
  API, not confirmed with a screen reader running (same category of gap as drill-3's
  `accessibilityLiveRegion` note).

## Not implemented (stretch, not requested)

The lesson's stretch goal — rewrite `AppButton` on `TouchableOpacity` and write up what's lost — was
skipped this pass since it wasn't asked for, and a second, unused component sitting in the tree with
no screen wiring it up would just be dead code. Worth noting anyway since the palette module was
already split out to make this cheap later: doing it now would mean giving up `pressed`-driven
render-prop styling and content (no `({ pressed }) =>` on `style`/`children` — `TouchableOpacity` only
exposes `activeOpacity`, so `loading`'s spinner-vs-title swap would need to move into a `useState` a
consumer manages, not something the button computes internally), the `android_ripple` prop entirely
(Android feedback would fall back to `TouchableOpacity`'s opacity dim, losing the platform-idiomatic
ripple this drill's checklist item 1 asks for), and `unstable_pressDelay`'s fine-grained control over
`onPressIn` timing.
