# UI guide

The design-token and component reference for the Injury Journal frontend. Read
this before adding or changing UI. The root `CLAUDE.md` points here.

## The idea

Injury Journal is opened repeatedly over months, often on a bad day, and often
to hand to a clinician. The interface should read as a **journal**, not a
monitoring console. Two consequences drive everything below:

1. **Nothing shames the user for their own symptoms.** A 9/10 day is not a
   system fault and is never rendered as an alarm.
2. **Severity is never carried by colour alone.** The number is always present.

## Colour

Tokens live in `app/globals.css`. Neutrals are pulled green rather than left
grey, so chrome sits in the same hue family as the accent. Author values as
`oklch()`; the hex in the trailing comment is the reference.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#E7EEEA` | `#0F1614` | page ground |
| `--card` / `--popover` / `--sidebar` | `#FCFDFC` | `#18211E` | raised surfaces |
| `--muted` / `--secondary` | `#F1F6F3` | `#1F2A26` | inset fills |
| `--foreground` | `#16211E` | `#E6EEE9` | primary text |
| `--muted-foreground` | `#4A5B55` | `#A2B2AB` | secondary text, notes |
| `--muted-foreground-subtle` | `#5F6F66` | `#82928B` | eyebrows, dates, axis ticks |
| `--border` | `#D6E1DA` | `#2A352F` | decorative hairlines only |
| `--input` | `#808A84` | `#67746D` | form field boundaries |
| `--primary` / `--ring` | `#2F6B5B` | `#6FB49B` | accent, focus |
| `--accent` | `#DBE9E2` | `#1D302A` | accent fill (pills, active nav) |
| `--accent-foreground` | `#245447` | `#8ECBB3` | text on accent fill |
| `--destructive` | `#A5453F` | `#E08079` | errors, destructive actions |

`--border` and `--input` are deliberately **different values**. Card and section
dividers are decorative and exempt from WCAG 1.4.11; a form field's boundary is
not, and must clear 3:1 against the surface behind it. Do not collapse them.

### The pain scale

Five tokens, `--pain-1` … `--pain-5`, available as `text-pain-3`, `bg-pain-3`
and so on. Map with `painLevel` → bucket:

| Level | Token | Light | Dark |
|---|---|---|---|
| 0–2 | `--pain-1` | `#4E8E7D` | `#64A995` |
| 3–4 | `--pain-2` | `#688D5E` | `#92B786` |
| 5–6 | `--pain-3` | `#9D7F38` | `#D2B46E` |
| 7–8 | `--pain-4` | `#B1764B` | `#D69A6E` |
| 9–10 | `--pain-5` | `#BB6B67` | `#CE817C` |

**Rules:**

- The ramp ends in a muted coral. **It never reaches an alarm red.** Do not add
  a sixth, hotter step.
- In light mode all five sit at roughly equal lightness (L ≈ 0.60), so the ramp
  is a *hue* sweep at constant visual weight, not light-to-dark. This is
  deliberate — a high score should not also look heavier — and it is what lets
  every step clear 3:1 on a near-white surface.
- **Use it only for large numerals (≥ 24px) and graphical marks** — chart dots,
  sparkline endpoints, timeline marks. At 3:1 these tokens satisfy WCAG for
  large text and non-text contrast, but **not** for body copy. Never colour
  small text with a pain token; use `--foreground` or `--muted-foreground`.
- Always render the number alongside the colour.

### Contrast

Every text pair in the table above is checked to WCAG AA (4.5:1 for body,
3:1 for large text and UI boundaries) against `--card`, `--muted` and
`--background` in both themes. If you change a colour, re-check it — the
palette has very little headroom, particularly the light pain ramp, which sits
within 0.05–0.25 of its minimum.

## Type

Two families, loaded via `next/font/google` in `app/layout.tsx`.

- **Newsreader** (serif) — `--font-heading` / `font-serif`. Headings, and every
  number that describes the body (pain scores, day counts, costs). A serif
  numeral reads as something written down rather than measured. Applied to
  `h1, h2, h3` in the base layer, and consumed by `CardTitle` / `DialogTitle`
  through `--font-heading`.
- **Figtree** — `--font-sans`. All interface text: labels, body, buttons, form
  fields.

There is no mono face; nothing in the app needs one.

Scale: page title 30–32px · section heading 19px · body 15px · secondary 13.5px
· eyebrow label 11px with `.13em` letter-spacing, uppercase.

Add `.tabular` (defined in the base layer) wherever digits line up in columns.

## Layout

- `--radius` is `0.75rem`; the `--radius-*` scale derives from it. Don't
  hard-code radii.
- Space sibling groups with flex/grid `gap`, not per-element margins.
- Wide content — charts, tables — gets its own `overflow-x: auto` container so
  the page body never scrolls sideways.
- Content is full-width within the dashboard shell. The old `max-w-2xl` column
  is gone; don't reintroduce it.

## Components

`components/ui/` is the shadcn primitive layer (style: `radix-nova`) — compact
and ring-based rather than shadow-based. `Card` uses `ring-1 ring-foreground/10`,
not a border. Match that; do not hand-roll a `rounded-xl border bg-card p-5`
panel alongside a real `Card`, which is what the pre-redesign detail page did.

Every list needs three real states — loading (use `ui/skeleton.tsx`), empty
(say what to do next), and error (say what failed and offer a retry). A bare
grey sentence is not one of them.
