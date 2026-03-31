"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	User,
	Mail,
	Building,
	ShieldCheck,
	Key,
	Webhook,
	AlertTriangle,
	Plus,
	Loader2,
	Eye,
	EyeOff,
	Check,
	Pencil,
	X,
} from "lucide-react";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ProfileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	company: z.string().optional(),
});

const PasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z.string().min(6, "Must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Please confirm your new password"),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type PasswordFormData = z.infer<typeof PasswordSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FadeUp({
	children,
	delay = 0,
	className,
}: {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ob = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					setInView(true);
					ob.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		ob.observe(el);
		return () => ob.disconnect();
	}, []);
	return (
		<div
			ref={ref}
			className={className}
			style={{
				opacity: inView ? 1 : 0,
				transform: inView ? "translateY(0)" : "translateY(16px)",
				transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
			}}
		>
			{children}
		</div>
	);
}

function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
			{error && (
				<p className="text-xs text-destructive flex items-center gap-1">
					<span className="h-1 w-1 rounded-full bg-destructive inline-block shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}

function PasswordInput({
	error,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<Input
				{...props}
				type={show ? "text" : "password"}
				className={cn(
					"pr-10",
					error && "border-destructive focus-visible:ring-destructive",
				)}
			/>
			<button
				type="button"
				onClick={() => setShow((v) => !v)}
				tabIndex={-1}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsCard({
	icon: Icon,
	title,
	description,
	children,
	accent,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
	children: React.ReactNode;
	accent?: "default" | "danger";
}) {
	const isDanger = accent === "danger";
	return (
		<Card
			className={cn("overflow-hidden", isDanger && "border-destructive/20")}
		>
			<div
				className={cn(
					"flex items-center gap-3 px-5 sm:px-6 py-4 border-b",
					isDanger ? "bg-destructive/5" : "bg-muted/20",
				)}
			>
				<div
					className={cn(
						"h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
						isDanger ? "bg-destructive/10" : "bg-primary/10",
					)}
				>
					<Icon
						className={cn(
							"h-4 w-4",
							isDanger ? "text-destructive" : "text-primary",
						)}
					/>
				</div>
				<div>
					<h2
						className={cn(
							"text-sm font-semibold",
							isDanger ? "text-destructive" : "text-foreground",
						)}
					>
						{title}
					</h2>
					<p className="text-xs text-muted-foreground">{description}</p>
				</div>
			</div>
			<div className="p-5 sm:p-6">{children}</div>
		</Card>
	);
}

// ─── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm() {
	const user = useAuthStore((s) => s.user);
	const updateProfile = useAuthStore((s) => s.updateProfile);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<ProfileFormData>({
		resolver: zodResolver(ProfileSchema),
		defaultValues: {
			name: user?.name ?? "",
			email: user?.email ?? "",
			company: user?.company ?? "",
		},
	});

	const handleCancel = () => {
		reset({
			name: user?.name ?? "",
			email: user?.email ?? "",
			company: user?.company ?? "",
		});
		setIsEditing(false);
	};

	const onSubmit = async (data: ProfileFormData) => {
		setIsSaving(true);
		try {
			await updateProfile(data);
			toast.success("Profile updated", {
				description: "Your account details have been saved.",
			});
			setIsEditing(false);
		} catch (err) {
			toast.error("Failed to update profile", {
				description: err instanceof Error ? err.message : "Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate>
			<div className="grid gap-4 sm:grid-cols-2">
				{/* Name */}
				<Field label="Full Name" error={errors.name?.message}>
					<div className="relative">
						<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							{...register("name")}
							placeholder="John Doe"
							disabled={!isEditing}
							className={cn(
								"pl-9 transition-colors",
								!isEditing && "bg-muted/40 cursor-default",
								errors.name && "border-destructive",
							)}
						/>
					</div>
				</Field>

				{/* Email */}
				<Field label="Email Address" error={errors.email?.message}>
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							{...register("email")}
							type="email"
							placeholder="you@example.com"
							disabled={!isEditing}
							className={cn(
								"pl-9 transition-colors",
								!isEditing && "bg-muted/40 cursor-default",
								errors.email && "border-destructive",
							)}
						/>
					</div>
				</Field>

				{/* Company */}
				<Field label="Company" error={errors.company?.message}>
					<div className="relative">
						<Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							{...register("company")}
							placeholder="Acme Inc."
							disabled={!isEditing}
							className={cn(
								"pl-9 transition-colors",
								!isEditing && "bg-muted/40 cursor-default",
							)}
						/>
					</div>
				</Field>

				{/* Role — read only */}
				<Field label="Account Role">
					<div className="relative">
						<ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							value={user?.role?.replace(/-/g, " ") ?? ""}
							disabled
							className="pl-9 bg-muted/40 cursor-default capitalize"
						/>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Role cannot be changed here. Contact your admin.
					</p>
				</Field>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-3 mt-6">
				{!isEditing ? (
					<Button
						type="button"
						variant="outline"
						className="gap-2"
						onClick={() => setIsEditing(true)}
					>
						<Pencil className="h-4 w-4" />
						Edit Profile
					</Button>
				) : (
					<>
						<Button
							type="submit"
							disabled={isSaving || !isDirty}
							className="gap-2 shadow-sm"
						>
							{isSaving ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" /> Saving…
								</>
							) : (
								<>
									<Check className="h-4 w-4" /> Save Changes
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
							className="gap-2"
						>
							<X className="h-4 w-4" /> Cancel
						</Button>
					</>
				)}
			</div>
		</form>
	);
}

// ─── Password Form ────────────────────────────────────────────────────────────

function PasswordForm() {
	const changePassword = useAuthStore((s) => s.changePassword);
	const [isSaving, setIsSaving] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<PasswordFormData>({
		resolver: zodResolver(PasswordSchema),
	});

	const newPassword = watch("newPassword", "");

	// Password strength indicator
	const strength = (() => {
		if (!newPassword) return 0;
		let score = 0;
		if (newPassword.length >= 8) score++;
		if (/[A-Z]/.test(newPassword)) score++;
		if (/[0-9]/.test(newPassword)) score++;
		if (/[^A-Za-z0-9]/.test(newPassword)) score++;
		return score;
	})();

	const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
	const strengthColor = [
		"",
		"bg-red-500",
		"bg-yellow-500",
		"bg-blue-500",
		"bg-green-500",
	][strength];
	const strengthText = [
		"",
		"text-red-500",
		"text-yellow-500",
		"text-blue-500",
		"text-green-500",
	][strength];

	const handleCancel = () => {
		reset();
		setIsOpen(false);
	};

	const onSubmit = async (data: PasswordFormData) => {
		setIsSaving(true);
		try {
			await changePassword(data.currentPassword, data.newPassword);
			toast.success("Password changed", {
				description: "Your password has been updated successfully.",
			});
			reset();
			setIsOpen(false);
		} catch (err) {
			toast.error("Failed to change password", {
				description: err instanceof Error ? err.message : "Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (!isOpen) {
		return (
			<div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
				<div>
					<p className="text-sm font-medium text-foreground">Password</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						Last changed: unknown
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="gap-2"
					onClick={() => setIsOpen(true)}
				>
					<Key className="h-4 w-4" />
					Change Password
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
			<Field label="Current Password" error={errors.currentPassword?.message}>
				<PasswordInput
					{...register("currentPassword")}
					placeholder="••••••••"
					error={!!errors.currentPassword}
				/>
			</Field>

			<Field label="New Password" error={errors.newPassword?.message}>
				<PasswordInput
					{...register("newPassword")}
					placeholder="••••••••"
					error={!!errors.newPassword}
				/>
				{/* Strength bar */}
				{newPassword && (
					<div className="mt-2 space-y-1">
						<div className="flex gap-1">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className={cn(
										"h-1 flex-1 rounded-full transition-all duration-300",
										i <= strength ? strengthColor : "bg-muted",
									)}
								/>
							))}
						</div>
						<p className={cn("text-xs font-medium", strengthText)}>
							{strengthLabel}
						</p>
					</div>
				)}
			</Field>

			<Field
				label="Confirm New Password"
				error={errors.confirmPassword?.message}
			>
				<PasswordInput
					{...register("confirmPassword")}
					placeholder="••••••••"
					error={!!errors.confirmPassword}
				/>
			</Field>

			<div className="flex gap-3 pt-1">
				<Button type="submit" disabled={isSaving} className="gap-2 shadow-sm">
					{isSaving ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" /> Updating…
						</>
					) : (
						<>
							<Check className="h-4 w-4" /> Update Password
						</>
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={handleCancel}
					disabled={isSaving}
					className="gap-2"
				>
					<X className="h-4 w-4" /> Cancel
				</Button>
			</div>
		</form>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
	const handleComingSoon = (feature: string) => {
		toast.info(`${feature} coming soon`, {
			description: "This feature is currently under development.",
		});
	};

	return (
		<div className="space-y-6 sm:space-y-8 max-w-3xl">
			<FadeUp>
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
						Settings
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage your account details and preferences
					</p>
				</div>
			</FadeUp>

			{/* Profile */}
			<FadeUp delay={60}>
				<SettingsCard
					icon={User}
					title="Account Information"
					description="Update your name, email, and company"
				>
					<ProfileForm />
				</SettingsCard>
			</FadeUp>

			{/* Password */}
			<FadeUp delay={120}>
				<SettingsCard
					icon={Key}
					title="Security"
					description="Manage your password and account security"
				>
					<div className="space-y-4">
						<PasswordForm />

						{/* 2FA row */}
						<div className="flex items-center justify-between rounded-xl bg-muted/40 p-4 flex-wrap gap-3">
							<div>
								<p className="text-sm font-medium text-foreground">
									Two-Factor Authentication
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									Add an extra layer of security
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleComingSoon("Two-Factor Authentication")}
							>
								Enable 2FA
							</Button>
						</div>

						{/* Sessions row */}
						<div className="flex items-center justify-between rounded-xl bg-muted/40 p-4 flex-wrap gap-3">
							<div>
								<p className="text-sm font-medium text-foreground">
									Active Sessions
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									View and revoke active sessions
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleComingSoon("Session Management")}
							>
								View Sessions
							</Button>
						</div>
					</div>
				</SettingsCard>
			</FadeUp>

			{/* API Keys */}
			<FadeUp delay={180}>
				<SettingsCard
					icon={Key}
					title="API Keys"
					description="Manage API keys for integrations and automations"
				>
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
							className="gap-1.5 shrink-0"
							onClick={() => handleComingSoon("API Keys")}
						>
							<Plus className="h-3.5 w-3.5" /> Generate Key
						</Button>
					</div>
				</SettingsCard>
			</FadeUp>

			{/* Webhooks */}
			<FadeUp delay={240}>
				<SettingsCard
					icon={Webhook}
					title="Webhooks"
					description="Receive real-time payment status updates"
				>
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
							className="gap-1.5 shrink-0"
							onClick={() => handleComingSoon("Webhooks")}
						>
							<Plus className="h-3.5 w-3.5" /> Add Webhook
						</Button>
					</div>
				</SettingsCard>
			</FadeUp>

			{/* Danger zone */}
			<FadeUp delay={300}>
				<SettingsCard
					icon={AlertTriangle}
					title="Danger Zone"
					description="Irreversible actions — proceed with caution"
					accent="danger"
				>
					<div className="flex items-center justify-between rounded-xl bg-destructive/5 border border-destructive/10 p-4 flex-wrap gap-3">
						<div>
							<p className="text-sm font-medium text-foreground">
								Delete Account
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								Permanently delete your account and all associated data
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							onClick={() =>
								toast.error("Account deletion requires confirmation", {
									description:
										"Please contact support to permanently delete your account.",
									action: {
										label: "Contact Support",
										onClick: () => window.open("mailto:support@stellar.com"),
									},
								})
							}
						>
							Delete Account
						</Button>
					</div>
				</SettingsCard>
			</FadeUp>
		</div>
	);
}
