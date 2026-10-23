"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/alert-dialog";
import { Button } from "@repo/ui/button";

/**
 * Asks before anything that moves money or can't be undone. Stays open while the action runs, so
 * the button can't be pressed twice.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	confirmLabel = "Confirm",
	tone = "default",
	loading,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: ReactNode;
	children?: ReactNode;
	confirmLabel?: string;
	tone?: "default" | "destructive";
	loading?: boolean;
	onConfirm: () => void;
}) {
	return (
		<AlertDialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && <AlertDialogDescription>{description}</AlertDialogDescription>}
				</AlertDialogHeader>
				{children}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<Button variant={tone === "destructive" ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
						{loading && <Loader2 className="animate-spin" />}
						{confirmLabel}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
