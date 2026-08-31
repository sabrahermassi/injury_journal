"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logoutUser } from "@/services/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch (error) {
      console.error(error);
    } finally {
      router.push("/login");
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p>{user?.email ?? "Unknown — try signing in again"}</p>
          </div>

          <Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
