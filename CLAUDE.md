# PayOrbit

Cross-border payroll on Stellar. This sprint (Instaward round 2) turns the prototype into an enhanced MVP: add employees →
create payroll → review → approve/schedule → bulk Stellar payouts → monitor → employees see their payments.
PRD: https://docs.google.com/document/d/177jQW9jrV-ykp3ORLX9G3gdJIfU7WeWsf-FwYefLQYk.
**Scope and status: `docs/PLAN.md`. The backend contract: `frontend-integration.md` (the backend team's guide; it wins
over the Swagger wherever they differ).** Structure mirrors `../useStellance/stellance`; when in doubt
about a convention, check how Stellance did it.

## Monorepo

Turborepo + pnpm 12 (`packageManager`), Node ≥ 22.

```
apps/landing/      (:3002) public marketing site
apps/web/          (:3000) the app: auth /auth, admin (/overview, /employees, /payroll, /recurring, /transactions,
                   /notifications, /wallets, /requests, /roles, /settings), employee portal (/overview, /payments, /profile)
apps/admin/        (:3001) platform console for PayOrbit staff (/admin/* endpoints): overview, /companies, /users,
                   /transactions, /audit-logs, /admins. Sign-in refuses anyone without `is_platform_admin`
packages/ui/       @repo/ui — design tokens, shadcn components, motion, fonts
packages/mock-api/ @repo/mock-api — the in-browser demo backend (axios adapter, seed data, payout engine)
packages/eslint-config, packages/typescript-config
```

`pnpm dev` (all) · `pnpm build` · `pnpm check-types` · `pnpm lint` (UI and mock packages: `--max-warnings 0`) · `pnpm format`
(prettier: tabs, width 130).

## Deployment (Vercel Services)

One Vercel project, three services, routed by path in root `vercel.json`: `/app/*` → `web`, `/admin/*` → `admin`,
everything else → `landing`. On Vercel (`VERCEL_ENV` set) `apps/web/next.config.ts` sets basePath `/app` and
`apps/admin/next.config.ts` sets `/admin` (`NEXT_PUBLIC_BASE_PATH`); in dev each app has its own port and no basePath. Once PayOrbit has a domain, switch to host routing like Stellance (`app.<domain>` → `web`,
basePath only on previews) and set `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_LANDING_URL`.
`site.ts` reads `NEXT_PUBLIC_VERCEL_ENV` (inlined by `next.config.ts` `env`), never `VERCEL_ENV`, so client and server
renders agree.

- `<Link>`, `router`, static imports and `/_next` get the basePath automatically; hand-built URLs and plain
  `next/image` `src` strings don't (`withBasePath` in `apps/web/src/lib/site.ts`).
- Links between apps are plain `<a>` (or `location.assign`): landing → `APP_LINKS`, web → `LANDING_URL`.
- The app used to live at the site root with the dashboard under `/dashboard`. Landing redirects `/auth/*` and
  `/dashboard/*` into the app, and the app redirects `/dashboard/*` to the new routes, so emailed links keep working.
- Each host serves its own `robots.txt`: landing allows all; web and admin disallow everything and are `noindex`.

### Platform console (`apps/admin`)

