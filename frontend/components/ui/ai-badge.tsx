import { cn } from "@/lib/utils";

/**
 * The reference design's `aiBadge`, verbatim: a pill on the secondary surface
 * with a hairline ring, a 13px sparkle, and "AI powered" in 10px semibold
 * uppercase tracked at .08em.
 *
 * It appears beside every AI-backed heading in the design (the extractor, the
 * assistant, the new-entry modal's clinical-note card), which is why it is a
 * component rather than three near-copies.
 */
export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 rounded-full bg-secondary py-[5px] pr-2.5 pl-2 ring-1 ring-[#DDE3D9] dark:ring-border",
        className,
      )}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="text-accent-foreground"
      >
        <path d="M12 3.4l1.5 4.1 4.1 1.5-4.1 1.5L12 14.6l-1.5-4.1L6.4 9l4.1-1.5zM17.6 14.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
      </svg>

      <span className="text-[10px] font-semibold tracking-[0.08em] text-accent-foreground uppercase">
        AI powered
      </span>
    </span>
  );
}
