import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

export interface Crumb {
	label: string;
	href?: string;
}

/** Breadcrumbs, title, one line of context and the page's primary actions. */
export function PageHeader({
	title,
	description,
	breadcrumbs,
	actions,
	badge,
	className,
}: {
	title: ReactNode;
	description?: ReactNode;
	breadcrumbs?: Crumb[];
	actions?: ReactNode;
	badge?: ReactNode;
	className?: string;
}) {
	return (
		<header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
			<div className="min-w-0 space-y-1.5">
				{breadcrumbs && breadcrumbs.length > 0 && (
					<nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
						{breadcrumbs.map((crumb, index) => (
							<span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
								{index > 0 && <ChevronRight className="size-3" aria-hidden />}
								{crumb.href ? (
									<Link href={crumb.href} className="transition-colors hover:text-primary">
										{crumb.label}
									</Link>
								) : (
									<span className="text-foreground/80">{crumb.label}</span>
								)}
							</span>
						))}
					</nav>
				)}
				<div className="flex flex-wrap items-center gap-2.5">
					<h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
					{badge}
				</div>
				{description && <p className="text-sm text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
		</header>
	);
}
