import type { MockDb, MockRole } from "./db";

/** Every permission the API knows (GET /permissions). */
export const ALL_PERMISSIONS = [
	"company:read",
	"company:update",
	"employees:read",
	"employees:create",
	"employees:update",
	"employees:delete",
	"payroll:read",
	"payroll:create",
	"payroll:update",
	"payroll:approve",
	"payroll:execute",
	"payroll:cancel",
	"wallets:read",
	"wallets:create",
	"wallets:manage",
	"roles:read",
	"roles:manage",
	"compliance:run",
	"reports:read",
	"reports:export",
	"audit:read",
];

/** The roles every company starts with. "employee" has no company permissions: self-service only. */
export const SYSTEM_ROLES: Pick<MockRole, "name" | "slug" | "description" | "permissions">[] = [
	{ name: "Owner", slug: "owner", description: "Owns the workspace: every permission.", permissions: ["*"] },
	{
		name: "Admin",
		slug: "admin",
		description: "Full access to people, payroll, wallets and settings.",
		permissions: ALL_PERMISSIONS,
	},
	{
		name: "HR Manager",
		slug: "hr-manager",
		description: "Manages people and prepares payroll; cannot approve or execute it.",
		permissions: [
			"company:read",
			"employees:read",
			"employees:create",
			"employees:update",
			"payroll:read",
			"payroll:create",
			"payroll:update",
			"payroll:cancel",
			"wallets:read",
			"reports:read",
		],
	},
	{
		name: "Viewer",
		slug: "viewer",
		description: "Read-only access to people, payroll and reports.",
		permissions: ["company:read", "employees:read", "payroll:read", "wallets:read", "reports:read"],
	},
	{ name: "Employee", slug: "employee", description: "Sees their own payments, wallet and requests.", permissions: [] },
];

/** Role permissions, plus the user's grants, minus their revokes. */
export function effectivePermissions(db: MockDb, userId: string) {
	const user = db.users.find((u) => u.id === userId);
	const role = db.roles.find((r) => r.id === user?.role_id);
	const overrides = db.overrides.filter((o) => o.user_id === userId);
	const set = new Set(role?.permissions ?? []);
	for (const o of overrides) {
		if (o.type === "GRANT") set.add(o.permission);
		else set.delete(o.permission);
	}
	return [...set];
}
