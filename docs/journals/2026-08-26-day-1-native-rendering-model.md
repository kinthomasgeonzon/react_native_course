# Day 1 — The Native Rendering Model

React Native has no DOM — JSX compiles to real native views. Today's
lesson + hands-on drill on Fast Refresh.

## Lesson, in short

- `<View>`, `<Text>`, `<Image>` etc. become real native views, not
  DOM-like approximations.
- New Architecture = JSI (JS↔native) + Fabric (renderer) + TurboModules
  (native functions). Just vocabulary for now.
- Hermes = the JS engine, not a browser. Metro = the bundler (JS + assets).
- Fast Refresh has 3 rules: only-components file → state kept;
  component + other exports → state *may* reset; used by non-React code
  outside the tree → full reload.
- `useEffect`/`useMemo`/`useCallback` always re-run on save, no matter what.

## What the drill actually showed

Built the same counter 3 ways and tested for real on my phone:

1. **Case 1** (component only): state survived edits. As expected.
2. **Case 2** (component + a constant): a simple edit still kept the
   state. "May reset" really means *sometimes*, not *always* — it only
   resets when something else depends on that constant too.
3. **The real way to lose state:** changing the order of hooks (adding a
   new `useState` before the existing one) reset the counter every time —
   in every case, not just case 2. That's the actual reliable trigger.
4. **Case 3** (constant used by a non-React file): expected a full
   reload, didn't get one — state survived here too. Fast Refresh tries
   harder than the docs suggest before giving up. Kept the fix anyway
   (moving the constant to its own file) since it's the safer setup either way.
5. **Bonus failure:** `expo start --tunnel` dropped the connection once
   mid-edit, so an update silently never reached the phone. Looked like a
   Fast Refresh bug, was actually just the tunnel. `--lan` avoids this.

## Takeaway

The "3 rules" are a simplified version of what Metro really does — it
tries to patch things safely first and only resets/reloads when it truly
can't. Only two things reliably break state: a real dead-end import (never
actually reproduced today) and changing hook order (confirmed).

Full test details: `FINDINGS.md` (repo root).
