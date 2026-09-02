import { ArtIcon } from "@/components/ui/art-icon";
import { artSrc, type EntryIconKey } from "@/lib/entry-art";
import { cn } from "@/lib/utils";

/**
 * An entry's illustration inside the design's round holder.
 *
 * The holder is deliberately larger than the art it contains — the
 * illustrations are drawn edge to edge, and without the inset they crowd the
 * circle and read as clipped. The design uses the same proportion on the home
 * screen's encouragement card: a 66px circle around a 40px image.
 *
 * `icon` comes from the API (backend/src/entryIcons.js), so two records that
 * say the same thing always draw the same picture. Anything unrecognised
 * arrives as "leaf".
 */
export function EntryIcon({
  icon,
  size = 54,
  className,
}: {
  icon: EntryIconKey | null | undefined;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-full bg-secondary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <ArtIcon src={artSrc(icon)} size={Math.round(size * 0.62)} />
    </span>
  );
}
