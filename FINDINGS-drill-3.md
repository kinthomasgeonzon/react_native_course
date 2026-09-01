# FINDINGS — Drill 3: The note composer

Lesson: Week 1 Day 3, "Text, Input and Forms".

## Setup

| Route | Component under test | Purpose |
|---|---|---|
| `/drills/drill-3` | — | hub, links to the composer screen |
| `/drills/drill-3/note-composer` | `components/drill/note-composer.tsx` | the drill itself |

`components/drill/note-composer.tsx` is the reusable, self-contained field
group (state + validation + focus chain). `app/drills/drill-3/note-composer.tsx`
is the thin screen harness: `KeyboardAvoidingView` + dismiss-on-outside-tap +
`ScrollView` wrapping it, same split as drill-2's `card-row`/`chat-row`.

## Requirements, mapped to decisions

### 1–2. Controlled inputs + title → body focus chain

All three fields (`title`, `body`, `tag`) are `useState` + `value`/`onChangeText`
— no `defaultValue` anywhere, since the drill needs live validation on every
keystroke, which only a controlled input gives you.

The focus chain is `bodyRef.current?.focus()` fired from title's
`onSubmitEditing`. What actually makes the return key single-line vs
multiline aware isn't `returnKeyType` (that's label-only) — it's
`submitBehavior`, `blurOnSubmit`'s replacement (confirmed against the current
RN `TextInput` docs, since `blurOnSubmit` itself is flagged deprecated
there):

- **Single-line default: `'blurAndSubmit'`** — return blurs the field *and*
  fires `onSubmitEditing` in the same gesture. That's the entire chain for
  `title`: nothing extra needed to blur it before handing focus to `body`.
- **Multiline default: `'newline'`** — return inserts a newline and does
  **not** fire `onSubmitEditing` at all. That's exactly "body's return
  inserts a newline" — met by doing nothing beyond `multiline`.

Both are written explicitly on the two inputs (`submitBehavior="blurAndSubmit"`
on `title`, `submitBehavior="newline"` on `body`) even though both are
already the default for their respective mode — same habit as drill-2's
explicit `alignContent: 'flex-start'`: naming the mechanism that's actually
doing the work, not leaving it to an unstated default.

### 3. Live validation — title empty or over 60 chars

```ts
const isTitleInvalid = title.trim().length === 0 || title.length > TITLE_MAX_LENGTH;
```

`maxLength` is right there in the lesson's own props table ("Hard cap,
enforced by the input") and would be the obvious reach here — deliberately
**not used** on `title`. The acceptance criterion is "red border + disabled
save when ... over 60 characters," which requires the user to actually be
*able* to type past 60 so that branch is reachable and demoable at all. A
hard `maxLength={60}` would make it dead code the drill could never show
working.

Validation scope is deliberately narrow: only `title` gates `Save`. `body`
and `tag` have no stated validation rule in the drill brief, so none was
invented (YAGNI) — extending it would be scope creep, not a requirement.

### 4. Save button visible/tappable with keyboard open, on both platforms

`KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`,
`keyboardVerticalOffset={useHeaderHeight()}` — the exact combination the
lesson's own code sample shows, `headerHeight` sourced from
`@react-navigation/elements`' `useHeaderHeight()` since this screen renders
under an `expo-router` `Stack` header. Per the lesson's own callout, the docs
don't prescribe this pairing as truth, only that setting `behavior` at all is
recommended — so this is a verify-on-device starting point, not a documented
guarantee, same caveat drill-2 gave `alignContent`/`flexShrink` defaults.

### 5. Tap outside dismisses keyboard; single tap on Save still works

Two mechanisms, doing two different jobs:

- **`keyboardShouldPersistTaps="handled"` on the `ScrollView`** — this is
  the literal fix for the lesson's own "top-five cause of my button is
  broken" callout: without it, the first tap outside an input only dismisses
  the keyboard, so Save's press never lands.
