"use client";

// ============================================================
// ENHANCED AUTH PAGES — SignIn & SignUp
// Drop-in replacements for your existing auth pages
// ============================================================

// ─── signin/page.tsx ──────────────────────────────────────────────────────────

import {
	useState,
	useEffect,
	type InputHTMLAttributes,
	type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { SignupSchema, SignupFormData } from "@/lib/schemas";
import { useSignup } from "@/hooks/auth.hook";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Loader2,
	Mail,
	Lock,
	Eye,
	EyeOff,
	User,
	Building2,
	ShieldCheck,
	ArrowRight,
	Check,
	ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { countries, timezones } from "@/lib/utils/constants";
import { routes } from "@/lib/utils/routes";
import Logo from "../../../components/ui/logo";

// ─── Shared: Animated background blobs ───────────────────────────────────────
function AuthBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden">
			<div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
			<div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite_1s]" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
		</div>
	);
}

// ─── Shared: Password input with toggle ──────────────────────────────────────
function PasswordInput({
	placeholder = "••••••••",
	className,
	...props
}: InputHTMLAttributes<HTMLInputElement>) {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<Input
				{...props}
				type={show ? "text" : "password"}
				placeholder={placeholder}
				className={cn("pr-10", className)}
			/>
			<button
				type="button"
				onClick={() => setShow((v) => !v)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
				tabIndex={-1}
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}

// ─── Shared: Field wrapper ────────────────────────────────────────────────────
function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm font-medium text-foreground">{label}</label>
			{children}
			{error && (
				<p className="text-xs text-destructive flex items-center gap-1 mt-1">
					<span className="inline-block h-1 w-1 rounded-full bg-destructive shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}

// ─── Shared: mount animation wrapper ─────────────────────────────────────────
function MountFade({ children }: { children: ReactNode }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 40);
		return () => clearTimeout(t);
	}, []);
	return (
		<div
			style={{
				opacity: mounted ? 1 : 0,
				transform: mounted
					? "translateY(0) scale(1)"
					: "translateY(20px) scale(0.98)",
				transition: "opacity 0.5s ease, transform 0.5s ease",
			}}
			className="w-full"
		>
			{children}
		</div>
	);
}

// function StepDot({ active, done }: { active: boolean; done: boolean }) {
// 	return (
// 		<div
// 			className={cn(
// 				"h-2 w-2 rounded-full transition-all duration-300",
// 				done ? "bg-primary w-4" : active ? "bg-primary" : "bg-border",
// 			)}
// 		/>
// 	);
// }

