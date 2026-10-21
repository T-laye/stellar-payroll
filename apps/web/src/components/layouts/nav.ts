import type { LucideIcon } from "lucide-react";
import {
	ArrowLeftRight,
	Bell,
	CalendarClock,
	FileText,
	HandCoins,
	History,
	Home,
	KeyRound,
	LayoutDashboard,
	Settings,
	Users,
	UserRound,
	Wallet,
} from "lucide-react";
import { hasAnyPermission, isPayrollAdmin, type User } from "@/features/auth/store";
import { routes } from "@/lib/routes";

export interface NavItem {
	label: string;
	href: string;
	icon: LucideIcon;
	/** Show the unread notifications count. */
	badge?: "notifications";
	/** Hidden unless the user holds one of these. */
	permissions?: string[];
}

export interface NavGroup {
	label?: string;
	items: NavItem[];
}

const r = routes.dashboardRoutes;

const ADMIN_NAV: NavGroup[] = [
	{
		items: [
			{ label: "Dashboard", href: r.OVERVIEW, icon: LayoutDashboard },
			{ label: "Employees", href: r.EMPLOYEES, icon: Users, permissions: ["employees:read"] },
			{ label: "Payroll", href: r.PAYROLL, icon: FileText, permissions: ["payroll:read"] },
			{ label: "Recurring Payroll", href: r.RECURRING, icon: CalendarClock, permissions: ["payroll:read"] },
			{ label: "Transactions", href: r.TRANSACTIONS, icon: ArrowLeftRight, permissions: ["payroll:read"] },
			{ label: "Notifications", href: r.NOTIFICATIONS, icon: Bell, badge: "notifications" },
		],
	},
	{
		label: "Workspace",
		items: [
			{ label: "Wallets", href: r.WALLETS, icon: Wallet, permissions: ["wallets:read"] },
			{ label: "Payment requests", href: r.REQUESTS, icon: HandCoins, permissions: ["payroll:read", "payroll:approve"] },
			{ label: "Roles", href: r.ROLES, icon: KeyRound, permissions: ["roles:read", "roles:manage"] },
			{ label: "Settings", href: r.SETTINGS, icon: Settings },
		],
	},
];

const EMPLOYEE_NAV: NavGroup[] = [
	{
		items: [
			{ label: "Home", href: r.OVERVIEW, icon: Home },
			{ label: "Payment History", href: r.PAYMENTS, icon: History },
			{ label: "Profile & Wallet", href: r.PROFILE, icon: UserRound },
			{ label: "Requests", href: r.REQUESTS, icon: HandCoins },
			{ label: "Notifications", href: r.NOTIFICATIONS, icon: Bell, badge: "notifications" },
		],
	},
	{ label: "Account", items: [{ label: "Settings", href: r.SETTINGS, icon: Settings }] },
];

/** The admin dashboard for people who run payroll; the self-service portal for everyone else. */
export function navFor(user: User | null): NavGroup[] {
	const groups = isPayrollAdmin(user) ? ADMIN_NAV : EMPLOYEE_NAV;
	return groups
		.map((group) => ({
			...group,
			items: group.items.filter((item) => !item.permissions || hasAnyPermission(user, item.permissions)),
		}))
		.filter((group) => group.items.length > 0);
}

/** `/payroll/123` keeps "Payroll" lit; `/overview` only matches itself. */
export function isActive(pathname: string, href: string) {
	return href === r.OVERVIEW ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
