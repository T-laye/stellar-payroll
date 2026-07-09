"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clock3, Plus, ReceiptText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateMyPaymentRequest,
	useMyPaymentRequests,
} from "@/hooks/payment-request.hook";
import { useMyStats } from "@/hooks/stats.hook";
import { usePaymentRequestStore } from "@/lib/stores/payment-request-store";
import { formatStatDate, formatStatLabel, formatStatNumber } from "@/lib/utils/stats";
import { type PaymentRequestCurrency } from "@/services/payment-request.service";

const paymentRequestCurrencies: Array<{
	label: string;
	value: PaymentRequestCurrency;
}> = [
	{ label: "USDC", value: "USDC" },
	{ label: "Stellar Lumens (XLM)", value: "XLM" },
];

export function MyPaymentRequestsManager() {
	const requests = usePaymentRequestStore((state) => state.myRequests);
	const { isPending: isLoadingRequests } = useMyPaymentRequests();
	const myStatsQuery = useMyStats();
	const { mutateAsync: createRequest, isPending: isCreatingRequest } =
		useCreateMyPaymentRequest();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState({
		amount: "",
		currency: "USDC" as PaymentRequestCurrency,
		note: "",
	});

	const pendingCount = useMemo(
		() => requests.filter((request) => request.status === "PENDING").length,
		[requests],
	);
	const myStats = myStatsQuery.data?.data;
	const myTransactionBreakdown = Object.entries(
		myStats?.transactions_by_status ?? {},
	);

	const handleCreateRequest = async () => {
		if (!form.amount.trim() || !form.note.trim()) {
			toast.error("Amount and note are required.");
			return;
		}

		const amount = Number(form.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			toast.error("Amount must be a positive number.");
			return;
		}

		try {
			await createRequest({
				amount: form.amount.trim(),
				currency: form.currency,
				note: form.note.trim(),
			});
			toast.success("Payment request submitted", {
				description: "Your request has been sent for admin review.",
			});
			setDialogOpen(false);
			setForm({
				amount: "",
				currency: "USDC",
				note: "",
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to submit request.",
			);
		}
	};

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-sm font-medium text-foreground">My Payments</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						Track your payment requests and request a payout review if you
						believe something was missed.
					</p>
				</div>

				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							Request Payment
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Request a Payment Review</DialogTitle>
							<DialogDescription>
								Let your payroll team know the amount you expected and why
								you&apos;re raising the request.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium text-foreground">
										Amount
									</label>
									<Input
										value={form.amount}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												amount: event.target.value,
											}))
										}
										placeholder="1500"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-sm font-medium text-foreground">
										Currency
									</label>
									<Select
										value={form.currency}
										onValueChange={(value) =>
											setForm((current) => ({
												...current,
												currency: value as PaymentRequestCurrency,
											}))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{paymentRequestCurrencies.map((currency) => (
												<SelectItem key={currency.value} value={currency.value}>
													{currency.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="text-sm font-medium text-foreground">
									Reason
								</label>
								<Textarea
									value={form.note}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											note: event.target.value,
										}))
									}
									placeholder="Describe the payment you expected and any context the reviewer should know."
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDialogOpen(false)}
								disabled={isCreatingRequest}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateRequest}
								disabled={isCreatingRequest}
							>
								{isCreatingRequest ? "Submitting..." : "Submit Request"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{
						label: "Total Received",
						value: myStats?.total_received_all_time ?? "--",
						icon: TrendingUp,
					},
					{
						label: "Received This Month",
						value: myStats?.total_received_this_month ?? "--",
						icon: ReceiptText,
					},
					{
						label: "Total Payments",
						value: formatStatNumber(myStats?.total_payments_received),
						icon: Clock3,
					},
					{
						label: "Pending Requests",
						value: formatStatNumber(pendingCount),
						icon: AlertCircle,
					},
				].map((item) => {
					const Icon = item.icon;

					return (
						<Card key={item.label} className="p-4">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs text-muted-foreground">{item.label}</p>
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

			{myTransactionBreakdown.length > 0 && (
				<Card className="p-5">
					<h3 className="text-sm font-semibold text-foreground">
						My Payment Breakdown
					</h3>
					<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						{myTransactionBreakdown.map(([status, count]) => (
							<div key={status} className="rounded-xl bg-muted/40 p-3">
								<p className="text-xs text-muted-foreground">
									{formatStatLabel(status)}
								</p>
								<p className="mt-1 text-lg font-semibold text-foreground">
									{formatStatNumber(count)}
								</p>
							</div>
						))}
					</div>
				</Card>
			)}

			<Card className="p-5 sm:p-6">
				<div className="mb-4 flex items-center justify-between gap-3">
					<div>
						<h3 className="text-base font-semibold text-foreground">
							My Payment Requests
						</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							Last payment date: {formatStatDate(myStats?.last_payment_at)}
						</p>
					</div>
				</div>

				{isLoadingRequests ? (
					<div className="space-y-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : requests.length === 0 ? (
					<EmptyState
						icon={ReceiptText}
						title="No payment requests yet"
						description="If you ever think a payout was missed, you can raise a request from here."
					/>
				) : (
					<div className="space-y-3">
						{requests.map((request) => (
							<div
								key={request.id}
								className="rounded-2xl border border-border bg-muted/20 p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-sm font-semibold text-foreground">
												{request.amount} {request.currency}
											</p>
											<StatusBadge status={request.status.toLowerCase()} />
										</div>
										<p className="mt-2 text-sm text-muted-foreground">
											{request.note}
										</p>
									</div>
									<div className="text-right text-xs text-muted-foreground">
										<p>Created {formatStatDate(request.created_at)}</p>
										<p>Updated {formatStatDate(request.updated_at)}</p>
									</div>
								</div>

								{request.review_note && (
									<div className="mt-3 rounded-xl bg-background p-3">
										<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
											Review Note
										</p>
										<p className="mt-1 text-sm text-foreground">
											{request.review_note}
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</Card>
		</div>
	);
}
