import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Injury } from "@/services/api";

type InjuryCardProps = {
  injury: Injury;
};

export function InjuryCard({ injury }: InjuryCardProps) {
  return (
    <Link href={`/dashboard/injuries/${injury.id}`}>
      <Card className="cursor-pointer transition hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{injury.name}</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Area: {injury.bodyArea}</p>
            <p>Side: {injury.side}</p>
            <p>Status: {injury.status}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
