"use client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	Plus,
	ShieldCheck,
	Key,
	Webhook,
	User,
	Mail,
	Building,
	AlertTriangle,
} from "lucide-react";
import FadeUp from "../../../components/shared/FadeUp";

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE — app/dashboard/settings/page.tsx
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
	const user = useAuthStore((s) => s.user);

	const handleComingSoon = (feature: string) => {
		toast.info(`${feature} coming soon`, {
			description: "This feature is currently under development.",
		});
	};

	const handleCopyUserId = () => {
		if (user?.id) {
			navigator.clipboard.writeText(user.id);
			toast.success("User ID copied to clipboard");
		}
	};

	const sections = [
		{
			icon: User,
			title: "Account Information",
			description: "Your personal account details",
			content: (
				<div className="grid gap-4 sm:grid-cols-2">
					{[
						{ label: "Full Name", value: user?.name, icon: User },
						{ label: "Email Address", value: user?.email, icon: Mail },
						{ label: "Company", value: user?.company ?? "—", icon: Building },
						{
							label: "Account Role",
							value: user?.role,
							icon: ShieldCheck,
							capitalize: true,
						},
					].map((field) => {
						const Icon = field.icon;
						return (
							<div key={field.label} className="rounded-xl bg-muted/40 p-4">
								<div className="flex items-center gap-2 mb-1.5">
									<Icon className="h-3.5 w-3.5 text-muted-foreground" />
									<p className="text-xs font-medium text-muted-foreground">
										{field.label}
									</p>
								</div>
								<p
									className={cn(
										"text-sm font-medium text-foreground",
										field.capitalize && "capitalize",
									)}
								>
									{field.value ?? "—"}
								</p>
							</div>
						);
					})}
				</div>
			),
		},
		{
			icon: Key,
			title: "API Keys",
			description: "Manage API keys for integrations and automations",
			content: (
				<div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
					<div>
						<p className="text-sm font-medium text-foreground">
							No API keys generated
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Generate a key to integrate with your systems
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleComingSoon("API Keys")}
						className="gap-1.5 shrink-0"
					>
						<Plus className="h-3.5 w-3.5" /> Generate Key
					</Button>
				</div>
			),
		},
		{
			icon: Webhook,
			title: "Webhooks",
			description: "Receive real-time payment status updates",
			content: (
				<div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
					<div>
						<p className="text-sm font-medium text-foreground">
							No webhooks configured
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Add a webhook URL to get instant notifications
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleComingSoon("Webhooks")}
						className="gap-1.5 shrink-0"
					>
						<Plus className="h-3.5 w-3.5" /> Add Webhook
					</Button>
				</div>
			),
		},
		{
			icon: ShieldCheck,
			title: "Security",
			description: "Protect your account with additional security measures",
			content: (
				<div className="space-y-3">
					{[
						{
							label: "Two-Factor Authentication",
							desc: "Add an extra layer of security to your account",
							action: "Enable 2FA",
						},
						{
							label: "Session Management",
							desc: "View and revoke active sessions",
							action: "View Sessions",
						},
					].map((item) => (
						<div
							key={item.label}
							className="flex items-center justify-between rounded-xl bg-muted/40 p-4 flex-wrap gap-3"
						>
							<div>
								<p className="text-sm font-medium text-foreground">
									{item.label}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{item.desc}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleComingSoon(item.label)}
								className="shrink-0"
							>
								{item.action}
							</Button>
						</div>
					))}
				</div>
			),
		},
	];

	return (
		<div className="space-y-6 sm:space-y-8 max-w-3xl">
			<FadeUp>
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
						Settings
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage your account and preferences
					</p>
				</div>
			</FadeUp>

			{sections.map((section, i) => {
				const Icon = section.icon;
				return (
					<FadeUp key={section.title} delay={i * 70}>
						<Card className="overflow-hidden">
							<div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b bg-muted/20">
								<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
									<Icon className="h-4 w-4 text-primary" />
								</div>
								<div>
									<h2 className="text-sm font-semibold text-foreground">
										{section.title}
									</h2>
									<p className="text-xs text-muted-foreground">
										{section.description}
									</p>
								</div>
							</div>
							<div className="p-5 sm:p-6">{section.content}</div>
						</Card>
					</FadeUp>
				);
			})}

			{/* Danger zone */}
			<FadeUp delay={sections.length * 70}>
				<Card className="overflow-hidden border-destructive/20">
					<div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b bg-destructive/5">
						<div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
							<AlertTriangle className="h-4 w-4 text-destructive" />
						</div>
						<div>
							<h2 className="text-sm font-semibold text-destructive">
								Danger Zone
							</h2>
							<p className="text-xs text-muted-foreground">
								Irreversible actions — proceed with caution
							</p>
						</div>
					</div>
					<div className="p-5 sm:p-6">
						<div className="flex items-center justify-between rounded-xl bg-destructive/5 border border-destructive/10 p-4 flex-wrap gap-3">
							<div>
								<p className="text-sm font-medium text-foreground">
									Delete Account
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									Permanently delete your account and all data
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() =>
									toast.error("Account deletion requires confirmation", {
										description:
											"Please contact support to delete your account.",
										action: { label: "Contact Support", onClick: () => {} },
									})
								}
							>
								Delete Account
							</Button>
						</div>
					</div>
				</Card>
			</FadeUp>
		</div>
	);
}