- **An outer `TouchableWithoutFeedback` with a guarded
  `onPress={dismissKeyboardUnlessOnInput}`** wraps the `ScrollView` for the
  "tap outside dismisses the keyboard" half. This is a well-known RN
  community idiom, **not** demonstrated anywhere in the official
  `Keyboard`/`TextInput` docs (checked directly) — called out here as a
  filled-in gap, not documented fact. See "A second real bug" below for why
  it's `TouchableWithoutFeedback` (console-deprecated) and not `Pressable`
  (RN's own recommended replacement), and why the guard function exists at
  all.

`"handled"` is what keeps `keyboardShouldPersistTaps` and the outer wrapper
from fighting: a tap that lands on Save resolves there first; only a tap on
genuinely empty space falls through to the outer wrapper's dismiss.

### Stretch — character counter with `accessibilityLiveRegion="polite"`

Implemented literally as specified. Checked against the RN accessibility
docs: **`accessibilityLiveRegion` (and its alias `aria-live`) is
Android-only** — VoiceOver on iOS does not announce it. An iOS-equivalent
live announcement would need `AccessibilityInfo.announceForAccessibility()`
fired manually from `onChangeText`, which the drill didn't ask for and
wasn't added (scope discipline, not an oversight) — worth flagging since the
prop's name reads as cross-platform and isn't.

## A real bug caught by testing in both themes: TextInput doesn't inherit the theme

Same shape of bug drill-2's `CardRow` hit. `ThemedText`/`ThemedView` route
color through `useThemeColor`, but RN's own `TextInput` doesn't — it
defaults to black typed text with no themed background. First pass left all
three `TextInput`s unstyled for color; screenshotting in
`prefers-color-scheme: dark` (Puppeteer, same technique as drill-2's
theme-toggle check) *looked* fine — because Chromium auto-styles unstyled
`<input>`/`<textarea>` elements for dark mode. That's a property of the
browser rendering an actual DOM `<input>` under `react-native-web`, not of
this code: native iOS/Android `TextInput` has no such auto-dark-mode
fallback and would have rendered invisible black-on-dark text on a real
device. Fixed by wiring `color`/`placeholderTextColor` through the same
`useThemeColor` hook `ThemedText`/`ThemedView` already use
(`'text'`/`'icon'` tokens), closing the gap for real instead of only on the
one platform where it happened to be masked.

## A second real bug, found by the user in real testing: the dismiss-wrapper stole focus from every field

After the first pass shipped, the user reported: "focus disappears
immediately even after clicking on the field" — every tap on Title/Body/Tag
would flash-focus then immediately lose it again, screenshotted live with
`asd` sitting in the Title field but no cursor.

First (wrong) hypothesis: this looked like the `Pressable` swap made moments
earlier (to silence the `TouchableWithoutFeedback is deprecated` warning,
described in the previous revision of this doc) — `Pressable`'s press
detection could plausibly fire on a bubbled click from a nested `TextInput`
in a way `TouchableWithoutFeedback` wouldn't. Reverted `Pressable` →
`TouchableWithoutFeedback` and re-tested. **Bug was still there.** Isolated
it properly by testing with the outer wrapper removed entirely — focus
retention was perfect with no wrapper at all, confirming the wrapper itself
was the cause, regardless of which of the two components it was.

Root cause, confirmed by testing: `react-native-web` renders `TextInput` as
a real DOM `<input>`/`<textarea>`. The browser focuses it on `mousedown`,
*before* the resulting `click` event finishes bubbling — and that click
still bubbles all the way up to the outer wrapper (`Pressable` and
`TouchableWithoutFeedback` alike; this isn't specific to either), whose
`onPress` calls `Keyboard.dismiss()`. On `react-native-web`,
`Keyboard.dismiss()` blurs whatever's currently focused — so the field the
browser had just focused gets blurred again in the same gesture. Native's
own touch-responder negotiation lets a descendant `TextInput` claim its
touch and never bubbles to an ancestor's responder at all, so **this has no
native equivalent** — it's a `react-native-web`-only failure mode of the
"wrap the whole screen in a dismiss-on-tap handler" idiom, and the one this
project can headlessly test happens to be exactly the platform where it
breaks.

Fix: a small guard, `dismissKeyboardUnlessOnInput`
(`app/drills/drill-3/note-composer.tsx`) — on web only, read the raw click's
`event.nativeEvent.target` and skip `Keyboard.dismiss()` if its `tagName` is
`INPUT`/`TEXTAREA`, so a tap that lands directly on a field never undoes the
focus the browser just gave it. Every other tap (background, text, the Save
button's own `<div>`) still dismisses normally. This also meant reverting
back to `TouchableWithoutFeedback` — the console's deprecation nudge toward
`Pressable` doesn't apply here, since `Pressable` demonstrably breaks this
exact interaction and `TouchableWithoutFeedback` (with the guard) doesn't;
working behavior wins over a cosmetic warning.

**Why the first Puppeteer pass never caught this**: every earlier test typed
into fields with Puppeteer's `elementHandle.type()`, which **focuses the
element itself before sending each key** — so even if a prior click had
already silently lost focus, `.type()` would re-focus it. A regression that
only shows up *between* a click and the next explicit focus call was
invisible to a test harness that always re-focuses before typing. Re-tested
with `page.keyboard.type()` (which types into whatever currently has focus,
without forcing it) after only a `.click()` + a settle delay, and confirmed
focus is retained on `Title` and `Body` after a real click, while a tap on
genuinely outside content (the subtitle text) still correctly blurs the
field (`document.activeElement` becomes `<body>`), and the Save button still
fires (`onSave` log observed) — closing the loop on both halves of criterion
5 for real this time.

## A third real bug, found on a real Android device: `behavior="height"` truncated the scroll content

User screenshot (Expo Go, real Android phone): Title/Body render fine, but
Tag's input box is clipped mid-border and Save never appears — a large
blank area fills the rest of the screen instead, and it doesn't scroll any
further to reveal them. Critically, **the on-screen keyboard was not open**
in the screenshot, which rules out an actual keyboard-avoidance timing bug
(`KeyboardAvoidingView` only recalculates height in response to
show/hide events) and points at the height calculation itself being wrong
even at rest.

This project has `"android": { "edgeToEdgeEnabled": true }` in `app.json`.
Checked Expo's own config docs for `android.edgeToEdgeEnabled`: it states
explicitly that enabling it *"may cause unexpected keyboard behavior on
Android when using the `softwareKeyboardLayoutMode` set to `resize`"* — and
`resize` is this SDK's documented default for `softwareKeyboardLayoutMode`
(not overridden in this project's `app.json`), so both halves of that
warning apply here. Android already natively resizes the window for
`resize` mode; layering RN's own JS-driven `behavior="height"` on top is
redundant at best, and — per this live report — actually miscalculates the
available height under edge-to-edge, permanently truncating the `ScrollView`
regardless of keyboard state.

Fix: `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — no
`behavior` at all on Android, letting the native `resize` window mode do the
actual work and sidestepping RN's own height override entirely. This is a
deliberate deviation from the lesson's own literal "padding on iOS, height
on Android" suggestion — which the lesson itself flags as "a starting point
to verify on a device, not documented truth" — after real-device testing
showed it broken specifically in this edge-to-edge project. Also added
`paddingBottom: 24 + insets.bottom` (via `useSafeAreaInsets`) to the
`ScrollView`'s content, defensively, so the last element (Save) always
clears the edge-to-edge system navigation bar with margin, independent of
the height-calc issue.

**Verification status**: confirmed no crash and no regression on the web
proxy (`useSafeAreaInsets` resolves fine — `expo-router` provides its own
`SafeAreaProvider` — and the full functional suite above still passes
unchanged). The actual fix for the reported symptom — Tag/Save reachable by
scroll on the real device — has **not yet been re-confirmed on that same
Android phone**, since this session has no way to drive a physical device.
Needs the user to reload and re-test.

## Runtime verification (`npx expo start --web`, 390×844 mobile viewport)

No iOS/Android simulator or device available this session. Ran the web
build and drove it headlessly with Puppeteer (`automate-browser` skill,
consolidated into a single-session script — the skill's own CLI scripts
each launch a fresh Node process and don't reliably reattach to the same
browser tab across calls, which surfaced as `about:blank`/empty snapshots
until the flow was rewritten as one script/one page).

Confirmed on the DOM, not just by reading the code:
- All three fields + Save render; empty title → Save at `opacity: 0.4`
  (disabled) and title border `rgb(229, 72, 77)` (red).
- Typing a valid title ("Grocery list") → Save `opacity: 1`, border
  `rgb(136, 136, 136)` (neutral gray).
- Typing 65 `x`s → border red again, Save disabled again, counter reads
  exactly `65/60`.
- Valid title + `Enter` → focus moves to `body` (`document.activeElement`
  checked directly), title text is preserved (not cleared), Save stays
  enabled.
- In `body`: typed `"line one"`, `Enter`, `"line two"` → value contains
  `\n`, both lines present, field **stays focused** after `Enter` (proving
  `submitBehavior="newline"` did its job — no blur, no submit).
- Clicking the subtitle text (outside every input) → no error, and it
  correctly blurs a focused field (`document.activeElement` → `<body>`).
- Console: zero errors on every run. One warning throughout, pre-existing
  and unrelated (traced in drill-2's FINDINGS to `expo-router`'s own
  bundle): `props.pointerEvents is deprecated`. `TouchableWithoutFeedback is
  deprecated` also appears — a deliberate, accepted tradeoff (see "A second
  real bug" above): the `Pressable` alternative silently breaks focus
  retention on web, so the warning is kept in exchange for correct behavior.
- Re-screenshotted under both `prefers-color-scheme: light` and `dark`
  (Puppeteer `emulateMediaFeatures`) after the theming fix: labels,
  placeholders, and typed text all show correct contrast in both themes.

This confirms the validation logic, the focus chain, multiline newline
behavior, the outside-tap handler, and theme contrast all work correctly on
the one platform testable headlessly here. It does **not** substitute for
device verification — `KeyboardAvoidingView`'s entire job is reacting to a
real on-screen software keyboard occluding the viewport, and no such
keyboard exists in a desktop browser (headless or not), so criterion 4
("save button stays visible/tappable with the keyboard open, on both a
small Android phone and an iPhone SE") is **unverified by this pass** —
web can prove the layout doesn't crash and the tap-handling logic is sound,
but not that the `padding`/`height` split actually keeps Save above a real
keyboard on either platform.

## What's still unverified

- **`KeyboardAvoidingView` behavior on a real device** (criterion 4) — the
  one requirement web fundamentally cannot exercise, since there's no
  virtual keyboard to avoid. A real bug was already caught and fixed on
  Android (see "A third real bug" above — the `behavior="height"` +
  edge-to-edge truncation), but the fix itself is not yet re-confirmed on
  that device. Still needs: (a) the same Android phone, reloaded, to
  confirm Tag/Save now scroll into view *and* stay reachable with the
  keyboard actually open; (b) an iPhone SE (or simulator), untested
  entirely.
- **`accessibilityLiveRegion="polite"` actually being announced by TalkBack**
  on a real Android device — confirmed it's wired correctly and is
  Android-only per docs, but "the docs say Android announces it" was not
  independently confirmed with a screen reader running.
- **iOS entirely** — untested on any real device or simulator, same gap
  drill-2 closed with `FINDINGS-drill-2.md`'s open items.
