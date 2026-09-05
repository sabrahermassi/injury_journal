import { useColorScheme } from 'react-native';

import { Palette, PainRamp, painBucket } from '@/constants/injury-theme';

/**
 * The active half of the UI_GUIDE palette. Phones get used at 2am, so dark
 * mode is not a nice-to-have here the way it is on desktop -- every screen
 * reads its colours through this hook rather than hard-coding a hex.
 */
export function useInjuryTheme() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return {
    scheme,
    colors: Palette[scheme],
    /**
     * Large numerals (>= 24px) and graphical marks only. These clear 3:1,
     * which satisfies WCAG for large text and non-text contrast but NOT for
     * body copy -- and severity must never be carried by colour alone, so
     * always render the number next to it.
     */
    painColor: (painLevel: number) => PainRamp[scheme][painBucket(painLevel)],
  };
}
