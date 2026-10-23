# PayOrbit — Instaward 2 plan

PRD: [PayOrbit — Cross-Border Payroll MVP Enhancement](https://docs.google.com/document/d/177jQW9jrV-ykp3ORLX9G3gdJIfU7WeWsf-FwYefLQYk).
Goal in 30 days: **Add employees → create payroll → review → schedule/run → bulk Stellar payments → monitor → employees
see their payment status**, demonstrated end to end on Stellar Testnet, then tested with early users.

Backend: `https://payorbit-production.up.railway.app/api/v1` (Swagger UI `/docs`, spec `/docs/doc.json`). Everything
below about the API comes from that spec and from probing the live service on 2026-10-20; nothing was tested with a
signed-in account.

Legend: ✅ done · 🟡 partial · ❌ missing

## 1. Status by PRD section

### §4 Payroll administration

| Requirement | Frontend | Backend | Needed |
|---|---|---|---|
| Create a payroll cycle | ✅ `PayrollRunForm` (group, currency, period, `scheduled_at`) | ✅ `POST /payroll/runs` (DRAFT) | Make it a guided, multi-step flow (PRD §11.2) |
| Select employees | ❌ runs are created with no line items | ✅ `POST /payroll/runs/{id}/line-items`, `/line-items/bulk` (≤100, atomic) | FE: employee picker that prefills each salary, then bulk-adds line items |
| Per-employee amounts, total | 🟡 shows `run.total_amount` only | ✅ `GET /payroll/runs/{id}/line-items` (with employee name, wallet) | FE: line-item table with edit/remove (`PATCH`/`DELETE …/line-items/{itemId}`) |
| Review screen (count, total, amounts, asset, est. fees, incomplete info, confirm) | ❌ | 🟡 line items + `POST /payroll/runs/{id}/compliance-check` (wallet present, amount > 0) | FE: review screen. Fees: compute client-side (Stellar base fee × operations) or BE adds an estimate |
| Approve | ✅ | ✅ `POST /payroll/runs/{id}/approve` | — |
| Execute | ✅ | ✅ `POST /payroll/runs/{id}/execute` (async) | FE: poll the run and its transactions while PROCESSING |
| Block execution with missing info | ❌ | 🟡 compliance check exists, not enforced on approve/execute | BE: refuse approve/execute when the check fails (409 with the failing items) |
| History + filter (Pending/Scheduled/Processing/Completed/Failed) | 🟡 list of recent runs, no filter | 🟡 `GET /payroll/runs` returns everything, no query params or pagination | FE filter on the mapping below; BE: `status`, `from`, `to`, `page`, `page_size` |

PRD → API run status: **Pending** = `DRAFT` · **Scheduled** = `APPROVED` with `scheduled_at` in the future ·
**Processing** = `PROCESSING` / `RETRYING` · **Completed** = `COMPLETED` · **Failed** = `FAILED`.

### §5 Employee payment portal

| Requirement | Frontend | Backend | Needed |
|---|---|---|---|
| Employee can sign in | ❌ no invite-acceptance page (`features/auth/api.ts` lists `/auth/accept-invite` and `/auth/invite`, which don't exist) | ✅ `POST /auth/complete-profile` (token from invite email, 7 days, returns a session) | FE: `/auth/complete-profile?token=` page. Confirm the invite email links to the app's URL |
| Totals, latest payment, status counts | 🟡 overview shows `GET /users/me/stats` for non-admins | ✅ `/users/me/stats`, `/users/me/wallet` (`last_payment`) | FE: dedicated employee dashboard |
| Payment history (date, amount, asset, status, hash) | ❌ | ❌ `/transactions` is company-wide and needs `payroll:read` | BE: `GET /users/me/transactions` (+ `/{id}`), paginated |
| Pending → Processing → Completed / Failed | ❌ | ✅ `PENDING → SUBMITTED → CONFIRMED / FAILED` | FE: one status map (labels, colours, copy) used everywhere |
| Explorer reference | ❌ hash shown as text in the admin run dialog only | ✅ `stellar_tx_hash`, `ledger_sequence` | FE: Stellar Expert Testnet link helper |

### §6 Recurring & scheduled payroll

What exists: payroll groups carry `pay_cycle` (`WEEKLY`/`BIWEEKLY`/`MONTHLY`); runs carry `scheduled_at`;
`GET /payroll/schedule` lists DRAFT/APPROVED runs with a future `scheduled_at`. **The backend scheduler already pays an
APPROVED run automatically at `scheduled_at`**, so copy must say so ("Approved runs are paid at the scheduled time"),
and a DRAFT run must never look like it will pay itself.

| Requirement | Frontend | Backend | Needed |
|---|---|---|---|
| Create schedule (frequency, employees, next date) | ❌ | ❌ no schedule entity | BE: `PayrollSchedule` (group or employee list, frequency, `next_run_at`, asset, status) |
| View upcoming payroll | 🟡 "upcoming" list from `/payroll/schedule` | 🟡 lists runs, not schedules | BE: `GET /payroll/schedules`, each with its next date |
| Pause / resume / cancel | ❌ | ❌ | BE: `POST /payroll/schedules/{id}/pause\|resume\|cancel` |
| Correct next date | ❌ | ❌ | BE computes `next_run_at`; on that date it creates a DRAFT run with line items and notifies the admin, who reviews and approves |

### §7 Payout monitoring

| Requirement | Frontend | Backend | Needed |
|---|---|---|---|
| Totals: processed, success/pending/failed, amount paid | ✅ overview + payroll stats | ✅ `/companies/{id}/stats/overview`, `/stats/payroll`, `/stats/transactions` | — |
| Employees paid | ❌ | ❌ | BE: add `employees_paid` (distinct, this month / all time) to overview stats |
| Latest payroll activity | 🟡 recent runs list | 🟡 `/companies/{id}/audit-logs` | FE: activity feed (audit logs or notifications) |
| Run details: employee, amount, asset, status, date, hash, error | 🟡 dialog lists transactions (address, hash, error) without employee names | ✅ line items (employee) + `GET /payroll/runs/{id}/transactions`, joined by `line_item_id` | FE: run details page joining both |
| Filter by date, employee, cycle, status | ❌ | ❌ `GET /transactions` is a fixed page of 50, no params | BE: `status`, `employee_id`, `payroll_run_id`, `from`, `to`, `page`, `page_size` |

### §8 Failure & retry

| Requirement | Frontend | Backend | Needed |
|---|---|---|---|
| Identify failures | 🟡 status shown | ✅ `status=FAILED`, `error_message` | — |
| Reason categories (invalid wallet, insufficient balance, tx failure, network) | ❌ | ❌ free-text `error_message` only | BE: `failure_code` enum + `retryable` boolean |
| Retry one payment | ❌ | ✅ `POST /transactions/{id}/retry` (`payroll:execute`; up to 3 tries per stats docs) | FE: retry action with confirmation; never auto-retry |
| Retried payment gets a new reference | ❌ | ❌ retry resets the same row to PENDING; the old hash/error are overwritten | BE: keep an attempts history (`GET /transactions/{id}/attempts`) or a new transaction linked by `retry_of` |

### §9 Employee management

| Requirement | Frontend | Backend | Needed |
|---|---|---|---|
| Name, email, role, wallet, salary, asset, frequency, status | 🟡 all but frequency; "role" is `job_title` | 🟡 frequency only via the group's `pay_cycle` | Decide: frequency per employee or per group (recommend group) |
| Status Active / Pending / Inactive | 🟡 `ACTIVE`/`INACTIVE`/`TERMINATED` | 🟡 no "pending" | BE: expose onboarding state (invite sent, not activated, no wallet) so FE can show Pending |
| Add / edit / update payment info / (de)activate | ✅ | ✅ | FE sends `role_slug` on create, which the API schema doesn't define: confirm or drop |
| Employee payment history (admin) | ❌ | ❌ | BE: `GET /companies/{id}/employees/{empId}/transactions` (or `employee_id` filter on `/transactions`) |
| Resend invite | ❌ | ❌ | BE: `POST /companies/{id}/employees/{empId}/invite` |

### §10 Notifications (in-app)

❌ Frontend and backend. Needed in the API: a `Notification` entity, `GET /notifications` (paginated, `unread_count`),
`PATCH /notifications/{id}/read`, `POST /notifications/read-all`, and events for: payroll ready for review, processing,
completed, payment failed, scheduled payroll approaching (admins); payroll initiated, payment processing / completed /
failed (employees). FE: bell + list in the header, `/notifications` page.

### §11 Screens

Rebuilt on 2026-10-21 against the new design (dark sidebar shell, brand from getpayorbit.com). All screens run on the
mock today; ✅ = built in the frontend, whatever the backend status above.

| Screen | Route | Status |
|---|---|---|
| Admin dashboard (totals, trend, upcoming, latest activity, attention cards) | `/overview` | ✅ |
| Employee management (Active / Pending / Inactive tabs, search) | `/employees` | ✅ |
| Add / edit employee (wallet or custodial wallet, salary, asset, frequency) | `/employees/new`, `/employees/[id]/edit` | ✅ |
| Employee profile + payment history | `/employees/[id]` | ✅ |
| Create payroll (5-step guided flow) | `/payroll/new` | ✅ |
| Payroll review (summary, fee estimate, missing info, inline edits) | `/payroll/new` step 3, `/payroll/[id]` while Pending | ✅ |
| Payroll details (live progress, per-payment status, hash, reason, retry) | `/payroll/[id]` | ✅ |
| Payroll history (Pending / Scheduled / Processing / Completed / Failed) | `/payroll` | ✅ |
| Recurring payroll (list, create, details, pause / resume / cancel, change date) | `/recurring/*` | ✅ |
| Transactions (date, employee, cycle, status filters; hash search; pagination) | `/transactions` | ✅ |
| Payment / transaction details (timeline, failure reason, attempts, verify) | `/transactions/[id]`, `/payments/[id]` | ✅ |
| Employee dashboard | `/overview` (employee) | ✅ |
| Employee payment history | `/payments` | ✅ |
| Employee invite acceptance | `/auth/complete-profile?token=` | ✅ |
| Notifications (bell + page, admin and employee) | header, `/notifications` | ✅ |
| Empty / loading / error / success states | every screen | ✅ |

### §12 Stellar integration

| Requirement | Status |
|---|---|
| Settlement on Stellar, USDC and XLM | ✅ API (`currency` USDC/XLM; company wallets with trustlines) |
| Bulk payments | ✅ API (async execution per run) |
| On-chain verification | 🟡 API marks `CONFIRMED` after ledger inclusion and stores `ledger_sequence`; FE could re-check on Horizon like Stellance (`features/payments/verify.ts` there) |
| Store / show tx references | ✅ API · ❌ FE explorer links |
| Testnet demo evidence (payment, hash, dashboard update, employee record) | ❌ not yet produced |

### §13–14 User testing & validation report

Not code. Needs: a test script with the PRD's 7 tasks, 5+ users from the listed profiles, feedback captured per task,
and `docs/validation-report.md` (users, tasks, issues, feedback, changes made, changes pending).

## 2. Backend contract — what the frontend needs

Already there and unused by the frontend (wire these up first): payroll line items (5 endpoints),
`POST /payroll/runs/{id}/compliance-check` + `GET`, `POST /transactions/{id}/retry`, `GET /transactions/{id}`,
`POST /auth/complete-profile`, `GET /companies/{id}/audit-logs`.

To add (in priority order for the final demo):

1. `GET /users/me/transactions` and `/users/me/transactions/{id}` — employee payment history (§5).
2. Filters + pagination on `GET /transactions` and `GET /payroll/runs` (§4, §7).
3. `failure_code` + `retryable` on transactions; attempts history on retry (§8).
4. Enforce the compliance check on approve/execute (§4).
5. Payroll schedules: CRUD, pause/resume/cancel, `next_run_at`, DRAFT generation (§6).
6. Notifications (§10).
7. Employee onboarding state, resend invite, per-employee transactions, `employees_paid` stat (§7, §9).

### Observations from probing the live API

- Unknown routes return `500 {"error":"internal_error"}` instead of 404, and `/api/v1/health` returns 500 while
  `/health` (outside the base path) returns 401. The spec lists `/health` as public.
- `GET /companies/{id}/exports/payroll` is a stub (no file is produced yet).
- The frontend's "change verification email" flow calls `PATCH /auth/change-verification-email`, which doesn't exist.
- Login returns `redirect_url: https://<slug>.payorbit.com`; the app ignores it. Decide whether per-company subdomains
  are planned before choosing the production domain.

### Open questions

- **Amount units.** The spec says `salary_amount` is in base units (`"10000000"` = 1 USDC). The UI shows amounts as-is.
  Check one real employee and run: if they are base units, every amount needs dividing by 10⁷ (inputs multiplied).
- Is a run's line-item list built automatically from its `group_id`, or must the client always add line items?
- Production domain(s) for the landing site and app (currently path-routed: `/app` → web on Vercel).
- Email links (verification, reset, invite) must point at the app's auth pages; confirm the backend's frontend URL.

## Update 2026-10-23: backend answered

The backend team's `frontend-integration.md` (repo root) answers §2 and the open questions: decimal money everywhere,
the review endpoint, approval issues, four-eyes, `CANCELLED`, retries as new transactions, employee `PENDING` + invites,
employee portal endpoints, schedules, notifications, filters, pagination, idempotency keys, 404s. The frontend and the
mock now follow it (app still on the mock; `NEXT_PUBLIC_API_SOURCE=live` switches). Sections 1–2 above describe the
API as it was on 2026-10-20 and are kept for history.

## 3. Frontend plan

Done (2026-10-21): items 1–6 below are built against the mock (`packages/mock-api`), which now also serves the proposed
schedules, notifications, failure codes and attempt history, transaction filters and pagination, and refuses to
approve or execute a run with missing wallets. `NEXT_PUBLIC_API_SOURCE=live` switches to the real API; each proposed
endpoint will 500 there until the backend ships it (see §2).

1. ✅ Payroll flow: create (guided) → select employees → review (missing wallets, fees) → approve / pay now / schedule →
   run details with live status.
2. ✅ Status system: `apps/web/src/lib/status.ts` for every label and colour, explorer links, failure reasons, retry.
3. ✅ Employee portal: complete-profile page, employee dashboard, payment history and details.
4. ✅ Recurring payroll screens (on the proposed `/payroll/schedules` API).
5. ✅ Notifications (header bell, page) on the proposed `/notifications` API.
6. ✅ Empty/loading/error states on every screen; responsive layouts (sidebar becomes a drawer on phones).
7. Testnet demo run against the live API, user testing, validation report.

Next once the backend link is confirmed: switch to `live`, check amount units against real data (open question above),
and replace each proposal the backend implements differently.
