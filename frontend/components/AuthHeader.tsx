import { HeartPulse } from "lucide-react";

export default function AuthHeader() {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <HeartPulse className="size-6" />
      </div>

      <h1 className="mt-4 text-xl font-semibold">Injury Journal</h1>

      <p className="text-sm text-muted-foreground">Your injury record</p>
    </div>
  );
}