- Same data switch and request helpers as web (copied, not shared), its own session (`features/auth/session.ts`,
  sessionStorage `payorbit-admin-session`). Demo staff account: `admin@payorbit.com` / `Password1` (Ola Adeyemi, the
  "PayOrbit" company); the mock also seeds a suspended company (`owner@northwind.example`, can't sign in). Live:
  `tlayefaah@gmail.com` is a platform admin. The mock DB lives per origin, so :3000 and :3001 have separate demo data.
- `/admin/*` shapes are in `features/admin/types.ts`. Live caps admin pages at 100, the `role` filter takes slugs
  (`owner`, `hr-manager`), and `GET /admin/transactions` currently answers 500 (detail works); the UI says so plainly.
- Writes ask first (`ConfirmDialog`): suspend/reactivate a company, deactivate/reactivate a user, grant/revoke platform
  admin. The API refuses suspending your own company, deactivating yourself and removing the last admin; the UI
  disables those too. Don't run writes against production accounts while testing.

## Stack

Next.js 16 (App Router, React Compiler, Turbopack), React 19, Tailwind v4, shadcn/ui (Radix) in `@repo/ui`, TanStack
Query, zustand 5, react-hook-form + zod 4, axios, lucide, sonner toasts, recharts 2, `@vercel/analytics`.

## Data

- **Source switch** (`apps/web/src/lib/api/source.ts`): `NEXT_PUBLIC_API_SOURCE=mock` (the default for now) answers
  every request in the browser from `@repo/mock-api` (installed as an axios `adapter`, loaded only in mock mode); `live`
  calls the API. Same URLs, envelopes and error shapes either way, so hooks never know. Demo accounts (password
  `Password1`): `demo@payorbit.com` (owner), `hr@payorbit.com` (HR manager: can't approve/execute),
  `employee@payorbit.com` (Amara, self-service only; wallet PIN `1234`). Team test accounts (password `Test@1234`), each in
  its own funded, empty company: `stellardev002@gmail.com` (Owner, Stellar Dev Studio), `tlayefaah@gmail.com` (Admin,
  Layefa Technologies, platform admin). The mock DB is one JSON document in localStorage
  (`payorbit-mock-db`); "Reset demo data" on the sign-in page restores the seed. Seed dates are relative to the first run.
- Mock payouts (`packages/mock-api/src/engine.ts`) run on a short clock: executing a run sends each payment PENDING →
  SUBMITTED (~2.5 s) → CONFIRMED (~4 s), or FAILED with a reason (no wallet, no trustline, underfunded). APPROVED runs
  start by themselves at `scheduled_at`, like the live scheduler. Retrying re-checks the cause, so linking a missing
  wallet then retrying succeeds. Mock tokens are unsigned JWTs whose payload carries `permissions`, as the app expects.
- The mock follows `frontend-integration.md`: `/payroll/runs/{id}/review`, approve/execute 409 with `data.issues[]`,
  four-eyes (a run's creator can't approve it while another active approver exists), `CANCELLED` runs, approved-late runs
  waiting for execute, retries creating a new transaction (202, `attempts[]`, max 5, `retryable`), `retry-failed`,
  employee `PENDING` until a wallet is linked, `POST …/employees/{id}/invite` (invite links reuse
  `/auth/reset-password?token=`), `/users/me/employee`, `/users/me/payments/summary`, `/users/me/transactions`,
  `/payroll/schedules/*`, `/notifications` (+ `unread-count`), filters and pagination (`page`, `page_size` ≤ 200,
  `meta.total_pages`; `to` is exclusive), `Idempotency-Key` replay, error slugs, 404 for unknown routes.
- Headless check of the mock: drive `dispatch()` from `router.ts` with a fake `Date.now` (jiti can
  import the TS directly). Invite tokens follow `inviteToken()` in `seed.ts` ("invite-" + 8 chars of the employee id).
- Backend: `https://settle.getpayorbit.com/api/v1` (same service as `https://payorbit-production.up.railway.app`; Go,
  separate repo). Local live mode: `apps/web/.env.local` with `NEXT_PUBLIC_API_SOURCE=live` and `API_PROXY_TARGET`.
  Live login returns only `session` (`role`, `permissions`); the user and `company_id` come from the JWT claims.
  Live test accounts (password `Test@1234`): `tlayefaah@gmail.com` (Owner of Green Lantern Corp, platform admin) and
  `stellardev002+employee@gmail.com` (Employee in Green Lantern, paid in XLM). `stellardev002@gmail.com` itself owns
  Stellar Dev Studio; one email can hold accounts in two companies and login picks one, so use the `+employee` alias. Swagger UI at `/docs`, spec at
  `/docs/doc.json`. Success `{ statusCode, message, data, meta? }`; errors `{ statusCode, message, error }` where `error`
  is a string or `{ message }` (422 validation).
- The browser calls `/api/v1/*` on its own origin, rewritten in `apps/web/next.config.ts` to the backend
  (`API_PROXY_TARGET`). `NEXT_PUBLIC_API_URL` (or the old `NEXT_PUBLIC_API_BASE_URL`) forces direct calls.
- Auth is a dual-token session: `Authorization: Bearer <access_token>` (JWT, 7 days) and `X-Pay-Token: <pay_token>`
  (Redis session, the revocation handle). Both go on every protected request. Session: `features/auth/store.ts`
  (zustand, persisted to sessionStorage under `payorbit_auth`, see `features/auth/session.ts`). `ProtectedRoute` gates
  `(dashboard)`. Permissions come from the session (`hasAnyPermission(user, [...])`); pages check them before rendering.
- `lib/api/client.ts`: `axiosInstance` (public) and `axiosAuth` (signed-in; `lib/api/use-axios-auth.ts` adds both
  headers). Feature `api.ts` functions use `api.get/post/patch/delete` from `lib/api/request.ts`: both headers, an
  `Idempotency-Key` on every POST/PATCH (pass one made when the form or dialog opens, `newIdempotencyKey()`; make a new
  one after a failure), failures as `ApiError` with the API's message and `data` (`errorMessage`, `blockingIssues`), and a
  401 ends the session (`expireSession`: the pay token is a 30-minute sliding session). Lists the UI treats as complete
  ask for `page_size: FULL_PAGE` (200).
- Admin vs employee: `isPayrollAdmin(user)` (`payroll:read` or `employees:read`) picks the shell's nav and what
  `/overview` shows. Admin pages wrap their content in `<RequirePermission any={[...]}>` (hooks live in the child).
- Most data is company-scoped: `/companies/{company_id}/…` with the id from the session. Payroll runs and transactions
  are scoped by the JWT instead (`/payroll/runs`, `/transactions`).
- Money: every amount is a decimal string in whole asset units ("5200.0000000" = 5,200 USDC), requests and responses;
  nothing is in base units. Never add amounts with JS `Number`: `sumAmounts` / `toInputAmount` in `lib/decimal.ts`.
- Wallets can be custodial (the API creates them and signs); transfers need the wallet PIN. Never log, persist or render a
  private key outside the explicit export flow.
- Mutations never auto-retry (`retry: false`): a retried execution or transfer could go out twice.

## Domain rules

- Run lifecycle (API): `DRAFT → APPROVED → PROCESSING → COMPLETED | FAILED`, `FAILED → RETRYING → …`, and `CANCELLED`
  (DRAFT or APPROVED, 204). An APPROVED run is paid automatically at `scheduled_at` only if it was approved before then;
  approved later, it waits for execute (the UI's "Approved" phase with Pay now).
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
9. Date fields in request bodies are RFC 3339 (`2026-10-01T00:00:00Z`); a bare `YYYY-MM-DD` gets a detail-less
   `400 bad_request` from the live API (the mock mirrors this). Unknown routes are 404.
10. Live differs from the mock in field names; `features/payroll/normalize.ts` maps them (review items' `line_item_id`,
    schedule members `{ id, name, amount, status }`, one transaction row per retry attempt). The live employee list has no
    `wallet` field (single GETs do): use `hasWallet()` from `lib/status.ts`, never `!employee.wallet`.
