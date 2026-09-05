"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchCurrentUser } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route guard for everything under /dashboard (issue #10).
 *
 * The backend already rejects every unauthenticated request with a 401 -- no
 * data is reachable without a valid session. What was missing is at the
 * routing layer: without this, an unauthenticated visitor saw the full
 * dashboard shell (sidebar, header, empty/error states) render and only then
 * watched each fetch fail one by one, instead of a clean redirect to /login.
 *
 * Wraps the dashboard layout's children, above InjuriesProvider and
 * everything else, so nothing underneath fires a single fetch until the
 * server has confirmed there is a live session. Checks with the server
 * (fetchCurrentUser -> GET /api/auth/me) rather than the sessionStorage
 * cache: that cache is only a UI convenience and can read null for a user
 * who is still genuinely logged in (e.g. right after a hard refresh).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser().then((user) => {
      if (cancelled) return;

      if (user) {
        setAuthenticated(true);
      } else {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authenticated) {
    // Deliberately not the dashboard shell (sidebar/header) — rendering that
    // before the check resolves is exactly the flash this guard exists to
    // remove, whether the eventual outcome is "authenticated" or "redirect".
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="h-10 w-40 rounded-2xl" />
        <Skeleton className="h-4 w-64 rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
