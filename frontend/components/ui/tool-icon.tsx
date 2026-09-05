import { MessageCircleQuestion, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The AI tools' icons, on a sage disc.
 *
 * These are the same lucide glyphs the sidebar uses for "AI Extractor" and
 * "AI Assistant", so the icon on a tool's page is identical to the icon in the
 * nav that opened it. They replace `art-sparkle.png` in those places: the
 * painted sparkle is a 316px raster and no amount of resampling makes it as
 * sharp at 20px as a vector already is.
 *
 * The painted art still carries the decorative spots - the sprig, the leaves,
 * the entry illustrations - where size makes raster detail an asset rather
 * than a liability.
 */
const GLYPHS = {
  extractor: Sparkles,
  assistant: MessageCircleQuestion,
} as const;

export function ToolIcon({
  tool,
  size = 44,
  className,
}: {
  tool: keyof typeof GLYPHS;
  size?: number;
  className?: string;
}) {
  const Glyph = GLYPHS[tool];

  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-full bg-icon-disc text-accent-foreground",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Glyph
        aria-hidden="true"
        strokeWidth={1.8}
        style={{ width: Math.round(size * 0.5), height: Math.round(size * 0.5) }}
      />
    </span>
  );
}
