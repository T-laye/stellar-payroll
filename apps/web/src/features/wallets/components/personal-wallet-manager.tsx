"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2, Send, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import DeleteDialog from "@/components/DeleteDialog";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { Textarea } from "@repo/ui/textarea";
import { hasAnyPermission, useAuthStore } from "@/features/auth/store";
import { useMyStats } from "@/features/stats/hooks";
import { ApiError } from "@/lib/api/client";
import {
	hasFreshWalletVerification,
	WALLET_PIN_WINDOW_MS,
	useChangeMyWalletPin,
	useDeleteMyWallet,
	useMyWalletDetails,
	useMyWalletPrivateKey,
	useSetMyWalletPin,
	useTransferFromMyWallet,
	useVerifyMyWalletPin,
} from "@/features/wallets/hooks";
import { useWalletStore } from "@/features/wallets/store";
import { formatMoney, formatStatDate, formatStatNumber } from "@/lib/format";
import { newIdempotencyKey } from "@/lib/api/request";
import { assetCode } from "@/lib/stellar";
import { StatCard } from "@/components/stat-card";

const VALID_PIN = /^\d{4,6}$/;

function formatDateTime(value: string | null | undefined) {
	if (!value) {
		return "Not available";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Not available";
	}

	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export function PersonalWalletManager() {
	const myWallet = useWalletStore((state) => state.myWallet);
	const myPrivateKey = useWalletStore((state) => state.myPrivateKey);
	const setMyPrivateKey = useWalletStore((state) => state.setMyPrivateKey);
	const queryClient = useQueryClient();
	const pinVerifiedAt = useWalletStore((state) => state.pinVerifiedAt);
	const hasVerifiedAccess = hasFreshWalletVerification(pinVerifiedAt);
	const canViewCompanyWallets = useAuthStore((state) => hasAnyPermission(state.user, ["wallets:read", "wallets:create", "wallets:manage"]));
	const [, setExpiredAt] = useState(0);
	const accessEndsAt = pinVerifiedAt ? new Date(pinVerifiedAt).getTime() + WALLET_PIN_WINDOW_MS : 0;

	// Lock the page when the window ends, instead of waiting for the next click to find out.
	useEffect(() => {
		if (!accessEndsAt) return;
		const timer = setTimeout(() => setExpiredAt(accessEndsAt), Math.max(0, accessEndsAt - Date.now()));
		return () => clearTimeout(timer);
	}, [accessEndsAt]);

	const myStatsQuery = useMyStats();
	const myWalletQuery = useMyWalletDetails(hasVerifiedAccess);
	const { mutateAsync: setWalletPin, isPending: isSettingPin } = useSetMyWalletPin();
	const { mutateAsync: changeWalletPin, isPending: isChangingPin } = useChangeMyWalletPin();
	const { mutateAsync: verifyWalletPin, isPending: isVerifyingPin } = useVerifyMyWalletPin();
	const { mutateAsync: transferFunds, isPending: isTransferring } = useTransferFromMyWallet();
	const { mutateAsync: deleteWallet, isPending: isDeletingWallet } = useDeleteMyWallet();

	const [verifyPin, setVerifyPin] = useState("");
	const [setPinDialogOpen, setSetPinDialogOpen] = useState(false);
	const [changePinDialogOpen, setChangePinDialogOpen] = useState(false);
	const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false);
	const [transferDialogOpen, setTransferDialogOpen] = useState(false);
	// One key per transfer: made when the dialog opens, renewed after a failure.
	const [transferKey, setTransferKey] = useState(newIdempotencyKey);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [shouldRevealPrivateKey, setShouldRevealPrivateKey] = useState(false);
	const [setPinForm, setSetPinForm] = useState({ pin: "" });
	const [changePinForm, setChangePinForm] = useState({
		current_pin: "",
		new_pin: "",
	});
	const [transferForm, setTransferForm] = useState({
		amount: "",
		asset: "USDC",
		destination: "",
		memo: "",
	});

	const privateKeyQuery = useMyWalletPrivateKey(shouldRevealPrivateKey && privateKeyDialogOpen);
	const myStats = myStatsQuery.data?.data;

	const copyToClipboard = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied`);
		} catch {
			toast.error(`Failed to copy ${label.toLowerCase()}`);
		}
	};

	const handleVerifyPin = async () => {
		if (!VALID_PIN.test(verifyPin.trim())) {
			toast.error("Your wallet PIN is 4 to 6 digits.");
			return;
		}

		try {
			await verifyWalletPin({ pin: verifyPin.trim() });
			toast.success("Wallet PIN verified", {
				description: "You can now access protected wallet actions.",
			});
			setVerifyPin("");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to verify PIN.");
		}
	};

	const handleSetPin = async () => {
		if (!VALID_PIN.test(setPinForm.pin.trim())) {
			toast.error("Choose a PIN of 4 to 6 digits.");
			return;
		}

		try {
			await setWalletPin({ pin: setPinForm.pin.trim() });
			toast.success("Wallet PIN saved");
			setSetPinDialogOpen(false);
			setSetPinForm({ pin: "" });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to save wallet PIN.");
		}
	};

	const handleChangePin = async () => {
		if (!changePinForm.current_pin.trim() || !changePinForm.new_pin.trim()) {
			toast.error("Both PIN fields are required.");
			return;
		}

		if (!VALID_PIN.test(changePinForm.new_pin.trim())) {
			toast.error("Choose a new PIN of 4 to 6 digits.");
			return;
		}

		try {
			await changeWalletPin({
				current_pin: changePinForm.current_pin.trim(),
				new_pin: changePinForm.new_pin.trim(),
			});
			toast.success("Wallet PIN changed");
			setChangePinDialogOpen(false);
			setChangePinForm({
				current_pin: "",
				new_pin: "",
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to change wallet PIN.");
		}
	};

	const handleTransfer = async () => {
		if (!transferForm.amount.trim() || !transferForm.destination.trim()) {
			toast.error("Amount and destination are required.");
			return;
		}

		try {
			await transferFunds({
				payload: {
					amount: transferForm.amount.trim(),
					asset: transferForm.asset.trim().toUpperCase(),
					destination: transferForm.destination.trim(),
					memo: transferForm.memo.trim() || undefined,
				},
				idempotencyKey: transferKey,
			});
			toast.success("Transfer submitted");
			setTransferDialogOpen(false);
			setTransferForm({
				amount: "",
				asset: "USDC",
				destination: "",
				memo: "",
			});
		} catch (error) {
			setTransferKey(newIdempotencyKey());
			toast.error(error instanceof Error ? error.message : "Failed to submit transfer.");
		}
	};

	const handleDeleteWallet = async () => {
		try {
			await deleteWallet();
			toast.success("Wallet removed");
			setDeleteDialogOpen(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to delete wallet.");
		}
	};

	return (
		<>
			<div className="space-y-5">
				<div>
					<p className="text-sm font-medium text-foreground">My Wallet</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Verify your PIN to inspect balances, reveal your custodial key, send funds, or remove the wallet from your profile.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard index={0} label="Total received" icon={Wallet} value={formatMoney(myStats?.total_received_all_time ?? 0)} />
					<StatCard
						index={1}
						label="This month"
						icon={Send}
						tone="info"
						value={formatMoney(myStats?.total_received_this_month ?? 0)}
					/>
					<StatCard
						index={2}
						label="Payments received"
						icon={CheckCircle2}
						tone="success"
						value={formatStatNumber(myStats?.total_payments_received)}
					/>
					<StatCard
						index={3}
						label="Last payment"
						icon={AlertCircle}
						tone="neutral"
						value={formatStatDate(myStats?.last_payment_at)}
					/>
				</div>

				<Card className="p-5 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h3 className="text-base font-semibold text-foreground">Protected Wallet Access</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								{hasVerifiedAccess
									? `PIN verified. Your wallet stays unlocked until ${new Date(accessEndsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`
									: "Verify your wallet PIN to unlock balances, private key access, transfers, and wallet removal."}
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button variant="outline" className="gap-2" onClick={() => setSetPinDialogOpen(true)}>
								<KeyRound className="h-4 w-4" />
								Set PIN
							</Button>
							<Button variant="outline" className="gap-2" onClick={() => setChangePinDialogOpen(true)}>
								<ShieldCheck className="h-4 w-4" />
								Change PIN
							</Button>
						</div>
					</div>

					{!hasVerifiedAccess && (
						<div className="mt-4 flex flex-wrap items-end gap-3">
							<div className="min-w-55 flex-1 space-y-1.5">
								<label className="text-sm font-medium text-foreground">Verify Wallet PIN</label>
								<Input
									type="password"
									inputMode="numeric"
									maxLength={6}
									value={verifyPin}
									onChange={(event) => setVerifyPin(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter") void handleVerifyPin();
									}}
									placeholder="Enter 4 to 6 digits"
								/>
							</div>
							<Button onClick={handleVerifyPin} disabled={isVerifyingPin}>
								{isVerifyingPin ? "Verifying..." : "Verify PIN"}
							</Button>
						</div>
					)}
				</Card>

				<Card className="p-5 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h3 className="text-base font-semibold text-foreground">Wallet Details</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Your linked employee wallet, balances, and protected wallet actions.
							</p>
						</div>
						{hasVerifiedAccess && myWallet && (
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									className="gap-2"
									onClick={() => {
										setShouldRevealPrivateKey(true);
										setPrivateKeyDialogOpen(true);
									}}
								>
									<KeyRound className="h-4 w-4" />
									View Private Key
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="gap-2"
									onClick={() => {
										setTransferKey(newIdempotencyKey());
										setTransferDialogOpen(true);
									}}
								>
									<Send className="h-4 w-4" />
									Transfer
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
									onClick={() => setDeleteDialogOpen(true)}
								>
									<Trash2 className="h-4 w-4" />
									Delete Wallet
								</Button>
							</div>
						)}
					</div>

					{!hasVerifiedAccess ? (
						<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
							Verify your wallet PIN above before viewing balances or using protected wallet actions.
						</div>
					) : myWalletQuery.isPending ? (
						<div className="mt-5 space-y-3">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-20 w-full" />
						</div>
					) : myWallet ? (
						<div className="mt-5 space-y-4">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">{myWallet.network}</Badge>
								<Badge variant="outline">{myWallet.wallet_type}</Badge>
								<Badge variant={myWallet.is_funded ? "secondary" : "outline"}>{myWallet.is_funded ? "Funded" : "Unfunded"}</Badge>
							</div>

							<div className="rounded-2xl border border-border bg-muted/20 p-4">
								<p className="text-xs text-muted-foreground">Stellar Address</p>
								<div className="mt-2 flex flex-wrap items-center gap-2">
									<p className="break-all font-mono text-sm text-foreground">{myWallet.stellar_address}</p>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 gap-1 px-2"
										onClick={() => copyToClipboard(myWallet.stellar_address, "Wallet address")}
									>
										<Copy className="h-3.5 w-3.5" />
										Copy
									</Button>
								</div>
								<p className="mt-2 text-xs text-muted-foreground">
									Created {formatDateTime(myWallet.created_at)} • Updated {formatDateTime(myWallet.updated_at)}
								</p>
							</div>

							<div>
								<p className="text-sm font-medium text-foreground">Balances</p>
								{myWallet.balances.length === 0 ? (
									<p className="mt-2 text-sm text-muted-foreground">No live balances were returned for this wallet yet.</p>
								) : (
									<div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
										{myWallet.balances.map((balance) => (
											<div key={`${balance.asset}-${balance.amount}`} className="rounded-xl bg-muted/40 p-3">
												<p className="text-xs text-muted-foreground">{assetCode(balance.asset)}</p>
												<p className="mt-1 text-lg font-semibold text-foreground">{balance.amount}</p>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					) : myWalletQuery.isError ? (
						<div className="mt-5">
							{myWalletQuery.error instanceof ApiError && myWalletQuery.error.status === 404 ? (
								<EmptyState
									icon={Wallet}
									title="No wallet linked to your account"
									description={
										canViewCompanyWallets
											? "This tab shows the wallet on your own employee record. Payroll pays from the company's wallets: see the Company wallets tab for their balances."
											: "Your wallet appears here once your employer links one to your employee record."
									}
								/>
							) : (
								<EmptyState
									icon={Wallet}
									title="Couldn't load your wallet"
									description={myWalletQuery.error instanceof Error ? myWalletQuery.error.message : "Please try again."}
									action={
										<Button variant="outline" size="sm" onClick={() => myWalletQuery.refetch()}>
											Try again
										</Button>
									}
								/>
							)}
						</div>
					) : null}
				</Card>
			</div>

			<Dialog open={setPinDialogOpen} onOpenChange={setSetPinDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Set Wallet PIN</DialogTitle>
						<DialogDescription>Create or replace the 4 to 6 digit PIN used for protected wallet actions.</DialogDescription>
					</DialogHeader>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">PIN</label>
						<Input
							type="password"
							maxLength={6}
							value={setPinForm.pin}
							onChange={(event) =>
								setSetPinForm({
									pin: event.target.value,
								})
							}
							placeholder="Enter 4 to 6 digits"
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setSetPinDialogOpen(false)} disabled={isSettingPin}>
							Cancel
						</Button>
						<Button onClick={handleSetPin} disabled={isSettingPin}>
							{isSettingPin ? "Saving..." : "Save PIN"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={changePinDialogOpen} onOpenChange={setChangePinDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Change Wallet PIN</DialogTitle>
						<DialogDescription>Verify your current PIN and choose a new one.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">Current PIN</label>
							<Input
								type="password"
								maxLength={6}
								value={changePinForm.current_pin}
								onChange={(event) =>
									setChangePinForm((current) => ({
										...current,
										current_pin: event.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">New PIN</label>
							<Input
								type="password"
								maxLength={6}
								value={changePinForm.new_pin}
								onChange={(event) =>
									setChangePinForm((current) => ({
										...current,
										new_pin: event.target.value,
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setChangePinDialogOpen(false)} disabled={isChangingPin}>
							Cancel
						</Button>
						<Button onClick={handleChangePin} disabled={isChangingPin}>
							{isChangingPin ? "Saving..." : "Change PIN"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={privateKeyDialogOpen}
				onOpenChange={(open) => {
					setPrivateKeyDialogOpen(open);
					if (!open) {
						setShouldRevealPrivateKey(false);
						// The key lives only while the dialog shows it: drop it from the store and the query cache.
						setMyPrivateKey(null);
						queryClient.removeQueries({ queryKey: ["wallets", "me", "private-key"] });
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Wallet Private Key</DialogTitle>
						<DialogDescription>Only custodial wallets managed by PayOrbit can reveal their secret key here.</DialogDescription>
					</DialogHeader>

					{privateKeyQuery.isPending ? (
						<div className="flex items-center gap-3 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Decrypting private key...
						</div>
					) : myPrivateKey ? (
						<div className="rounded-xl bg-muted/40 p-4">
							<p className="break-all font-mono text-sm text-foreground">{myPrivateKey}</p>
							<div className="mt-3 flex justify-end">
								<Button
									variant="outline"
									size="sm"
									className="gap-2"
									onClick={() => copyToClipboard(myPrivateKey, "Private key")}
								>
									<Copy className="h-4 w-4" />
									Copy
								</Button>
							</div>
						</div>
					) : (
						<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
							No custodial private key was returned for this wallet.
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Transfer Funds</DialogTitle>
						<DialogDescription>Send USDC or XLM from your custodial wallet to another Stellar address.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-foreground">Amount</label>
								<Input
									value={transferForm.amount}
									onChange={(event) =>
										setTransferForm((current) => ({
											...current,
											amount: event.target.value,
										}))
									}
									placeholder="25"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-foreground">Asset</label>
								<Input
									value={transferForm.asset}
									onChange={(event) =>
										setTransferForm((current) => ({
											...current,
											asset: event.target.value.toUpperCase(),
										}))
									}
									placeholder="USDC"
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">Destination</label>
							<Input
								value={transferForm.destination}
								onChange={(event) =>
									setTransferForm((current) => ({
										...current,
										destination: event.target.value,
									}))
								}
								placeholder="G..."
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">Memo</label>
							<Textarea
								value={transferForm.memo}
								onChange={(event) =>
									setTransferForm((current) => ({
										...current,
										memo: event.target.value,
									}))
								}
								placeholder="Optional memo for the recipient"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setTransferDialogOpen(false)} disabled={isTransferring}>
							Cancel
						</Button>
						<Button onClick={handleTransfer} disabled={isTransferring}>
							{isTransferring ? "Sending..." : "Send Funds"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Delete Wallet"
				description="This removes the wallet from your account. Custodial private keys will no longer be recoverable through PayOrbit."
				onConfirm={handleDeleteWallet}
				isLoading={isDeletingWallet}
			/>
		</>
	);
}
