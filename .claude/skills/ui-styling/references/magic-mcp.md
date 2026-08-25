# 21st.dev Magic MCP — Generated Components

Magic is an optional MCP server that generates React + Tailwind components from a
natural-language description ("v0 in your editor"). This file covers **when it
earns its place** and **what to do with its output** — because generated code
that ships unedited is how a design system quietly dies.

Magic is not installed by default in this repo's stack: it needs an API key, and
the base `.mcp.json` is deliberately secret-free. Setup lives in
`stack/docs/SETUP.md`.

## Tools

The server exposes (legacy names in parentheses):

| Tool | Was | Does |
|------|-----|------|
| `generate` | `21st_magic_component_builder` | Builds a component from a prompt |
| `get_inspiration` | `21st_magic_component_inspiration` | Pulls reference designs from the 21st.dev catalog |
| `search_logo` | `logo_search` | Fetches a company logo as SVG/JSX |

The old `/ui` and `/21` triggers were a convention baked into the legacy tool
descriptions, not part of the protocol — describe what you want in plain language
instead. The tool set changes; call `tools/list` rather than trusting this table
if something is missing.

**Keys:** issued at 21st.dev. Keys from the old Magic console were reset and no
longer work anywhere. The env var is `API_KEY` (`TWENTY_FIRST_API_KEY` and
`API_KEY_21ST` are also accepted). Keep it out of git — `.claude/settings.local.json`
or your shell env, both gitignored.

## When to Reach for It

Magic is a **starting-point generator**, not a design authority. It knows what
components on the internet look like; it does not know your product's palette,
type scale, spacing rhythm, or accessibility bar.

| Situation | Use |
|-----------|-----|
| Need the *design decisions* — palette, font pairing, style direction, UX rules | `ui-ux-pro-max` search. Magic has no opinion worth trusting here |
| Need a standard component — dialog, table, combobox, form field | **shadcn/ui first.** It is accessible, themeable, and already in the repo |
| Need an unusual composite — pricing comparator, onboarding stepper, marketing hero with an animated diagram | Magic, then rework |
| Stuck on layout ideas for a specific section | `get_inspiration`, then build it yourself |
| Need a brand logo as inline SVG | `search_logo` |
| Building anything behind auth that handles real data | Write it. Generated code plus a security boundary is a bad trade |

The order that works: **decide with `ui-ux-pro-max` → generate with Magic →
conform with this skill.** Generating first and retrofitting the design system
afterwards costs more than writing the component by hand.

## Conforming Generated Output

Treat Magic's output as a draft from a contractor who has never seen your
codebase. Every generated component gets this pass before it is committed:

**1. Tokens, not literals.** Generated code is full of `bg-[#4F46E5]`,
`text-[15px]`, `p-[18px]`. Replace every arbitrary value with a token from your
theme — `bg-primary`, `text-sm`, `p-4`. If a value has no token, that is a
design-system decision to make deliberately, not to inline. See
`references/shadcn-theming.md`.

**2. Use the primitives you already have.** Magic will happily hand-roll a
dropdown out of `div`s with `useState`. If shadcn/ui has that component, swap it
in — you get keyboard handling, focus management, and portal behaviour for free.
See `references/shadcn-components.md`.

**3. Accessibility.** Generated markup is the usual offender: `<div onClick>`
instead of `<button>`, icon buttons with no accessible name, no focus-visible
ring, placeholder used as a label. Run the checklist in
`references/shadcn-accessibility.md`. This is not optional polish — it is the
most common defect in generated UI.

**4. Dark mode.** Generated components are typically light-only. Check every
surface, border, and muted text colour in both themes, and check contrast, not
just that it "looks fine".

**5. Responsive.** Generated layouts are usually designed at one width. Verify
at 320 px and at 200% zoom. See `references/tailwind-responsive.md`.

**6. Strip the dependencies you did not ask for.** Magic sometimes pulls in an
animation or icon library for one flourish. Either adopt it deliberately or
remove it — a new dependency is a permanent cost for a one-off gradient.

**7. State coverage.** Generated components render the success state. Add
loading, empty, and error before shipping.

## Review Rule

A generated component is reviewed like any other code, at the same bar — the
diff does not get an easier pass because a model wrote it. In practice, check
that the referenced Tailwind classes and component APIs actually exist in your
installed versions: generated code frequently targets a different major version
of shadcn/ui or Tailwind and looks plausible while being wrong.
