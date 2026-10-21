import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	CalendarClock,
	FileCheck2,
	Globe2,
	Layers,
	Network,
	ShieldCheck,
	Timer,
	UserCheck,
	Users,
	Wallet,
	Zap,
} from "lucide-react";

/** The landing copy, taken from getpayorbit.com. */

export const NAV = [
	{ label: "Features", href: "#features" },
	{ label: "How it works", href: "#how-it-works" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "FAQ", href: "#faq" },
];

export const STATS = [
	{ value: "< 5s", label: "Settlement time" },
	{ value: "150+", label: "Countries covered" },
	{ value: "$0", label: "Hidden fees" },
];

export const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
	{
		icon: Users,
		title: "Bulk Payroll",
		description: "Disburse salaries to entire teams across 150+ countries in a single run. Stellar settles in under 5 seconds.",
	},
	{
		icon: ShieldCheck,
		title: "Bank-Grade Security",
		description: "Approval controls, on-chain audit trails, and role-based access protect every payment.",
	},
	{
		icon: Zap,
		title: "Instant Settlement",
		description: "Payments finalize on Stellar in seconds — no correspondent banks, no 3-day clearing windows.",
	},
	{
		icon: Globe2,
		title: "Multi-Currency Support",
		description: "Pay in USDC stablecoin or XLM, with every amount and asset visible before you approve.",
	},
	{
		icon: Wallet,
		title: "Wallet Infrastructure",
		description: "Wallet provisioning for every employee, with PIN-protected access and transfers.",
	},
	{
		icon: FileCheck2,
		title: "Audit & Reporting",
		description: "Complete payment history with a verifiable Stellar transaction for every completed payment.",
	},
	{
		icon: CalendarClock,
		title: "Auto Scheduling",
		description: "Recurring payroll weekly, bi-weekly, or monthly. Drafts are prepared for you to review and approve.",
	},
	{
		icon: Network,
		title: "Stellar Network Client",
		description: "Direct Stellar integration with real-time payment tracking from pending to confirmed.",
	},
	{
		icon: Layers,
		title: "Contractor Payments",
		description: "Pay freelancers and contractors globally in USDC. No bank account required.",
	},
	{
		icon: UserCheck,
		title: "Employee Portal",
		description: "Employees see every payment, its status, and the transaction reference, without asking finance.",
	},
	{
		icon: Timer,
		title: "Failure & Retry",
		description: "Failed payments say why, and can be retried one by one without recreating the payroll.",
	},
	{
		icon: BarChart3,
		title: "Real-time Analytics",
		description: "Track payroll processed, payment success, and who's been paid with live dashboards.",
	},
];

export const STEPS = [
	{
		title: "Connect Your Team",
		description: "Add employees with their wallet addresses and payment preferences. Supports 150+ countries out of the box.",
	},
	{ title: "Configure Payroll", description: "Set salaries, assets, and pay schedules. Pick who's included in each cycle." },
	{
		title: "Review & Approve",
		description: "Finance and HR review every amount and catch missing payment details before anything is sent.",
	},
	{
		title: "Instant Settlement",
		description: "Payments settle on Stellar in under 5 seconds. Employees see them land in their portal.",
	},
];

export const TESTIMONIALS = [
	{
		quote:
			"Before PayOrbit, our payroll was spread across spreadsheets and emails. After switching, everything — from employee records to cross-border payments — lives in one place.",
		name: "Robert Fox",
		role: "HR Specialist, Acme Corp",
	},
	{
		quote:
			"We evaluated several payroll tools and PayOrbit stood out immediately. Setup was fast, and running payroll across 12 countries now takes minutes, not days.",
		name: "Darrell Steward",
		role: "Employee Relations Officer",
	},
	{
		quote:
			"As a finance lead, I used to spend hours chasing payment statuses. PayOrbit gives me a real-time view of every settlement. Approvals are fast and the audit trail is impeccable.",
		name: "Amara Osei",
		role: "Finance Lead, NovaTech",
	},
	{
		quote:
			"Our DAO needed a payroll solution that was transparent and fast. PayOrbit on Stellar is exactly that — contributor rewards distributed in seconds with full on-chain visibility.",
		name: "James Mercado",
		role: "Treasury Lead, BuildDAO",
	},
	{
		quote:
			"Paying contractors across Nigeria, Brazil, and the Philippines used to take a week. Now it's done in under 5 seconds per payment. The Stellar integration is genuinely impressive.",
		name: "Maria Rodrigues",
		role: "COO, RemoteFirst",
	},
	{
		quote:
			"The role-based access and approval flow gave our CFO confidence that no payment goes out without the right eyes on it. Compliance reporting is now effortless.",
		name: "Sarah Chen",
		role: "CFO, TechVenture",
	},
];

