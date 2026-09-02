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
 * `size` is the holder, so it has to exceed the size the design draws the art
 * at (54px in a timeline row) rather than match it — setting the holder to 54
 * left the illustration at 33px, noticeably smaller than designed. INSET is
 * the one number to turn if the art wants more or less room.
 *
 * `icon` comes from the API (backend/src/entryIcons.js), so two records that
 * say the same thing always draw the same picture. Anything unrecognised
 * arrives as "leaf".
 */
const INSET = 0.66;

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
        "flex flex-none items-center justify-center rounded-full bg-secondary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <ArtIcon src={artSrc(icon)} size={Math.round(size * INSET)} />
    </span>
  );
}
