import { ArtIcon } from "@/components/ui/art-icon";
import { artSrc, type EntryIconKey } from "@/lib/entry-art";
import { cn } from "@/lib/utils";

/**
 * An entry's illustration inside the design's round holder.
 *
 * The illustrations carry no transparent margin of their own - measured, the
 * entry art is drawn edge to edge at 0% padding - so any gap between art and
 * disc is inset this component adds. It adds almost none: the art fills the
 * disc and the disc clips it to a circle, which is why the holder needs
 * `overflow-hidden`.
 *
 * `icon` comes from the API (backend/src/entryIcons.js), so two records that
 * say the same thing always draw the same picture. Anything unrecognised
 * arrives as "leaf".
 */
const INSET = 0.94;

export function EntryIcon({
  icon,
  size = 72,
  className,
}: {
  icon: EntryIconKey | null | undefined;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center overflow-hidden rounded-full bg-icon-disc",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <ArtIcon src={artSrc(icon)} size={Math.round(size * INSET)} />
    </span>
  );
}
