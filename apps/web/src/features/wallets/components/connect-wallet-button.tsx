"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Wallet } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { toast } from "@repo/ui/sonner";
import { useIsPhone } from "@/features/wallets/device";
import { isStellarAddress } from "@/lib/stellar";

type KitModule = typeof import("@/features/wallets/stellar-kit");

/** Same list as `stellar-kit.ts`, kept here so the menu renders before the kit loads. */
const OPTIONS = [
	{ id: "freighter", name: "Freighter", kind: "Browser extension", phoneKind: "Freighter app · WalletConnect" },
	{ id: "albedo", name: "Albedo", kind: "Web wallet", phoneKind: "Web wallet" },
	{ id: "lobstr", name: "LOBSTR", kind: "Mobile wallet · WalletConnect", phoneKind: "LOBSTR app · WalletConnect" },
] as const;

/**
 * Fills a Stellar address from the person's own wallet (Freighter, Albedo, LOBSTR; phones pair
 * over WalletConnect) instead of pasting it. Only the public address is read. `onWalletConnect`
 * lets a dialog step aside while WalletConnect's modal is open: the modal mounts outside the
 * dialog, which would otherwise block its taps and steal its focus.
 */
export function ConnectWalletButton({
	onAddress,
	onWalletConnect,
	disabled,
	size = "sm",
}: {
	onAddress: (address: string) => void;
	onWalletConnect?: (open: boolean) => void;
	disabled?: boolean;
	size?: "sm" | "default";
}) {
	const phone = useIsPhone();
	const [pending, setPending] = useState<string | null>(null);

	const preload = () => void import("@/features/wallets/stellar-kit").then((kit) => kit.preloadWallets());

	const connect = async (walletId: (typeof OPTIONS)[number]["id"]) => {
		const viaWalletConnect = walletId === "lobstr" || (walletId === "freighter" && phone);
		setPending(walletId);
		if (viaWalletConnect) onWalletConnect?.(true);
		let kit: KitModule | null = null;
		try {
			kit = await import("@/features/wallets/stellar-kit");
			const address = await kit.fetchWalletAddress(walletId);
			if (!isStellarAddress(address)) throw new Error("The wallet returned an address PayOrbit can’t use.");
			onAddress(address);
			toast.success("Wallet address added");
		} catch (error) {
			if (!kit || !kit.isWalletDismissal(error)) {
				toast.error("Couldn’t connect the wallet", {
					description: kit ? kit.walletErrorMessage(error) : "Check your connection and try again.",
				});
			}
		} finally {
			setPending(null);
			if (viaWalletConnect) onWalletConnect?.(false);
		}
	};

	return (
		<DropdownMenu onOpenChange={(open) => open && preload()}>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="outline" size={size} className="shrink-0 gap-2" disabled={disabled || pending !== null}>
					{pending ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
					{pending ? "Waiting for wallet…" : "Connect wallet"}
					{!pending && <ChevronDown className="size-3.5 opacity-60" />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64">
				<DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
					Use the address from a Stellar wallet
				</DropdownMenuLabel>
				{OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.id}
						className="flex-col items-start gap-0.5 py-2"
						onSelect={() => void connect(option.id)}
					>
						<span className="font-medium">{option.name}</span>
						<span className="text-xs text-muted-foreground">{phone ? option.phoneKind : option.kind}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
