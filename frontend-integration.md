# PayOrbit frontend integration guide

Base URL `/api/v1`. Full reference: `/docs` (Swagger). This guide covers what the spec does not say.

## 1. Conventions

**Auth.** Every call except `/auth/*` needs `Authorization: Bearer <access_token>` and `X-Pay-Token: <pay_token>` (both returned by login). The pay token is a 30-minute sliding session; a 401 means log in again.

**Idempotency.** Send an `Idempotency-Key` header (any unique string, e.g. a UUID per user action) on every `POST`/`PATCH`. A repeat with the same key on the same route returns the first response for 24 hours. Generate the key when the user opens the form, not on each click, so a double click is safe.

**Envelope.** Success: `{ statusCode, message, data, meta? }`. Error: `{ statusCode, message, error }` where `error` is a slug such as `bad_request`, `forbidden`, `not_found`, or an object `{ message }` for validation failures (HTTP 422). Unknown routes return 404. A malformed UUID in a path or query returns 400 or 404, never 500.

**Unknown request fields are ignored.** Extra JSON keys (for example `role_slug` on an employee) do not cause an error and are not stored. For an employee's role, use `job_title`.

**Pagination.** `?page=1&page_size=20` (max 200; `limit` is an alias). `meta` is `{ page, page_size, limit, total, total_pages }`. Notifications add `unread_count`.

**Dates.** Responses are RFC 3339 UTC. Date filters accept `YYYY-MM-DD` (midnight UTC) or RFC 3339. `to` is exclusive, so send the day after for an inclusive end.

**Money.** Every amount, request and response, is a decimal string in whole asset units: `"5200.00"` is 5,200 USDC. Responses carry seven places (`"5200.0000000"`). Nothing is in stroops or base units. Never use JS `Number` for arithmetic; format with a decimal library or `Intl.NumberFormat` on the string. Stats totals add USDC and XLM together without conversion; show them per asset only if a company uses one asset.

## 2. Statuses and how to show them

| Concept | API values | UI label |
|---|---|---|
| Payment (transaction) | `PENDING`, `SUBMITTED`, `CONFIRMED`, `FAILED` | Pending, Processing, Completed, Failed |
| Payroll run | `DRAFT`, `APPROVED`, `PROCESSING`, `RETRYING`, `COMPLETED`, `FAILED`, `CANCELLED` | Pending, Scheduled, Processing, Processing, Completed, Failed, Cancelled |
| Employee | `PENDING`, `ACTIVE`, `INACTIVE`, `TERMINATED` | |
| Invite (`invite_status`) | `NOT_INVITED`, `PENDING`, `ACCEPTED` | |
| Schedule | `ACTIVE`, `PAUSED`, `CANCELLED` | |

Run status filters: `?status=DRAFT,APPROVED` (comma list). Friendly aliases `pending`, `scheduled`, `processing` also work.

Run `COMPLETED` means every payment is confirmed on Stellar. `FAILED` means finished with at least one failed payment; retry them and the run returns to `RETRYING`, then `COMPLETED`.

A new employee is `PENDING`; it becomes `ACTIVE` when a wallet is linked. You cannot set `ACTIVE` without a wallet (409).

## 3. Core flows

