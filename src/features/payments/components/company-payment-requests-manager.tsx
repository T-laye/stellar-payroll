"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, MessageSquareText, XCircle } from "lucide-react";
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
} from "@/components/ui/dialog";
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
	useCompanyPaymentRequests,
	useReviewCompanyPaymentRequest,
} from "@/hooks/payment-request.hook";
import { usePaymentRequestStore } from "@/lib/stores/payment-request-store";
import {
	type PaymentRequest,
	type PaymentRequestStatus,
} from "@/services/payment-request.service";
import { formatStatDate, formatStatNumber } from "@/lib/utils/stats";

const requestStatuses: Array<PaymentRequestStatus | "all"> = [
	"all",
	"PENDING",
	"APPROVED",
	"REJECTED",
	"PAID",
];

export function CompanyPaymentRequestsManager({
	canReview,
}: {
	canReview: boolean;
}) {
	const [statusFilter, setStatusFilter] =
		useState<PaymentRequestStatus | "all">("all");
	const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
	const [reviewStatus, setReviewStatus] = useState<PaymentRequestStatus>("APPROVED");
	const [reviewNote, setReviewNote] = useState("");

	const requests = usePaymentRequestStore((state) => state.companyRequests);
	const { isPending: isLoadingRequests } = useCompanyPaymentRequests(statusFilter);
	const { mutateAsync: reviewRequest, isPending: isReviewing } =
		useReviewCompanyPaymentRequest();

	const stats = useMemo(
		() => ({
			total: requests.length,
			pending: requests.filter((request) => request.status === "PENDING").length,
			approved: requests.filter((request) => request.status === "APPROVED").length,
			rejected: requests.filter((request) => request.status === "REJECTED").length,
		}),
		[requests],
	);

	const openReviewDialog = (request: PaymentRequest) => {
		setSelectedRequest(request);
		setReviewStatus(request.status === "REJECTED" ? "REJECTED" : "APPROVED");
		setReviewNote(request.review_note ?? "");
	};

	const handleReview = async () => {
		if (!selectedRequest) {
			return;
		}

		try {
			await reviewRequest({
				requestId: selectedRequest.id,
				payload: {
					review_note: reviewNote.trim(),
					status: reviewStatus,
				},
			});
			toast.success("Payment request reviewed");
			setSelectedRequest(null);
			setReviewNote("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to review request.",
			);
		}
	};

	return (
		<>
			<div className="space-y-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-sm font-medium text-foreground">
							Company Payment Requests
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Review employee requests for missed or disputed payouts.
						</p>
					</div>

					<div className="w-full sm:w-52">
						<Select
							value={statusFilter}
							onValueChange={(value) =>
								setStatusFilter(value as PaymentRequestStatus | "all")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{requestStatuses.map((status) => (
									<SelectItem key={status} value={status}>
										{status === "all" ? "All Statuses" : status}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{ label: "Total Requests", value: stats.total, icon: MessageSquareText },
						{ label: "Pending", value: stats.pending, icon: Clock3 },
						{ label: "Approved", value: stats.approved, icon: CheckCircle2 },
						{ label: "Rejected", value: stats.rejected, icon: XCircle },
					].map((item) => {
						const Icon = item.icon;

						return (
							<Card key={item.label} className="p-4">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-xs text-muted-foreground">{item.label}</p>
										<p className="mt-2 text-2xl font-semibold text-foreground">
											{formatStatNumber(item.value)}
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

				<Card className="p-5 sm:p-6">
					{isLoadingRequests ? (
						<div className="space-y-3">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-20 w-full" />
						</div>
					) : requests.length === 0 ? (
						<EmptyState
							icon={MessageSquareText}
							title="No requests in this view"
							description="Switch filters or check back later as employees submit payment requests."
						/>
					) : (
						<div className="space-y-3">
							{requests.map((request) => (
								<div
									key={request.id}
									className="rounded-2xl border border-border bg-muted/20 p-4"
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-foreground">
													{request.amount} {request.currency}
												</p>
												<StatusBadge status={request.status.toLowerCase()} />
											</div>
											<p className="text-sm text-muted-foreground">
												{request.note}
											</p>
											<p className="text-xs text-muted-foreground">
												Employee ID: {request.employee_id}
											</p>
										</div>

										<div className="flex flex-col items-end gap-2">
											<div className="text-right text-xs text-muted-foreground">
												<p>Created {formatStatDate(request.created_at)}</p>
												<p>Updated {formatStatDate(request.updated_at)}</p>
											</div>

											{canReview && request.status === "PENDING" && (
												<Button
													size="sm"
													className="gap-2"
													onClick={() => openReviewDialog(request)}
												>
													<MessageSquareText className="h-4 w-4" />
													Review
												</Button>
											)}
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

			<Dialog
				open={Boolean(selectedRequest)}
				onOpenChange={(open) => !open && setSelectedRequest(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Review Payment Request</DialogTitle>
						<DialogDescription>
							Approve or reject this payment request and leave a note for the
							employee if needed.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Decision
							</label>
							<Select
								value={reviewStatus}
								onValueChange={(value) =>
									setReviewStatus(value as PaymentRequestStatus)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="APPROVED">Approve</SelectItem>
									<SelectItem value="REJECTED">Reject</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Review Note
							</label>
							<Textarea
								value={reviewNote}
								onChange={(event) => setReviewNote(event.target.value)}
								placeholder="Share any reasoning or next steps for the employee."
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setSelectedRequest(null)}
							disabled={isReviewing}
						>
							Cancel
						</Button>
						<Button onClick={handleReview} disabled={isReviewing}>
							{isReviewing ? "Saving..." : "Save Review"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
