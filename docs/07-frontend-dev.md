# Frontend Development

> Rewritten. Every claim in the previous version of this file was false: it
> specified React Router, Axios, the Context API, and a JWT held in
> `localStorage`. None of those are used, and the last one is the opposite of the
> app's actual security model.

## Technology Stack

| Area             | Decision                                        |
| ---------------- | ----------------------------------------------- |
| Framework        | Next.js 16, App Router                          |
| UI library       | React 19                                        |
| Styling          | Tailwind CSS v4                                 |
| Components       | `radix-ui` / shadcn primitives, `lucide-react`  |
| Routing          | File-based, via the App Router                  |
| API client       | Native `fetch`, wrapped in `services/api.ts`    |
| State management | React state and hooks; no global store          |
| Testing          | Vitest (extractor components only, so far)      |

## Structure

```text
frontend/
├── app/               App Router pages: /, /login, /register,
│                      /dashboard, /dashboard/injuries/[id],
│                      /dashboard/assistant, /dashboard/extractor
├── components/
│   ├── ui/            shadcn primitive layer
│   ├── dashboard/     feature-specific components
│   ├── assistant/     AI assistant UI (ask-form.tsx)
│   └── extractor/     AI extractor UI
├── services/          all backend calls (api.ts, extractor-api.ts)
├── hooks/
└── lib/
```

Pages are `"use client"` components. There is no `src/`, no `pages/`, and no
`context/` directory.

## Authentication

**The JWT is never accessible to browser JavaScript.** The backend sets it in an
httpOnly cookie at login; the frontend never reads, stores, or attaches it. Every
request simply sends `credentials: "include"` and the browser attaches the cookie.

This is deliberate — see issue #8. Do not introduce token storage in
`localStorage`, `sessionStorage`, or a JS-readable cookie.

### CSRF

Mutating requests carry a double-submit CSRF token. In production the frontend and
backend sit on different domains (Vercel and Render), so the CSRF cookie the backend
sets is not readable via `document.cookie` on the frontend's origin. The login
response therefore also returns `csrfToken` in its JSON body, and the frontend keeps
that value in `sessionStorage` (see `frontend/services/api.ts` and issue #25).

Note the distinction: the *CSRF* token is JS-readable by design — it is not a
credential on its own. The *auth* JWT is not, and must stay that way.

### Flow

```text
User submits login
   ↓
Backend sets httpOnly JWT cookie, returns csrfToken in the body
   ↓
Frontend stores only the csrfToken (sessionStorage)
   ↓
Requests send credentials: "include"; mutations add the CSRF header
   ↓
Protected pages become accessible
```

## Conventions

Read `frontend/UI_GUIDE.md` before adding or changing UI — it covers design tokens,
typography, spacing, and component patterns.

## Verification

```bash
cd frontend
npm run lint
npm run build     # catches type errors ESLint won't
```
