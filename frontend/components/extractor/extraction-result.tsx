import { Crosshair, Gauge, ListChecks, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InjuryExtraction } from "@/lib/injury-schema";

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function BadgeList({ items, empty }: { items: string[]; empty: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Badge key={`${item}-${i}`} variant="secondary" className="font-normal">
          {item}
        </Badge>
      ))}
    </div>
  );
}

// Rendered inside the "Extracted summary" panel in injury-extractor.tsx, so
// this owns no card/heading of its own -- the panel supplies both.
export function ExtractionResult({ result }: { result: InjuryExtraction }) {
  return (
    <div className="flex flex-col gap-5 px-[22px] pb-6">
      <p className="font-serif text-2xl leading-tight text-foreground">
        {result.injuryName || "Unspecified injury"}
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field icon={Crosshair} label="Body area">
          <p className="text-sm font-medium text-foreground">
            {result.bodyArea || "Not specified"}
          </p>
        </Field>

        <Field icon={Gauge} label="Pain level">
          {typeof result.painLevel === "number" ? (
            <p className="font-serif text-2xl leading-none text-foreground">
              {result.painLevel}
              <span className="text-sm text-muted-foreground"> / 10</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not mentioned</p>
          )}
        </Field>
      </div>

      <div className="h-px bg-border" />

      <Field icon={ListChecks} label="Symptoms">
        <BadgeList items={result.symptoms} empty="No symptoms detected." />
      </Field>

      <Field icon={Stethoscope} label="Possible causes">
        <BadgeList items={result.possibleCauses} empty="No causes detected." />
      </Field>

      <p className="text-xs text-muted-foreground-subtle text-pretty">
        This is an automated extraction for informational purposes only and is
        not a medical diagnosis.
      </p>
    </div>
  );
}
