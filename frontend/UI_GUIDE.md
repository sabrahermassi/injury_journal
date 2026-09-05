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

Tokens live in `app/globals.css`. Neutrals are pulled warm (linen/paper) rather
than grey, so chrome sits in the same hue family as the accent. Values are
authored as hex directly — the source design (Claude Design, "Injury Journal
Botanical") specifies hex only, no oklch, and this palette is matched to it.
`--destructive` is the one exception and stays in `oklch()`: the design has no
error colour, so it was left as-is rather than invented.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#FBF8F5` | `#1B1916` | page ground |
| `--card` / `--sidebar` | `#F6F3EE` | `#232019` | raised surfaces |
| `--popover` | `#FDFCFA` | `#232019` | menus, tooltips |
| `--muted` | `#F6F3EE` | `#2A2620` | inset fills |
| `--secondary` | `#EDF0E8` | `#2A2620` | callout/wash fills |
| `--foreground` | `#142922` | `#EEE9E0` | primary text |
| `--muted-foreground` | `#6E7269` | `#A79E8E` | secondary text, notes |
| `--muted-foreground-subtle` | `#8A8F86` | `#8C8474` | eyebrows, dates, axis ticks |
| `--border` | `#EFEAE2` | `#332F27` | decorative hairlines only |
| `--input` | `#9B9284` | `#6B6355` | form field boundaries |
| `--primary` / `--ring` | `#21382B` | `#84A796` | accent, focus |
| `--accent` | `#E7EEE7` | `#2E3B30` | accent fill (pills, active nav) |
| `--accent-foreground` | `#3B5C4A` | `#A7C4B0` | text on accent fill |
| `--destructive` | `#A5453F` | `#E08079` | errors, destructive actions |

`--border` and `--input` are deliberately **different values** — more so than
before. The source design's own field borders (`#EBE5DC` on `#FDFCFA`) don't
clear 3:1; `--input` is re-picked from the same palette family rather than
copied from the mockup. Card and section dividers stay exempt from WCAG
1.4.11; a form field's boundary is not, and must clear 3:1 against the surface
behind it. Do not collapse them.

### The pain scale

Five tokens, `--pain-1` … `--pain-5`, available as `text-pain-3`, `bg-pain-3`
and so on. Map with `painLevel` → bucket:

| Level | Token | Light | Dark |
|---|---|---|---|
| 0–2 | `--pain-1` | `#7A8F72` (sage) | `#96AC8C` |
| 3–4 | `--pain-2` | `#B7A15C` (wheat) | `#D4BC7E` |
| 5–6 | `--pain-3` | `#C0894F` (clay) | `#D9A874` |
| 7–8 | `--pain-4` | `#BD6F52` (terracotta) | `#D68F76` |
| 9–10 | `--pain-5` | `#9B5C6E` (dusty plum) | `#B67F8E` |

**Rules:**

- The ramp ends in a dusty plum. **It never reaches an alarm red.** Do not add
  a sixth, hotter step. This also matches the source design's own rule
  ("never red — sage → wheat → clay → dusty plum").
- In light mode all five sit at roughly equal lightness (L ≈ 0.55–0.60), so the
  ramp is a *hue* sweep at constant visual weight, not light-to-dark. This is
  deliberate — a high score should not also look heavier. **Note:** the source
  design's own pain ramp does *not* follow this rule (its swatches vary in
  lightness and rely on a fixed dark ink instead) — this project's ramp was
  re-hued into the same palette family rather than copied from it, specifically
  to keep that constant-lightness intent (contrast not independently
  verified — see Contrast below).
- **Use it only for large numerals (≥ 24px) and graphical marks** — chart dots,
  sparkline endpoints, timeline marks. Never colour small text with a pain
  token; use `--foreground` or `--muted-foreground`.
- Always render the number alongside the colour.

### Contrast

The previous (eucalyptus) palette's values here were checked pair-by-pair
against WCAG AA. This palette's values were chosen by eye, at the same
approximate lightness as the tokens they replaced, following the same rules
(constant-lightness pain ramp, a darker `--input` than `--border`) — but they
have **not** been independently re-verified against a contrast checker. Do
that before leaning on this table for anything accessibility-load-bearing,
particularly the pain ramp, which had the least headroom before.

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