### Add employee
1. `POST /companies/{id}/employees` (`pay_frequency` optional, defaults to the pay group's cycle, else `MONTHLY`).
2. `POST /companies/{id}/employees/{empId}/wallet` with `{ "stellar_address": "G..." }`, or an empty body for an admin-held custodial wallet. This activates the employee.
3. `POST /companies/{id}/employees/{empId}/invite` creates the employee's portal login and emails a password link (201). Call it again while `invite_status` is `PENDING` to re-send (200). After the employee signs in it returns 409.
4. `GET /companies/{id}/employees/{empId}` returns the employee with `wallet` and `invite_status`.
5. Clear a pay group with `PATCH ... { "group_id": null }` (or `""`). Omit the field to leave it unchanged.

### Create and pay a payroll
1. `POST /payroll/runs` with `currency`, `period_start`, `period_end`, `scheduled_at` (future), optional `name`, `notes`. Creating a run with `group_id` does **not** add that group's employees; the client adds line items.
2. `POST /payroll/runs/{id}/line-items/bulk` with `{ items: [{ employee_id, amount }] }`. Amounts are decimal strings. `total_amount` on the run is recomputed after every line-item change, so Draft runs show a correct total.
3. `GET /payroll/runs/{id}/review` drives the review screen: `employee_count`, `total_amount`, per-employee `items` (each with an `issue` when the wallet is missing or the employee is not active), `asset`, `estimated_transactions`, `estimated_fee_xlm`, `issues[]`, `ready`.
4. `POST /payroll/runs/{id}/approve`. Returns 409 with `data.issues[]` (`employee_name`, `reason`) if anything is incomplete. Send the user back to fix those rows. A run's creator cannot approve it when another active user can approve; a company with a single approver can self-approve (403 otherwise).
5. `POST /payroll/runs/{id}/execute` starts payment now (409 with the same `issues` shape if incomplete). If the run is approved **before** its `scheduled_at`, the server pays it automatically at that time. If it is approved after `scheduled_at`, it waits for execute. Tell the user which applies.

### Monitor
Poll while a run is `PROCESSING` or `RETRYING`: `GET /payroll/runs/{id}` every 3-5 seconds (it carries `employee_count` and `payments: { confirmed, pending, failed }`, so a progress bar needs no second call). Stop on `COMPLETED`, `FAILED` or `CANCELLED`. Payment rows: `GET /transactions?payroll_run_id={id}`.

`GET /payroll/runs` rows include `employee_count`, `payments`, `name`, `completed_at`. If `name` is empty, derive "October 2026 payroll" from `period_start`.

### Transactions list
`GET /transactions?status=PENDING,SUBMITTED&employee_id=&payroll_run_id=&from=&to=&q=&page=&page_size=`. `q` matches the start of the Stellar hash or part of the employee name. Each row carries `employee_id`, `employee_name`, `payroll_run_name`, `failure_code`, `error_message`, `retryable`. `GET /transactions/{id}` adds `attempts[]` (`attempt`, `status`, `stellar_tx_hash`, `error`, `failure_code`, `at`), oldest first, so the failure that triggered a retry stays visible.

`explorer_url` is set on confirmed payments; link to it. Dashboard status always equals the ledger state because the server confirms each hash against Horizon.

### Failure and retry
`failure_code`: `INVALID_WALLET`, `NO_TRUSTLINE`, `INSUFFICIENT_BALANCE`, `NETWORK_ERROR`, `TRANSACTION_FAILED`. Suggested admin messages:
- `INVALID_WALLET`: the destination account does not exist; fix the employee's wallet.
- `NO_TRUSTLINE`: employee must add a USDC trustline.
- `INSUFFICIENT_BALANCE`: fund the company wallet.
- `NETWORK_ERROR`: transient; retry.

Show a **Retry** button only when `retryable` is true. `POST /transactions/{id}/retry` (or `POST /payroll/runs/{id}/line-items/{itemId}/retry`, or `POST /payroll/runs/{id}/retry-failed` for all). It returns 202; a new attempt (new transaction id and hash) is created and the old one is kept in `attempts`. Retries are capped at 5 attempts per payment (`retryable` turns false).

### Recurring payroll
- `POST /payroll/schedules` with `name`, `frequency` (`WEEKLY|BIWEEKLY|MONTHLY`), `asset`, `next_run_at` (the first pay date, future), `employee_ids`. Every member must be active-or-pending, paid in `asset`, and have the same `pay_frequency` (400 otherwise).
- Responses carry `next_run_at`, `employee_ids`, `employee_count`, `amount_per_cycle`, and `upcoming[]` (next three: `date`, `run_id`, `run_status`, `employee_count`, `amount`). `run_id` is set once the draft exists. Detail adds `employees[]` and past `runs[]`.
- `POST /payroll/schedules/{id}/pause | resume | cancel`; `PATCH` renames or replaces employees. Resume skips pay dates missed while paused. Cancel also cancels the schedule's not-yet-paid draft.
- Monthly dates stay on month end: Oct 31, Nov 30, Dec 31.

**What the server does.** Three days before a pay date it creates a `DRAFT` run at current salaries and notifies admins. It never approves anything. The admin approves the draft; then the run is paid automatically at the pay date. An unapproved draft is never paid, and admins get a "missed" notification if the pay date passes without an approved run. UI copy should say "A draft is created 3 days before; approve it to schedule payment", not "payroll runs automatically".

### Employee portal
Employees sign in like admins (role `employee`, no company permissions). Use:
- `GET /users/me/employee`: profile, salary, asset, frequency, wallet.
- `GET /users/me/payments/summary`: `total_received[]` per asset, `latest_payment`, `current_status`.
- `GET /users/me/transactions` and `GET /users/me/transactions/{id}`: their own payments only (404 for anyone else's). Same shape as `/transactions` but `error_message`, `failure_code` and `retryable` are withheld.
- They get 403 on every company endpoint (`/payroll/*`, `/transactions`, stats).

### Notifications
- `GET /notifications?unread=true&page_size=50` → `data[]`, `meta.unread_count` (always the full unread total).
- `PATCH /notifications/{id}/read`, `POST /notifications/read-all`, `GET /notifications/unread-count` (cheap, poll it every 30-60 seconds for the bell).
- Item: `id, kind, title, body, tone (info|success|warning|error), resource_type (payroll_run|transaction|schedule), resource_id, read_at, created_at`. Navigate by `resource_type`: employees always get `transaction`, never the run. A missing resource means no link.
- Kinds: admin `payroll.ready_for_review`, `payroll.processing`, `payroll.completed`, `payroll.failed` (finished with failures), `payment.failed`, `schedule.approaching` (2 days out), `payroll.blocked`; employee `employee.payroll_initiated`, `employee.payment_processing`, `employee.payment_completed`, `employee.payment_failed`.

### Dashboard
`GET /companies/{id}/stats/overview` needs `company:read`. `transactions` carries `total_confirmed`, `total_failed`, `total_pending`, `pending_retry`, `employees_paid_this_month`, `employees_paid_all_time` (counts are per employee payment, not per retry). `payroll.total_disbursed_*` sums confirmed payments.

## 4. Answers to open questions

- **Unknown routes** now return 404.
- **Four-eyes approval** is enforced when another active user holds `payroll:approve`; otherwise the creator may approve (a one-admin company must be able to pay). Tell us if you want it strict.
- **`/exports/payroll`** is still a stub (no file). Use `GET /transactions` with filters and export client-side until it is built.
- **`redirect_url`** (`https://<slug>.payorbit.com`) is unused by the backend and no wildcard subdomain setup exists. Ignore it. Per-company subdomains are not planned; route inside the app by `company_slug`.
- **Unknown request fields** are ignored, not rejected.
- **Group on create**: the client must add line items; the server does not copy a group's employees.
- **Email links** all open `APP_DOMAIN` + `/auth/verify-email?token=`, `/auth/reset-password?token=`, `/auth/login`. Employee invites reuse `/auth/reset-password?token=`. The app needs those three pages. (`APP_DOMAIN` is an environment variable, default `https://payorbit.vercel.app`.)
- **Platform admin console**: the `/admin/*` endpoints exist and are not in the PRD. Treat the console as a separate, later project; no backend work blocks it.
- **Money unit**: decided, decimal strings in whole units everywhere (section 1). The old "base units" wording in the spec was wrong; the database always stored decimals, so no value changes. Remove any `/1e7` conversions.
