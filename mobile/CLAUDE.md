# CLAUDE.md — mobile/

@AGENTS.md

The Expo / React Native client for the Injury Journal API. Read the root `CLAUDE.md`
first; §12 there covers the rules that span this folder and `frontend/`.

## Setup

```bash
cd mobile
npm install
cp .env.example .env.local     # then set EXPO_PUBLIC_API_URL to this machine's LAN IP
npx expo start
```

`EXPO_PUBLIC_API_URL` must be a LAN address, never `localhost` — the bundle runs on the
phone, where `localhost` is the phone. The same address must also appear in the repo-root
`.env`'s comma-separated `FRONTEND_URL`, or the API rejects the origin. Open it with
Expo Go on the same Wi-Fi; `npx expo start --tunnel` if the network blocks it (public
Wi-Fi profile, AP isolation, firewall).

`--tunnel` only tunnels Metro (the JS bundle) — it does not proxy the app's own API
requests. `EXPO_PUBLIC_API_URL` still has to be an address the phone can reach, so on
tunnel mode that means running a separate tunnel (e.g. `ngrok http 3001`) for the
backend and pointing `EXPO_PUBLIC_API_URL` at that URL, added to `FRONTEND_URL` as
above. `FRONTEND_URL` is still the web-origin allowlist — never set it to the backend's
own URL.

There is no iOS Simulator on Windows and never will be — that needs Xcode. It does not
block iOS: Expo Go covers development, and EAS Build compiles on hosted Apple hardware.

## Verification

```bash
npx tsc --noEmit
npx expo lint
```

Neither exercises Metro's resolver, so **a green typecheck does not mean the app runs.**
Confirm the bundle actually builds:

```bash
curl "http://<LAN-IP>:8081/.expo/.virtual-metro-entry.bundle?platform=android&dev=true"
```

200 means every module resolved. (`/index.bundle` is the wrong entry for expo-router and
always 404s — that is not a real failure.)

## Conventions

- Routes are files under `src/app/`, `@/*` maps to `src/*`, `@/assets/*` to `assets/*`.
- `src/api/client.ts` is the only place that talks to the network. It is the hand-kept
  twin of `frontend/services/api.ts` — see root `CLAUDE.md` §12 before changing either.
- Auth state comes from `useAuth()`; the redirect between the signed-in and signed-out
  halves lives in the route guard in `src/app/_layout.tsx`, not in individual screens.
- Colours come from `useInjuryTheme()`, never a literal hex in a screen. The values in
  `src/constants/injury-theme.ts` are ported from `frontend/UI_GUIDE.md`, whose rules
  still apply: severity is never carried by colour alone (always render the number),
  pain tones are for large numerals only and never for body text, and the ramp never
  reaches alarm red. React Native cannot parse `oklch()`, so UI_GUIDE's hex column is
  the source of truth here rather than a reference comment — if a colour changes there,
  change it here too.
- Lists render one of three real states — loading, error, empty — via `ListState`.
  A blank screen that could mean any of the three is a bug.
- Tap targets are at least 48pt.

## Status

Phase 1: read-only. Login/register, session persistence, Today, Injuries, and injury
detail (symptoms / treatments / visits / timeline). Creating and editing records, the
centre "Log" action, Insights, and the AI Assistant screen are Phase 2 and 3.
