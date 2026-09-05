import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * One of the design's painted illustrations, rendered crisply.
 *
 * The source art is 313–345px square, so resolution was never the problem —
 * the problem was asking `next/image` for a 38px-wide variant. It duly
 * generated a 38px file, and a painted illustration resampled that far down,
 * then drawn on a 2x display, goes soft. Requesting the source at `DPR` times
 * the display size and letting the browser do the final downscale keeps the
 * detail, at a few KB more.
 *
 * Use this for every `art-*.png`; never drop a raw <Image> of one in at its
 * display size.
 */
const DPR = 3;

export function ArtIcon({
  src,
  size,
  className,
  priority,
}: {
  src: string;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={size * DPR}
      height={size * DPR}
      quality={95}
      priority={priority}
      className={cn("flex-none select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
