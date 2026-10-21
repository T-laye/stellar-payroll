# PayOrbit

Cross-border payroll on the Stellar network (Testnet): add employees, create and schedule payroll, pay everyone in
USDC or XLM in one run, and give employees a clear view of every payment.

Turborepo + pnpm monorepo:

| Path | What | Dev URL |
|---|---|---|
| `apps/landing` | Marketing site | http://localhost:3002 |
| `apps/web` | The app: auth, dashboard, employees, payroll, payments, wallets, roles, settings | http://localhost:3000 |
| `packages/ui` | `@repo/ui`: design tokens, shadcn components, motion, fonts | — |
| `packages/mock-api` | `@repo/mock-api`: the in-browser demo backend | — |
| `packages/eslint-config`, `packages/typescript-config` | Shared configs | — |

## Getting started

Requires Node ≥ 22 and pnpm 12 (`corepack enable`, or any pnpm ≥ 9 picks the version from `package.json`).

```bash
pnpm install
pnpm dev            # both apps
pnpm --filter web dev
```

The app runs on **demo data** by default, with nothing to configure. Sign in with (password `Password1`):

- `demo@payorbit.com`: owner, sees everything.
- `hr@payorbit.com`: HR manager, prepares payroll but can't approve or pay it.
- `employee@payorbit.com`: an employee's own payments, wallet (PIN `1234`) and requests.

Executing a payroll run settles its payments in a few seconds; one employee has no wallet, so their payment fails until
you link one and retry. "Reset demo data" on the sign-in page starts over.

Set `NEXT_PUBLIC_API_SOURCE=live` to use the real API at `https://payorbit-production.up.railway.app/api/v1` (through
the app's own `/api/v1` proxy; `API_PROXY_TARGET` points it elsewhere). See `apps/web/.env.example`.

```bash
pnpm check-types
pnpm lint
pnpm build
pnpm format
```

Conventions, data flow and deployment: [CLAUDE.md](CLAUDE.md). Sprint scope, PRD status and the backend contract:
[docs/PLAN.md](docs/PLAN.md).
