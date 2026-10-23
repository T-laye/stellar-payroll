"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, MailOpen } from "lucide-react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, USE_MOCK_API, resetDemoData } from "@/lib/api/source";

/** Demo data only: the accounts to sign in with, and a way back to the original data. */
export function DemoAccountNote({ onPick }: { onPick: (email: string, password: string) => void }) {
	const [resetting, setResetting] = useState(false);
	if (!USE_MOCK_API) return null;

	const reset = async () => {
		setResetting(true);
		await resetDemoData();
		window.location.reload();
	};

	return (
		<div className="animate-rise mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
			<p className="flex items-center gap-2 font-semibold text-foreground">
				<FlaskConical className="h-4 w-4 text-primary" />
				Demo mode
			</p>
			<p className="mt-1 text-muted-foreground">
				Everything runs on sample data in your browser. Pick an account (password <strong className="text-foreground">{DEMO_PASSWORD}</strong> unless shown):
			</p>
			<ul className="mt-3 space-y-2">
				{DEMO_ACCOUNTS.map((account) => (
					<li key={account.email}>
						<button
							type="button"
							onClick={() => onPick(account.email, "password" in account ? account.password : DEMO_PASSWORD)}
							className="w-full cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50"
						>
							<span className="block font-medium text-foreground">
								{account.label} · <span className="break-all">{account.email}</span>
							</span>
							<span className="block text-xs text-muted-foreground">
								{account.description}
								{"password" in account && ` Password ${account.password}.`}
							</span>
						</button>
					</li>
				))}
			</ul>
			<button
				type="button"
				onClick={reset}
				disabled={resetting}
				className="mt-3 cursor-pointer text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
			>
				{resetting ? "Resetting…" : "Reset demo data"}
			</button>
		</div>
	);
}

/** Demo data only: there is no inbox, so open the link the email would have carried. */
export function DemoEmailLink({ href, label }: { href: string; label: string }) {
	if (!USE_MOCK_API) return null;
	return (
		<div className="animate-rise rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
			<p className="flex items-center gap-2 font-semibold text-foreground">
				<MailOpen className="h-4 w-4 text-primary" />
				Demo mode: no email is sent
			</p>
			<Link href={href} className="mt-1 inline-block font-medium text-primary underline underline-offset-4">
				{label}
			</Link>
		</div>
	);
}