export const PLANS = [
	{
		name: "Starter",
		description: "Perfect for small teams getting started",
		price: "Free",
		period: "Forever",
		cta: "Get Started",
		features: ["Up to 10 employees", "Basic payroll management", "Email support", "Monthly payroll runs", "Standard security"],
	},
	{
		name: "Professional",
		description: "For growing companies",
		price: "$299",
		period: "/month",
		cta: "Start Free Trial",
		popular: true,
		features: [
			"Up to 500 employees",
			"Advanced payroll features",
			"Priority email & chat support",
			"Weekly & bi-weekly payrolls",
			"Advanced analytics",
			"Custom integrations",
			"Compliance reporting",
		],
	},
	{
		name: "Enterprise",
		description: "For large organizations",
		price: "Custom",
		period: "pricing",
		cta: "Contact Sales",
		features: [
			"Unlimited employees",
			"White-label solutions",
			"Dedicated support team",
			"Custom workflows",
			"Advanced security & compliance",
			"SLA guarantees",
			"Training included",
		],
	},
];

export const FAQS = [
	{
		q: "What is PayOrbit?",
		a: "PayOrbit is a cross-border payroll platform built on the Stellar blockchain. It lets companies pay employees and contractors globally in USDC — settling in under 5 seconds with zero hidden fees.",
	},
	{
		q: "Which countries and currencies are supported?",
		a: "PayOrbit supports teams in 150+ countries. Payroll settles in USDC or XLM on Stellar, and you see every amount and asset before you approve a payment.",
	},
	{
		q: "Can contractors be paid without a bank account?",
		a: "Yes. PayOrbit provisions wallets for employees and contractors. No bank account is required — recipients receive USDC directly to their wallet.",
	},
	{
		q: "What happens if a payment fails?",
		a: "You're notified straight away and see why it failed — a missing wallet, insufficient balance, or a network error. Fix the cause and retry that one payment; the rest of the payroll is untouched.",
	},
	{
		q: "Does recurring payroll pay automatically?",
		a: "A schedule prepares each payroll as a draft a few days before the pay date and notifies you. Nothing is sent until an admin reviews and approves it.",
	},
	{
		q: "How can employees check their payments?",
		a: "Every employee gets a portal with their payment history, the status of each payment (Pending, Processing, Completed or Failed), and the Stellar transaction reference for completed payments.",
	},
	{
		q: "How does Stellar ensure payment security?",
		a: "Every transaction is recorded immutably on the Stellar blockchain. PayOrbit adds approval controls, role-based access, and a full audit trail to every payment.",
	},
	{
		q: "How long does settlement take?",
		a: "Payments settle on the Stellar network in under 5 seconds — no correspondent banks, no 3-day clearing windows.",
	},
	{
		q: "What are the fees?",
		a: "PayOrbit charges a flat monthly fee based on team size — no per-transaction fees, no FX markups, no hidden costs. Stellar network fees are a fraction of a cent.",
	},
	{
		q: "How do role-based permissions work?",
		a: "Assign Owner, Admin, HR and Viewer roles. HR can prepare payroll while only approvers can approve and execute it.",
	},
	{
		q: "Is there a free trial?",
		a: "Yes — get started for free with no credit card required. Upgrade when you're ready to scale beyond the free tier.",
	},
	{ q: "How do I get started?", a: "Sign up, add your team, and run your first payroll — all in under 15 minutes." },
];

export const FOOTER = [
	{ title: "Payroll", links: ["Bulk Payroll", "Auto Scheduling", "Contractor Payments", "Employee Portal"] },
	{ title: "Compliance", links: ["Audit Trail", "Role-based Access", "Payment Verification", "Reporting"] },
	{ title: "Infrastructure", links: ["Stellar Network", "USDC Stablecoin", "Real-time Tracking", "API & Integrations"] },
	{ title: "Solutions", links: ["Startups", "DAOs", "NGOs", "Enterprise"] },
];
