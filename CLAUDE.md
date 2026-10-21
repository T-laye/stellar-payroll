# PayOrbit

Cross-border payroll on Stellar. This sprint (Instaward round 2) turns the prototype into an enhanced MVP: add employees →
create payroll → review → approve/schedule → bulk Stellar payouts → monitor → employees see their payments.
PRD: https://docs.google.com/document/d/177jQW9jrV-ykp3ORLX9G3gdJIfU7WeWsf-FwYefLQYk.
**Scope, status and the backend contract: `docs/PLAN.md`.** Structure mirrors `../useStellance/stellance`; when in doubt
about a convention, check how Stellance did it.

## Monorepo

Turborepo + pnpm 12 (`packageManager`), Node ≥ 22.

```
apps/landing/      (:3002) public marketing site
apps/web/          (:3000) the app: auth /auth, admin (/overview, /employees, /payroll, /recurring, /transactions,
                   /notifications, /wallets, /requests, /roles, /settings), employee portal (/overview, /payments, /profile)
packages/ui/       @repo/ui — design tokens, shadcn components, motion, fonts
packages/mock-api/ @repo/mock-api — the in-browser demo backend (axios adapter, seed data, payout engine)
packages/eslint-config, packages/typescript-config
```

`pnpm dev` (all) · `pnpm build` · `pnpm check-types` · `pnpm lint` (UI and mock packages: `--max-warnings 0`) · `pnpm format`
(prettier: tabs, width 130).

## Deployment (Vercel Services)

One Vercel project, two services, routed by path in root `vercel.json`: `/app/*` → `web`, everything else → `landing`.
On Vercel (`VERCEL_ENV` set) `apps/web/next.config.ts` sets basePath `/app` (`NEXT_PUBLIC_BASE_PATH`); in dev each app has
its own port and no basePath. Once PayOrbit has a domain, switch to host routing like Stellance (`app.<domain>` → `web`,
basePath only on previews) and set `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_LANDING_URL`.
`site.ts` reads `NEXT_PUBLIC_VERCEL_ENV` (inlined by `next.config.ts` `env`), never `VERCEL_ENV`, so client and server
renders agree.

- `<Link>`, `router`, static imports and `/_next` get the basePath automatically; hand-built URLs and plain
  `next/image` `src` strings don't (`withBasePath` in `apps/web/src/lib/site.ts`).
- Links between apps are plain `<a>` (or `location.assign`): landing → `APP_LINKS`, web → `LANDING_URL`.
- The app used to live at the site root with the dashboard under `/dashboard`. Landing redirects `/auth/*` and
  `/dashboard/*` into the app, and the app redirects `/dashboard/*` to the new routes, so emailed links keep working.
- Each host serves its own `robots.txt`: landing allows all; web disallows everything and is `noindex`.

## Stack

Next.js 16 (App Router, React Compiler, Turbopack), React 19, Tailwind v4, shadcn/ui (Radix) in `@repo/ui`, TanStack
Query, zustand 5, react-hook-form + zod 4, axios, lucide, sonner toasts, recharts 2, `@vercel/analytics`.

## Data

