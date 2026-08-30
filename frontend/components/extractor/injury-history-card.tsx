import {
  Activity,
  CalendarDays,
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
import type { InjuryHistoryEntry } from "@/lib/injury-schema";

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
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="pl-6">{children}</div>
    </div>
  );
}

function BadgeList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">None recorded.</p>;
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

export function InjuryHistoryCard({ injury }: { injury: InjuryHistoryEntry }) {
  const data = injury.extractedData;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Saved injury entry</CardDescription>

        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="size-5 text-primary" />
          {data.injury_name || "Unspecified injury"}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field icon={Crosshair} label="Body area">
            <p className="text-sm font-medium">
              {data.body_area || "Not specified"}
            </p>
          </Field>

          <Field icon={Gauge} label="Pain level">
            <p className="text-sm font-medium">
              {data.pain_level ?? "Not mentioned"}
              {typeof data.pain_level === "number" && (
                <span className="text-muted-foreground"> / 10</span>
              )}
            </p>
          </Field>
        </div>

        <Separator />

        <Field icon={ListChecks} label="Symptoms">
          <BadgeList items={data.symptoms} />
        </Field>

        <Field icon={Stethoscope} label="Possible causes">
          <BadgeList items={data.possible_causes} />
        </Field>

        <Field icon={CalendarDays} label="Created">
          <p className="text-sm">
            {new Date(injury.timestamp).toLocaleDateString()}
          </p>
        </Field>
      </CardContent>
    </Card>
  );
}
