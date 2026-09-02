import Image from "next/image";

import { artFor, artSrc } from "@/lib/entry-art";
import { cn } from "@/lib/utils";

/**
 * One of the design's illustrated entry icons, chosen from the entry's own
 * words. Decorative — every row it sits on already names itself in text — so
 * it is hidden from assistive tech rather than given an invented alt.
 */
export function EntryIcon({
  from,
  size = 54,
  className,
}: {
  from: (string | null | undefined)[];
  size?: number;
  className?: string;
}) {
  const art = artFor(...from);

  return (
    <Image
      src={artSrc(art)}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("flex-none select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
