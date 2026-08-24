import type { DetailedHTMLProps, HTMLAttributes, Ref } from "react";

// React 19 moved the JSX namespace to React.JSX — augmenting the bare
// global `JSX` namespace (the pattern used by older React versions) is
// silently ignored here, so this module augments "react" instead.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "corti-dictation": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { ref?: Ref<HTMLElement> };
    }
  }
}

export {};
