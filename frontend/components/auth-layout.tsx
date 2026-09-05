import { ArtIcon } from "@/components/ui/art-icon";

/**
 * The "Web · sign in" frame from the botanical design: a fixed 640px panel of
 * brand and promise on the left, the form centred in what's left on the right.
 *
 * The design's left panel also carries a mini pain chart. That chart is drawn
 * from someone's real entries, and nobody is signed in on this page — there is
 * no data to put in it and inventing a shape would be a fake screenshot. The
 * sprig and the headline carry the panel instead.
 *
 * Below `lg` the panel is dropped entirely rather than stacked: it is
 * decoration plus a headline, and on a phone it would just push the form
 * below the fold.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen">
      <aside className="relative hidden w-[640px] flex-none flex-col overflow-hidden bg-secondary p-14 lg:flex">
        <ArtIcon
          src="/sprig-ref.png"
          size={422}
          priority
          className="pointer-events-none absolute -top-10 right-0"
        />

        <div className="relative flex items-center gap-3">
          <ArtIcon src="/art-leaf-sm.png" size={32} />
          <span className="font-serif text-[19px] font-medium text-foreground">
            Injury Journal
          </span>
        </div>

        <div className="relative mt-auto max-w-[440px]">
          <p className="font-serif text-[48px] leading-[1.06] font-light tracking-tight text-foreground">
            Your injury, finally written down.
          </p>
          <p className="mt-4.5 text-base leading-relaxed text-foreground/80">
            One entry a day builds the record you wish you&apos;d had at your
            last appointment.
          </p>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:p-14">
        <div className="w-full max-w-[404px]">
          {/* The brand only appears here when the left panel is gone. */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <ArtIcon src="/art-leaf-sm.png" size={30} />
            <span className="font-serif text-lg font-medium text-foreground">
              Injury Journal
            </span>
          </div>

          <h1 className="font-serif text-[34px] leading-[1.06] font-light tracking-tight text-foreground md:text-[40px]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-7">{children}</div>
        </div>
      </div>
    </main>
  );
}
