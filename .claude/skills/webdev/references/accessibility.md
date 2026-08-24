# Accessibility (WCAG 2.2 AA)

Accessibility is not a review-time checklist; it is decided while writing the
markup. Retrofitting ARIA onto `<div>` soup costs ten times more than using the
right element.

## Semantics First

- One `<h1>` per page; heading levels descend without skipping. Screen-reader
  users navigate by headings more than any other mechanism.
- Landmarks: `<header>`, `<nav>`, `<main>` (exactly one), `<aside>`, `<footer>`.
- Buttons do things; links go places. `<div onClick>` is not focusable, not
  keyboard-activatable, and not announced — it is a bug, every time.
- Lists are `<ul>`/`<ol>`. Tables are `<table>` with `<th scope>` — never a grid
  of divs for tabular data.
- **First rule of ARIA: don't.** A native element beats any ARIA reconstruction.
  Wrong ARIA is worse than none.

## Keyboard

Every interactive element must be reachable and operable with keyboard alone.
Test by unplugging the mouse and completing your main flow.

- Tab order follows visual order. Never use positive `tabindex`.
- Visible focus indicator on everything focusable — minimum 3:1 contrast against
  the adjacent colour. Removing `outline` without a replacement is a WCAG
  failure (2.4.11 Focus Not Obscured, 2.4.13 Focus Appearance).
- `Escape` closes dialogs, popovers, menus.
- Modals trap focus while open and **return focus to the trigger** on close.
- Provide a "Skip to content" link as the first focusable element.
- Do not hijack browser shortcuts or trap focus outside a modal.

## Names, Roles, Values

Every control needs an accessible name:

```tsx
<button aria-label="Close dialog"><X aria-hidden="true" /></button>
<input id="q" /><label htmlFor="q">Search</label>
<img src="/chart.png" alt="Revenue rose 40% from Q1 to Q2" />
<img src="/divider.svg" alt="" />        {/* decorative: empty alt, not omitted */}
```

- Icon-only buttons always need `aria-label`; the icon gets `aria-hidden="true"`.
- Alt text conveys the *information*, not the picture. "Chart" is useless.
- Toggle state via `aria-pressed` / `aria-expanded`, not colour alone.

## Announcing Change

- Async results: `aria-live="polite"` region. Errors and alerts: `role="alert"`
  (assertive).
- Route changes in an SPA move focus to the new page's `<h1>` and update
  `document.title`; otherwise a screen-reader user does not know anything
  happened.
- Loading states need text, not only a spinner: `<span class="sr-only">Loading
  results</span>`.

## Colour and Contrast

| Content | Minimum ratio |
|---------|---------------|
| Body text | 4.5:1 |
| Large text (≥ 24 px, or ≥ 19 px bold) | 3:1 |
| UI components, focus rings, icons | 3:1 |

Colour is never the only signal — error states get an icon or text as well as
red. Check both light and dark themes; dark mode regressions are common.

## Motion, Zoom, Targets

- Respect `prefers-reduced-motion`: replace transform/parallax with a fade or
  nothing.
- Page must work at 200% zoom and at 320 px width without horizontal scrolling.
- Touch targets ≥ 24×24 CSS px (WCAG 2.2 §2.5.8); 44×44 is the comfortable size.
- Nothing may flash more than three times per second.

## Testing

1. **Automated** — `axe-core` / `@axe-core/playwright` in CI. Catches ~30%.
2. **Keyboard** — complete the main flow with no mouse.
3. **Screen reader** — VoiceOver (macOS/iOS) or NVDA (Windows) on the primary flow.
4. **Zoom + reduced motion + dark mode** spot checks.

Automated tools find contrast and missing labels. They cannot tell you that the
focus order is nonsense or that your alt text is wrong.
