import { useSyncExternalStore } from "react";

import { getCurrentUser, type CurrentUser } from "@/services/api";

// sessionStorage isn't visible during SSR, so this follows the same
// subscribe/getSnapshot/getServerSnapshot shape as hooks/use-mobile.ts: the
// server snapshot is always null, and the real value shows up once the
// client's snapshot is read post-hydration, with no mismatch warning either
// way. The value doesn't change during a render lifecycle (login/logout both
// navigate away), so subscribe is a no-op.
//
// getCurrentUser() re-parses JSON on every call, which would hand
// useSyncExternalStore a new object identity each render and loop forever —
// so the snapshot is cached and only re-parsed if the raw stored string
// actually changed.
let cachedRaw: string | null = null;
let cachedUser: CurrentUser | null = null;

function getSnapshot(): CurrentUser | null {
  const raw =
    typeof sessionStorage === "undefined"
      ? null
      : sessionStorage.getItem("currentUser");

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedUser = getCurrentUser();
  }

  return cachedUser;
}

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return null;
}

export function useCurrentUser(): CurrentUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
