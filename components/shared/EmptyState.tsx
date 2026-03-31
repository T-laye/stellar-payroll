import { Card } from "../ui/card";

// ─── Shared: empty state ─────────────────────────────────────────────────────
export default function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<Card className="p-12 text-center">
			<div className="flex flex-col items-center gap-4">
				<div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
					<Icon className="h-7 w-7 text-muted-foreground" />
				</div>
				<div>
					<p className="font-semibold text-foreground">{title}</p>
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
				</div>
				{action}
			</div>
		</Card>
	);
}
