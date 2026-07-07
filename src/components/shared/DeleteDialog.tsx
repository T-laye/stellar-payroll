import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

// ─── Shared: confirm delete dialog ───────────────────────────────────────────
export default function DeleteDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
	isLoading,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
	isLoading?: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
							<AlertTriangle className="h-5 w-5 text-destructive" />
						</div>
						<DialogTitle>{title}</DialogTitle>
					</div>
					<DialogDescription className="pl-13">{description}</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end gap-3 mt-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
						className="gap-2"
					>
						{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
