/**
 * Design tokens ported from `frontend/UI_GUIDE.md`.
 *
 * The web app authors these as `oklch()` with a hex reference in a trailing
 * comment. React Native's colour parser does not understand `oklch()`, so on
 * this side the hex values are the real thing, not a reference. If a colour
 * changes in UI_GUIDE.md, it has to change here too.
 *
 * The rules that come with these tokens are not decoration — see UI_GUIDE.md:
 * severity is never carried by colour alone, `--border` and `--input` are
 * deliberately different values, and the pain ramp never reaches alarm red.
 */

export const Palette = {
  light: {
    background: '#E7EEEA',
    card: '#FCFDFC',
    muted: '#F1F6F3',
    foreground: '#16211E',
    mutedForeground: '#4A5B55',
    mutedForegroundSubtle: '#5F6F66',
    border: '#D6E1DA',
    input: '#808A84',
    primary: '#2F6B5B',
    accent: '#DBE9E2',
    accentForeground: '#245447',
    destructive: '#A5453F',
  },
  dark: {
    background: '#0F1614',
    card: '#18211E',
    muted: '#1F2A26',
    foreground: '#E6EEE9',
    mutedForeground: '#A2B2AB',
    mutedForegroundSubtle: '#82928B',
    border: '#2A352F',
    input: '#67746D',
    primary: '#6FB49B',
    accent: '#1D302A',
    accentForeground: '#8ECBB3',
    destructive: '#E08079',
  },
} as const;

/**
 * Five steps, 0-2 / 3-4 / 5-6 / 7-8 / 9-10. In light mode all five sit at
 * roughly equal lightness, so the ramp is a hue sweep at constant visual
 * weight — a high score must not also look heavier. Do not add a sixth,
 * hotter step.
 */
export const PainRamp = {
  light: ['#4E8E7D', '#688D5E', '#9D7F38', '#B1764B', '#BB6B67'],
  dark: ['#64A995', '#92B786', '#D2B46E', '#D69A6E', '#CE817C'],
} as const;

/** Maps a 0-10 painLevel onto a PainRamp index. Mirrors `frontend/lib/pain.ts`. */
export function painBucket(painLevel: number): 0 | 1 | 2 | 3 | 4 {
  if (painLevel <= 2) return 0;
  if (painLevel <= 4) return 1;
  if (painLevel <= 6) return 2;
  if (painLevel <= 8) return 3;
  return 4;
}

/**
 * Only for large numerals (>= 24px) and graphical marks. These clear 3:1, which
 * satisfies WCAG for large text and non-text contrast but NOT for body copy —
 * never colour small text with a pain token. Always render the number too.
 */
export function painColor(painLevel: number, scheme: 'light' | 'dark') {
  return PainRamp[scheme][painBucket(painLevel)];
}

/** page title / section heading / body / secondary / eyebrow */
export const FontSize = {
  title: 30,
  heading: 19,
  body: 16, // 15 on web; 16 is the mobile minimum for comfortable reading
  secondary: 13.5,
  eyebrow: 11,
} as const;

export const Radius = 12; // 0.75rem
