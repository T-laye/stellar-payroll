"use client";

import { useMemo, useState } from "react";
import {
	AlertCircle,
	CheckCircle2,
	Coins,
	Copy,
	Loader2,
	Plus,
	RefreshCcw,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCompanyWallet } from "@/hooks/wallet.hook";
import {
	useAddCompanyWalletTrustline,
	useCompanyWalletDetails,
	useCompanyWallets,
	useCreateCompanyWallet,
} from "@/hooks/wallet.hook";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { cn } from "@/lib/utils";
import {
	formatStatAmount,
	formatStatDate,
	formatStatNumber,
} from "@/lib/utils/stats";

function maskAddress(value: string) {
	if (value.length <= 12) {
		return value;
	}

	return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

const STELLAR_PUBLIC_KEY_PATTERN = /^G[A-Z2-7]{55}$/;
const STELLAR_SECRET_KEY_PATTERN = /^S[A-Z2-7]{55}$/;
const supportedCompanyWalletTypes = ["OPERATIONAL", "ESCROW", "EXTERNAL"] as const;
type CompanyWalletType = (typeof supportedCompanyWalletTypes)[number];

export function CompanyWalletsManager() {
	const companyId = useAuthStore((state) => state.user?.company_id);
	const wallets = useWalletStore((state) => state.wallets);
	const selectedWallet = useWalletStore((state) => state.selectedWallet);
	const { isLoading: isWalletsLoading, isError: isWalletsError } =
		useCompanyWallets(companyId ?? undefined);
	const { data: walletStatsResponse } = useCompanyWallet(companyId || "");
	const { mutateAsync: createCompanyWallet, isPending: isCreatingWallet } =
		useCreateCompanyWallet(companyId ?? undefined);
	const { mutateAsync: addWalletTrustline, isPending: isAddingTrustline } =
		useAddCompanyWalletTrustline(companyId ?? "");

	const [detailsWalletId, setDetailsWalletId] = useState<string | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [trustlineDialogOpen, setTrustlineDialogOpen] = useState(false);
	const [trustlineWalletId, setTrustlineWalletId] = useState<string | null>(
		null,
	);
	const [createForm, setCreateForm] = useState({
		stellar_address: "",
		secret_key: "",
		wallet_type: "OPERATIONAL" as CompanyWalletType,
	});
	const [trustlineForm, setTrustlineForm] = useState({
		asset_code: "",
		asset_issuer: "",
	});

	const detailsQuery = useCompanyWalletDetails(
		detailsWalletId ?? undefined,
		companyId ?? undefined,
	);

	const walletStats = walletStatsResponse?.data;
	const totalWallets = useMemo(() => wallets.length, [wallets]);
	const fundedWallets = walletStats?.funded_wallets ?? 0;
	const unfundedWallets = walletStats?.unfunded_wallets ?? 0;
	const companyWalletTypeStats = Object.entries(
		walletStats?.company_wallets_by_type ?? {},
	);

	if (!companyId) {
		return (
			<div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
				Company context is required before wallets can be managed.
			</div>
		);
	}

	const handleCopy = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied`);
		} catch {
			toast.error(`Failed to copy ${label.toLowerCase()}`);
		}
	};

	const openTrustlineDialog = (walletId: string) => {
		setTrustlineWalletId(walletId);
		setTrustlineForm({
			asset_code: "",
			asset_issuer: "",
		});
		setTrustlineDialogOpen(true);
	};

	const handleCreateWallet = async () => {
		const walletType = createForm.wallet_type;
		const stellarAddress = createForm.stellar_address.trim();
		const secretKey = createForm.secret_key.trim();

		if (walletType === "EXTERNAL" && !stellarAddress) {
			toast.error("External wallets require a Stellar address.");
			return;
		}

		if (stellarAddress && !STELLAR_PUBLIC_KEY_PATTERN.test(stellarAddress)) {
			toast.error("Enter a valid Stellar public key starting with G.");
			return;
		}

		if (secretKey && !STELLAR_SECRET_KEY_PATTERN.test(secretKey)) {
			toast.error("Enter a valid Stellar secret key starting with S.");
			return;
		}

		try {
			await createCompanyWallet({
				wallet_type: walletType,
				...(stellarAddress ? { stellar_address: stellarAddress } : {}),
				...(secretKey ? { secret_key: secretKey } : {}),
			});
			toast.success("Company wallet created successfully.");
			setCreateDialogOpen(false);
			setCreateForm({
				stellar_address: "",
				secret_key: "",
				wallet_type: "OPERATIONAL",
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create wallet.",
			);
		}
	};

	const handleAddTrustline = async () => {
		if (!trustlineWalletId) {
			return;
		}

		if (
			!trustlineForm.asset_code.trim() ||
			!trustlineForm.asset_issuer.trim()
		) {
			toast.error("Asset code and issuer are required.");
			return;
		}

		if (!STELLAR_PUBLIC_KEY_PATTERN.test(trustlineForm.asset_issuer.trim())) {
			toast.error("Enter a valid Stellar issuer public key starting with G.");
			return;
		}

		try {
			await addWalletTrustline({
				walletId: trustlineWalletId,
				payload: {
					asset_code: trustlineForm.asset_code.trim().toUpperCase(),
					asset_issuer: trustlineForm.asset_issuer.trim(),
				},
			});
			toast.success("Trustline added successfully.");
			setTrustlineDialogOpen(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to add trustline.",
			);
		}
	};

	return (
		<>
			<div className="space-y-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-sm font-medium text-foreground">
							Company Wallets
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Create and monitor company wallets, then add trustlines to support
							the assets your payroll operations need.
						</p>
					</div>
					<Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
						<Plus className="h-4 w-4" />
						Add Wallet
					</Button>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{
							label: "Total Wallets",
							value: formatStatNumber(totalWallets),
							icon: Wallet,
						},
						{
							label: "Funded Wallets",
							value: formatStatNumber(fundedWallets),
							icon: CheckCircle2,
						},
						{
							label: "Unfunded Wallets",
							value: formatStatNumber(unfundedWallets),
							icon: AlertCircle,
						},
						{
							label: "Wallet Types",
							value: formatStatNumber(
								companyWalletTypeStats.length || (totalWallets ? 1 : 0),
							),
							icon: ShieldCheck,
						},
					].map((item) => {
						const Icon = item.icon;

						return (
							<Card key={item.label} className="p-4">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-xs text-muted-foreground">
											{item.label}
										</p>
										<p className="mt-2 text-2xl font-semibold text-foreground">
											{item.value}
										</p>
									</div>
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
										<Icon className="h-5 w-5 text-primary" />
									</div>
								</div>
							</Card>
						);
					})}
				</div>

				{companyWalletTypeStats.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{companyWalletTypeStats.map(([walletType, count]) => (
							<Badge key={walletType} variant="outline">
								{walletType}: {formatStatNumber(count)}
							</Badge>
						))}
					</div>
				)}

				{isWalletsError ? (
					<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
						Company wallets could not be loaded right now.
					</div>
				) : isWalletsLoading ? (
					<div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
						Loading company wallets...
					</div>
				) : wallets.length === 0 ? (
					<div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
						No company wallets have been added yet.
					</div>
				) : (
					<div className="grid gap-4">
						{wallets?.map((wallet) => {
							const isExpanded = detailsWalletId === wallet.id;
							const isSelectedWallet = selectedWallet?.id === wallet.id;
							const balances = isSelectedWallet ? selectedWallet.balances : [];

							return (
								<div
									key={wallet.id}
									className="rounded-2xl border border-border bg-muted/20 p-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-foreground">
													{wallet.wallet_type}
												</p>
												<Badge variant="outline">{wallet.network}</Badge>
												<Badge
													variant={wallet.is_funded ? "secondary" : "outline"}
												>
													{wallet.is_funded ? "Funded" : "Unfunded"}
												</Badge>
											</div>
											<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
												<span className="font-mono text-foreground">
													{maskAddress(wallet.stellar_address)}
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 gap-1 px-2"
													onClick={() =>
														handleCopy(wallet.stellar_address, "Wallet address")
													}
												>
													<Copy className="h-3.5 w-3.5" />
													Copy
												</Button>
											</div>
											<p className="text-xs text-muted-foreground">
												Created {formatStatDate(wallet.created_at)} • Updated{" "}
												{formatStatDate(wallet.updated_at)}
											</p>
										</div>

										<div className="flex flex-wrap items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												className="gap-2"
												onClick={() =>
													setDetailsWalletId((current) =>
														current === wallet.id ? null : wallet.id,
													)
												}
											>
												{detailsQuery.isFetching && isExpanded ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<RefreshCcw className="h-4 w-4" />
												)}
												{isExpanded ? "Hide Details" : "View Details"}
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="gap-2"
												onClick={() => openTrustlineDialog(wallet.id)}
											>
												<Coins className="h-4 w-4" />
												Add Trustline
											</Button>
										</div>
									</div>

									{isExpanded && (
										<div className="mt-4 rounded-xl border bg-background p-4">
											{detailsQuery.isLoading && !isSelectedWallet ? (
												<p className="text-sm text-muted-foreground">
													Loading wallet balances...
												</p>
											) : detailsQuery.isError && !isSelectedWallet ? (
												<p className="text-sm text-destructive">
													Unable to load this wallet&apos;s details right now.
												</p>
											) : (
												<div className="space-y-4">
													<div className="grid gap-3 sm:grid-cols-3">
														<div className="rounded-xl bg-muted/40 p-3">
															<p className="text-xs text-muted-foreground">
																Owner Type
															</p>
															<p className="mt-1 text-sm font-medium text-foreground">
																{wallet.owner_type}
															</p>
														</div>
														<div className="rounded-xl bg-muted/40 p-3">
															<p className="text-xs text-muted-foreground">
																Wallet ID
															</p>
															<p className="mt-1 text-sm font-medium text-foreground">
																{maskAddress(wallet.id)}
															</p>
														</div>
														<div className="rounded-xl bg-muted/40 p-3">
															<p className="text-xs text-muted-foreground">
																Known Balances
															</p>
															<p className="mt-1 text-sm font-medium text-foreground">
																{formatStatNumber(balances.length)}
															</p>
														</div>
													</div>

													<div className="space-y-2">
														<p className="text-sm font-medium text-foreground">
															Balances
														</p>
														{balances.length === 0 ? (
															<p className="text-sm text-muted-foreground">
																No balances were returned for this wallet yet.
															</p>
														) : (
															<div className="grid gap-2">
																{balances.map((balance) => (
																	<div
																		key={`${wallet.id}-${balance.asset}`}
																		className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
																	>
																		<span className="text-sm text-foreground">
																			{balance.asset}
																		</span>
																		<span className="text-sm font-medium text-muted-foreground">
																			{formatStatAmount(balance.amount)}
																		</span>
																	</div>
																))}
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Company Wallet</DialogTitle>
						<DialogDescription>
							Add an existing Stellar wallet for this company and store its
							operational metadata.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Wallet Type
							</label>
							<Select
								value={createForm.wallet_type}
								onValueChange={(value) =>
									setCreateForm((current) => ({
										...current,
										wallet_type: value as CompanyWalletType,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{supportedCompanyWalletTypes.map((walletType) => (
										<SelectItem key={walletType} value={walletType}>
											{walletType}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Stellar Address
							</label>
							<Input
								value={createForm.stellar_address}
								onChange={(event) =>
									setCreateForm((current) => ({
										...current,
										stellar_address: event.target.value,
									}))
								}
								placeholder={
									createForm.wallet_type === "EXTERNAL"
										? "Required for external wallets"
										: "Optional existing public key"
								}
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Secret Key
							</label>
							<Input
								type="password"
								value={createForm.secret_key}
								onChange={(event) =>
									setCreateForm((current) => ({
										...current,
										secret_key: event.target.value,
									}))
								}
								placeholder="Optional import secret key"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCreateDialogOpen(false)}
							disabled={isCreatingWallet}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateWallet} disabled={isCreatingWallet}>
							{isCreatingWallet ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Wallet"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={trustlineDialogOpen} onOpenChange={setTrustlineDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Trustline</DialogTitle>
						<DialogDescription>
							Attach a supported asset to the selected company wallet.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Asset Code
							</label>
							<Input
								value={trustlineForm.asset_code}
								onChange={(event) =>
									setTrustlineForm((current) => ({
										...current,
										asset_code: event.target.value.toUpperCase(),
									}))
								}
								placeholder="USDC"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Asset Issuer
							</label>
							<Input
								value={trustlineForm.asset_issuer}
								onChange={(event) =>
									setTrustlineForm((current) => ({
										...current,
										asset_issuer: event.target.value,
									}))
								}
								placeholder="G..."
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setTrustlineDialogOpen(false)}
							disabled={isAddingTrustline}
						>
							Cancel
						</Button>
						<Button onClick={handleAddTrustline} disabled={isAddingTrustline}>
							{isAddingTrustline ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								"Add Trustline"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
