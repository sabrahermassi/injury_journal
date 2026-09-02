"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { logoutUser } from "@/services/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// Groups of label/value rows, "Injury Journal Botanical" reference design's
// settings-screen pattern: an identity header, then rounded cards of rows
// with a divider between each. Only rows backed by something the app
// actually does — there's no name field, no reminders, no export, no
// password change yet, so this isn't a reskin of imagined settings.
export default function SettingsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "?";

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error(error);
      setLogoutError(true);
      setLoggingOut(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback className="bg-accent font-medium text-accent-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-serif text-2xl text-foreground">Account</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {user?.email ?? "Unknown — try signing in again"}
          </p>
        </div>
      </div>

      <Card className="max-w-md overflow-hidden py-0">
        <CardContent className="divide-y divide-border px-0">
          <div className="flex min-h-[50px] items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {user?.email ?? "Unknown — try signing in again"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-[50px] w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/40 disabled:opacity-60"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {loggingOut ? "Signing out..." : "Sign out"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                End your session on this device
              </p>
            </div>
            <ChevronRight className="size-4 flex-none text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {logoutError && (
        <p className="text-sm text-destructive">
          Couldn&apos;t sign out — try again.
        </p>
      )}
    </main>
  );
}