- **Source switch** (`apps/web/src/lib/api/source.ts`): `NEXT_PUBLIC_API_SOURCE=mock` (the default for now) answers
  every request in the browser from `@repo/mock-api` (installed as an axios `adapter`, loaded only in mock mode); `live`
  calls the API. Same URLs, envelopes and error shapes either way, so hooks never know. Demo accounts (password
  `Password1`): `demo@payorbit.com` (owner), `hr@payorbit.com` (HR manager: can't approve/execute),
  `employee@payorbit.com` (Amara, self-service only; wallet PIN `1234`). The mock DB is one JSON document in localStorage
  (`payorbit-mock-db`); "Reset demo data" on the sign-in page restores the seed. Seed dates are relative to the first run.
- Mock payouts (`packages/mock-api/src/engine.ts`) run on a short clock: executing a run sends each payment PENDING →
  SUBMITTED (~2.5 s) → CONFIRMED (~4 s), or FAILED with a reason (no wallet, no trustline, underfunded). APPROVED runs
  start by themselves at `scheduled_at`, like the live scheduler. Retrying re-checks the cause, so linking a missing
  wallet then retrying succeeds. Mock tokens are unsigned JWTs whose payload carries `permissions`, as the app expects.
- Endpoints and fields the live API doesn't have yet are served by the mock where the plan proposes them, marked as
  proposals in comments: `GET /users/me/transactions`, filters + pagination on `GET /transactions` (`status` list, `from`,
  `to`, `q`, `page`, `page_size`), `/payroll/schedules/*` (recurring payroll: drafts a run 3 days before each pay date,
  never approves it), `/notifications` (+ `read`, `read-all`), run `name` / `employee_count` / `payments`, transaction
  `failure_code` / `attempts` / `employee_name`, employee `pay_frequency` / `invite_status`, `employees_paid_*` stats,
  approve/execute refusing runs with missing wallets (409), `PATCH /auth/change-verification-email`.
- Headless check of the mock: drive `dispatch()` from `router.ts` with a fake `Date.now` (jiti can
  import the TS directly). Invite tokens follow `inviteToken()` in `seed.ts` ("invite-" + 8 chars of the employee id).
- Backend: `https://payorbit-production.up.railway.app/api/v1` (Go, separate repo). Swagger UI at `/docs`, spec at
  `/docs/doc.json`. Success `{ statusCode, message, data, meta? }`; errors `{ statusCode, message, error }` where `error`
  is a string or `{ message }` (422 validation).
- The browser calls `/api/v1/*` on its own origin, rewritten in `apps/web/next.config.ts` to the backend
  (`API_PROXY_TARGET`). `NEXT_PUBLIC_API_URL` (or the old `NEXT_PUBLIC_API_BASE_URL`) forces direct calls.
- Auth is a dual-token session: `Authorization: Bearer <access_token>` (JWT, 7 days) and `X-Pay-Token: <pay_token>`
  (Redis session, the revocation handle). Both go on every protected request. Session: `features/auth/store.ts`
  (zustand, persisted to sessionStorage under `payorbit_auth`, see `features/auth/session.ts`). `ProtectedRoute` gates
  `(dashboard)`. Permissions come from the session (`hasAnyPermission(user, [...])`); pages check them before rendering.
- `lib/api/client.ts`: `axiosInstance` (public) and `axiosAuth` (signed-in; `lib/api/use-axios-auth.ts` adds both
  headers). Feature `api.ts` functions use `api.get/post/patch/delete` from `lib/api/request.ts`: both headers, the
  envelope unwrapped, failures as `ApiError` with the API's message (`errorMessage(error)` for toasts).
- Admin vs employee: `isPayrollAdmin(user)` (`payroll:read` or `employees:read`) picks the shell's nav and what
  `/overview` shows. Admin pages wrap their content in `<RequirePermission any={[...]}>` (hooks live in the child).
- Most data is company-scoped: `/companies/{company_id}/…` with the id from the session. Payroll runs and transactions
  are scoped by the JWT instead (`/payroll/runs`, `/transactions`).
- Amounts are numeric strings. The API docs say salaries are in base units (7 decimals); confirm against live data before
  formatting (docs/PLAN.md, open questions).
- Wallets can be custodial (the API creates them and signs); transfers need the wallet PIN. Never log, persist or render a
  private key outside the explicit export flow.
- Mutations never auto-retry (`retry: false`): a retried execution or transfer could go out twice.

## Domain rules

- Run lifecycle (API): `DRAFT → APPROVED → PROCESSING → COMPLETED | FAILED`, `FAILED → RETRYING → …`. Only DRAFT runs can be
  edited or cancelled. An APPROVED run is picked up by the backend scheduler at `scheduled_at` and paid automatically.
- Payment (transaction) lifecycle: `PENDING → SUBMITTED → CONFIRMED | FAILED`; shown to people as
  Pending → Processing → Completed / Failed. Never show Completed until the API says `CONFIRMED`.
- A payment is verifiable once it has `stellar_tx_hash`: link it to Stellar Expert (Testnet).
- Keep blockchain detail secondary in copy ("Payment completed", with the hash and explorer link available).
- Every status label, tone and description comes from `apps/web/src/lib/status.ts` (run phases incl. Scheduled and
  Cancelled, payment phases, employee Active/Pending/Inactive, schedule states); render them with `components/status-pill.tsx`.
  Failure reasons and retry rules: `lib/stellar.ts` (`failureInfo`, `canRetry`, explorer links, fee estimate).
- Recurring schedules prepare payroll; they never pay it. Copy must not imply money moves without an approval.

## Design system (`packages/ui`)

Tokens in `src/styles/globals.css`, from getpayorbit.com: brand purple `#5501FF` (`--primary`), cyan `#00FFBB`,
magenta `#FF00A6`, ink `#1F1F1F`, and the deep night `#0D0020` (dark sidebar, sign-in panel: `bg-brand-night`). Semantic
shadcn tokens plus `success` / `warning` / `info` for payment states; `bg-brand-gradient`, `text-brand-gradient`
utilities. Use the Tailwind names (`bg-primary`, `text-success`) instead of hex. Font: Inter (each app's root layout sets
`--font-inter` via `next/font`), Satoshi (`@font-face`, `src/assets/fonts`) as the fallback. Logos (colour, white, mark)
live in each app's `public/images`. Link previews: `opengraph-image.tsx` / `twitter-image.tsx` in each app render `OgCard`
(`@repo/ui/og-card`) through `next/og` at build time, with the static Satoshi files in `assets/fonts/static`
(the renderer can't read variable fonts). Client pages get their tab title from a small server `layout.tsx`.

App building blocks in `apps/web/src/components`: `PageHeader`, `SectionCard` / `DetailList`, `StatCard`, `StatusPill`
family, `EmptyState` / `ErrorState` / `TableSkeleton` (states.tsx), `Money` / `AssetBadge`, `HashValue` / `CopyButton`,
`FilterTabs`, `PersonCell` / `Avatar`, `Stepper`, `ConfirmDialog`, `PaymentTimeline`, `BarChart`, `FormField`.

Import as `@repo/ui/<file>` (`@repo/ui/button`, `@repo/ui/sonner`, `@repo/ui/fade-up`, `@repo/ui/lib/utils`,
`@repo/ui/hooks/use-mobile`). New shadcn components go in `packages/ui/src` (`components.json` there). Toasts:
`toast` from `@repo/ui/sonner` (the `<Toaster />` sits in the web root layout).

## Motion

CSS only, in `packages/ui` globals, all off for reduced motion: `.animate-rise` (stagger with `style={{ "--i": n }}`),
`.animate-page` (every dashboard navigation, `(dashboard)/template.tsx`), `.animate-pop`, `.animate-signal` (statuses
waiting on the network), `.animate-scan`, `.animate-check`. `FadeUp` (`@repo/ui/fade-up`) reveals landing sections on
scroll.

## Conventions

- Feature folders: `src/features/<domain>/{api.ts, types.ts, hooks.ts, store.ts, schema.ts, components/}`. `api.ts` holds
  endpoints and fetchers, `hooks.ts` the TanStack Query hooks, `store.ts` the zustand mirror. `src/app/**` pages stay
  thin; layout pieces live in `src/components/layouts`, providers in `src/components/providers`.
- Imports use `@/…` inside an app and `@repo/ui/…` for shared UI, never long `../../..` chains.
- Named exports for new components; route files keep default exports.
- App-only images live in that app's `public/images`; shared assets in `packages/ui/src/assets`.
- Every `<form>` using `form.handleSubmit` needs `noValidate`.
- Never call hooks after an early return (permission checks render an inner component instead), never `setState`
  synchronously in `useEffect`, and never read `ref.current` during render.
- A component using `useSearchParams` needs a `<Suspense>` boundary above it.
- Flex children that hold tables or long text need `min-w-0` or they push the page wide.

## Landmines

1. pnpm strict linking: a package imported in a file must be a dependency of _that_ workspace package. `next/*` imports
   stay in the apps, never in `@repo/ui`.
2. Restart the dev server after `pnpm install`.
3. New dependency with build scripts → list it under `allowBuilds` in `pnpm-workspace.yaml`.
4. Never run `next build` into `.next` while `pnpm dev` runs. Use `NEXT_DIST_DIR=.next-verify npx next build`.
5. Next 16 error boundaries get `retry()` (not `reset()`). Route params are Promises (`PageProps<"/route/[id]">`).
6. Keep all `@radix-ui/*` packages on the same release.
7. `recharts` stays on 2.x (shadcn `chart.tsx`).
8. `packages/ui` type-checks with `noUncheckedIndexedAccess`; the apps don't.
9. The API answers unknown routes with `500 internal_error`, not 404: a 500 on a new call usually means a wrong path.