export default function Page() {
	const router = useRouter();
	const { mutateAsync: signup, isPending, data } = useSignup();
	const [countryOpen, setCountryOpen] = useState(false);
	const [countrySearch, setCountrySearch] = useState("");
	const [timezoneOpen, setTimezoneOpen] = useState(false);
	const [timezoneSearch, setTimezoneSearch] = useState("");

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(SignupSchema),
		defaultValues: {
			first_name: "",
			last_name: "",
			company_name: "",
			company_country: "",
			company_slug: "",
			company_timezone: "Africa/Lagos",
			email: "",
			password: "",
			confirmPassword: "",
			role_slug: "admin",
		},
	});

	const role = watch("role_slug");
	const selectedCountry = watch("company_country");
	const selectedTimezone = watch("company_timezone");

	const filteredCountries = countries.filter((country) =>
		country.toLowerCase().includes(countrySearch.toLowerCase()),
	);
	const filteredTimezones = timezones.filter((timezone) =>
		timezone.toLowerCase().includes(timezoneSearch.toLowerCase()),
	);

	const onSubmit = async (data: SignupFormData) => {
		try {
			await signup(data);
			toast.success("Account created. Verify your email to continue.");
			router.push(
				`${routes.authRoutes.VERIFICATION_SENT}?email=${encodeURIComponent(data.email)}`,
			);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to sign up");
		}
	};

	const roleDescriptions: Record<string, string> = {
		owner: "Owns the workspace and can manage billing, teams, and settings",
		admin: "Full access to all features and settings",
		"hr-manager": "Manage people operations and payroll workflows",
		viewer: "Read-only access to reports and data",
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background relative">
			<AuthBackground />

			<MountFade>
				<div className="w-full max-w-xl mx-auto relative z-10">
					<div className="flex justify-center text-center mb-6">
						<Logo w="w-40" />
					</div>

					<Card className="w-full border border-border shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 overflow-hidden">
						{/* Top accent bar */}
						<div className="h-1 w-full bg-linear-to-r from-primary via-accent to-primary bg-size-[200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

						<div className="p-8">
							<div className="mb-8">
								<h1 className="text-2xl font-bold text-foreground mb-1.5">
									Get Started
								</h1>
								<p className="text-sm text-muted-foreground">
									Create your Stellar Payroll account — free forever
								</p>
							</div>

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5"
								noValidate
							>
								<div className="grid gap-5 sm:grid-cols-2">
									<Field label="First Name" error={errors.first_name?.message}>
										<div className="relative">
											<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
											<Input
												{...register("first_name")}
												type="text"
												placeholder="John"
												className={cn(
													"pl-9 bg-input border border-border transition-all focus:border-primary/50",
													errors.first_name && "border-destructive",
												)}
											/>
										</div>
									</Field>

									<Field label="Last Name" error={errors.last_name?.message}>
										<div className="relative">
											<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
											<Input
												{...register("last_name")}
												type="text"
												placeholder="Doe"
												className={cn(
													"pl-9 bg-input border border-border transition-all focus:border-primary/50",
													errors.last_name && "border-destructive",
												)}
											/>
										</div>
									</Field>
								</div>

								{/* Email */}
								<Field label="Email" error={errors.email?.message}>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
										<Input
											{...register("email")}
											type="email"
											placeholder="you@example.com"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.email && "border-destructive",
											)}
										/>
									</div>
								</Field>

								<div className="grid gap-5 sm:grid-cols-2">
									<Field
										label="Company Name"
										error={errors.company_name?.message}
									>
										<div className="relative">
											<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
											<Input
												{...register("company_name")}
												type="text"
												placeholder="Acme Inc"
												className={cn(
													"pl-9 bg-input border border-border transition-all focus:border-primary/50",
													errors.company_name && "border-destructive",
												)}
											/>
										</div>
									</Field>

									<Field
										label="Company Slug"
										error={errors.company_slug?.message}
									>
										<div className="relative">
											<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
											<Input
												{...register("company_slug")}
												type="text"
												placeholder="acme-inc"
												className={cn(
													"pl-9 bg-input border border-border transition-all lowercase focus:border-primary/50",
													errors.company_slug && "border-destructive",
												)}
											/>
										</div>
									</Field>
								</div>

								<div className="grid gap-5 sm:grid-cols-2">
									<Field
										label="Company Country"
										error={errors.company_country?.message}
									>
										<input type="hidden" {...register("company_country")} />
										<Popover open={countryOpen} onOpenChange={setCountryOpen}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													aria-expanded={countryOpen}
													className={cn(
														"w-full justify-between bg-input border border-border font-normal hover:bg-input",
														errors.company_country && "border-destructive",
													)}
												>
													<span
														className={cn(
															"truncate",
															!selectedCountry && "text-muted-foreground",
														)}
													>
														{selectedCountry || "Select country..."}
													</span>
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-(--radix-popover-trigger-width) p-0"
												align="start"
											>
												<Command>
													<CommandInput
														placeholder="Search country..."
														value={countrySearch}
														onValueChange={setCountrySearch}
													/>
													<CommandList>
														<CommandEmpty>No country found.</CommandEmpty>
														<CommandGroup>
															{filteredCountries.map((country) => (
																<CommandItem
																	key={country}
																	value={country}
																	onSelect={(value) => {
																		setValue("company_country", value, {
																			shouldValidate: true,
																			shouldDirty: true,
																		});
																		setCountryOpen(false);
																		setCountrySearch("");
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			selectedCountry === country
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	{country}
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
									</Field>

									<Field
										label="Company Timezone"
										error={errors.company_timezone?.message}
									>
										<input type="hidden" {...register("company_timezone")} />
										<Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													aria-expanded={timezoneOpen}
													className={cn(
														"w-full justify-between bg-input border border-border font-normal hover:bg-input",
														errors.company_timezone && "border-destructive",
													)}
												>
													<span
														className={cn(
															"truncate",
															!selectedTimezone && "text-muted-foreground",
														)}
													>
														{selectedTimezone || "Select timezone..."}
													</span>
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-(--radix-popover-trigger-width) p-0"
												align="start"
											>
												<Command>
													<CommandInput
														placeholder="Search timezone..."
														value={timezoneSearch}
														onValueChange={setTimezoneSearch}
													/>
													<CommandList>
														<CommandEmpty>No timezone found.</CommandEmpty>
														<CommandGroup>
															{filteredTimezones.map((timezone) => (
																<CommandItem
																	key={timezone}
																	value={timezone}
																	onSelect={(value) => {
																		setValue("company_timezone", value, {
																			shouldValidate: true,
																			shouldDirty: true,
																		});
																		setTimezoneOpen(false);
																		setTimezoneSearch("");
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			selectedTimezone === timezone
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	{timezone}
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
									</Field>
								</div>

								{/* Role */}
								<Field label="Role" error={errors.role_slug?.message}>
									<Select
										value={role}
										onValueChange={(value) =>
											setValue(
												"role_slug",
												value as SignupFormData["role_slug"],
											)
										}
									>
										<SelectTrigger
											className={cn(
												"bg-input border border-border transition-all focus:border-primary/50",
												errors.role_slug && "border-destructive",
											)}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="owner">Owner</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="hr-manager">HR Manager</SelectItem>
											<SelectItem value="viewer">Viewer</SelectItem>
										</SelectContent>
									</Select>
									{/* Dynamic role description */}
									{role && (
										<p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
											<ShieldCheck className="h-3 w-3 text-primary shrink-0" />
											{roleDescriptions[role]}
										</p>
									)}
								</Field>

								{/* Password */}
								<Field label="Password" error={errors.password?.message}>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
										<PasswordInput
											{...register("password")}
											placeholder="••••••••"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.password && "border-destructive",
											)}
										/>
									</div>
								</Field>

								{/* Confirm Password */}
								<Field
									label="Confirm Password"
									error={errors.confirmPassword?.message}
								>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
										<PasswordInput
											{...register("confirmPassword")}
											placeholder="••••••••"
											className={cn(
												"pl-9 bg-input border border-border transition-all focus:border-primary/50",
												errors.confirmPassword && "border-destructive",
											)}
										/>
									</div>
								</Field>

								<Button
									type="submit"
									disabled={isPending}
									className="w-full mt-2 gap-2 group shadow-sm shadow-primary/20 transition-all active:scale-[0.98]"
								>
									{isPending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Creating account...
										</>
									) : (
										<>
											Create Account
											<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
										</>
									)}
								</Button>
							</form>

							{/* Divider */}
							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-border" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-card px-3 text-xs text-muted-foreground">
										No credit card required
									</span>
								</div>
							</div>

							{/* Feature bullets */}
							<div className="grid grid-cols-2 gap-2 mb-6">
								{[
									"Free forever plan",
									"130+ countries",
									"Instant setup",
									"Cancel anytime",
								].map((item) => (
									<div
										key={item}
										className="flex items-center gap-1.5 text-xs text-muted-foreground"
									>
										<div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
										{item}
									</div>
								))}
							</div>

							<p className="text-center text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link
									href={routes.authRoutes.SIGN_IN}
									className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline underline-offset-2"
								>
									Sign in
								</Link>
							</p>
						</div>
					</Card>

					<p className="text-center text-xs text-muted-foreground mt-6">
						By creating an account, you agree to our{" "}
						<Link
							href="#"
							className="hover:text-foreground transition-colors underline underline-offset-2"
						>
							Terms
						</Link>{" "}
						and{" "}
						<Link
							href="#"
							className="hover:text-foreground transition-colors underline underline-offset-2"
						>
							Privacy Policy
						</Link>
					</p>
				</div>
			</MountFade>

			<style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
		</div>
	);
}
