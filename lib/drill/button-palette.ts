// Plain data module — no components, so importing it never affects a Fast
// Refresh boundary (same discipline as lib/drill/theme.ts). Shared between
// the Pressable AppButton and its TouchableOpacity stretch variant (see
// FINDINGS-drill-4.md) so both read one source of truth for what each
// variant looks like.
export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonPalette = {
  background: string;
  text: string;
  ripple: string;
};

// primary/danger reuse the exact hex values drill-2's chat-bubble-row and
// drill-3's note-composer already established for tint/red, so a button
// placed next to that earlier work doesn't introduce a third shade of blue.
export function getButtonPalette(variant: AppButtonVariant, themeTextColor: string): ButtonPalette {
  switch (variant) {
    case 'primary':
      return { background: '#0a7ea4', text: '#fff', ripple: 'rgba(255,255,255,0.24)' };
    case 'danger':
      return { background: '#e5484d', text: '#fff', ripple: 'rgba(255,255,255,0.24)' };
    case 'secondary':
      return {
        background: 'rgba(104,112,118,0.14)',
        text: themeTextColor,
        ripple: 'rgba(104,112,118,0.3)',
      };
    case 'ghost':
      return { background: 'transparent', text: themeTextColor, ripple: 'rgba(104,112,118,0.3)' };
  }
}
