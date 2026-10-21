import Logo from "@/components/Logo";
import { FOOTER } from "@/features/landing/content";
import { APP_LINKS } from "@/lib/site";

export function LandingFooter() {
	return (
		<footer className="border-t border-border bg-card">
			<div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
				<div className="space-y-4">
					<Logo w="w-36" />
					<p className="max-w-xs text-sm text-muted-foreground">
						Global payroll, powered by Stellar. Pay your team across borders with speed, security and simplicity.
					</p>
					<a href={APP_LINKS.signIn} className="inline-block text-sm font-medium text-primary hover:underline">
						Sign in to PayOrbit →
					</a>
				</div>
				{FOOTER.map((col) => (
					<div key={col.title}>
						<p className="text-sm font-semibold text-foreground">{col.title}</p>
						<ul className="mt-4 space-y-2.5">
							{col.links.map((link) => (
								<li key={link}>
									<a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
										{link}
									</a>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div className="border-t border-border">
				<div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<p>© {new Date().getFullYear()} PayOrbit.</p>
					<div className="flex gap-5">
						<a href="#" className="hover:text-foreground">
							Terms
						</a>
						<a href="#" className="hover:text-foreground">
							Privacy
						</a>
						<a href="mailto:support@payorbit.io" className="hover:text-foreground">
							support@payorbit.io
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
