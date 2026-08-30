import {
  Activity,
  Crosshair,
  Gauge,
  ListChecks,
  Stethoscope,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
        <span className="text-xs font-medium uppercase tracking-wide">
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

export function ExtractionResult({ result }: { result: InjuryExtraction }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Extracted result</CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="size-5 text-primary" aria-hidden="true" />
          {result.injuryName || "Unspecified injury"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field icon={Crosshair} label="Body area">
            <p className="text-sm font-medium text-foreground">
              {result.bodyArea || "Not specified"}
            </p>
          </Field>
          <Field icon={Gauge} label="Pain level">
            {typeof result.painLevel === "number" ? (
              <p className="text-sm font-medium text-foreground">
                {result.painLevel}
                <span className="text-muted-foreground"> / 10</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not mentioned</p>
            )}
          </Field>
        </div>

        <Separator />

        <Field icon={ListChecks} label="Symptoms">
          <BadgeList items={result.symptoms} empty="No symptoms detected." />
        </Field>

        <Field icon={Stethoscope} label="Possible causes">
          <BadgeList
            items={result.possibleCauses}
            empty="No causes detected."
          />
        </Field>

        <p className="text-xs text-muted-foreground text-pretty">
          This is an automated extraction for informational purposes only and is
          not a medical diagnosis.
        </p>
      </CardContent>
    </Card>
  );
}
