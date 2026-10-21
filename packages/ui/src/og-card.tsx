/**
 * The social preview card (1200×630) each app renders through `next/og` in its
 * `opengraph-image.tsx`. Inline styles only: the image renderer supports a subset of CSS and needs
 * `display: flex` on any element with more than one child. Brand from getpayorbit.com: deep night
 * #0D0020, purple #5501FF, cyan #00FFBB, magenta #FF00A6; Satoshi (static files in assets/fonts/static).
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

export interface OgCardProps {
	/** The white wordmark as a data URL (the app reads the file at build time). */
	logo: string;
	eyebrow: string;
	title: string;
	/** Optional second line of the title, in cyan. */
	highlight?: string;
	subtitle: string;
	/** The settled-payroll card on the right: the product's core moment. */
	showPayroll?: boolean;
}

const payouts = [
	{ initials: "CO", name: "Chidi Okonkwo", amount: "$3,200.00" },
	{ initials: "MR", name: "Maria Rodrigues", amount: "$2,400.00" },
	{ initials: "JM", name: "James Mercado", amount: "$1,900.00" },
];

export function OgCard({ logo, eyebrow, title, highlight, subtitle, showPayroll = true }: OgCardProps) {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				position: "relative",
				backgroundColor: "#0d0020",
				backgroundImage:
					"radial-gradient(circle at 92% 8%, rgba(255,0,166,0.28) 0%, rgba(13,0,32,0) 38%), radial-gradient(circle at 8% 100%, rgba(85,1,255,0.55) 0%, rgba(13,0,32,0) 50%)",
				fontFamily: "Satoshi",
				color: "#ffffff",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "56px 0 52px 64px",
					width: showPayroll ? 700 : 1072,
				}}
			>
				<img src={logo} width={200} height={44} alt="" />

				<div style={{ display: "flex", flexDirection: "column" }}>
					<div
						style={{
							display: "flex",
							alignSelf: "flex-start",
							alignItems: "center",
							gap: 10,
							fontSize: 20,
							fontWeight: 500,
							padding: "8px 18px",
							borderRadius: 999,
							border: "1px solid rgba(255,255,255,0.22)",
							backgroundColor: "rgba(255,255,255,0.06)",
						}}
					>
						<div style={{ display: "flex", width: 10, height: 10, borderRadius: 999, backgroundColor: "#00ffbb" }} />
						{eyebrow}
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							marginTop: 24,
							fontSize: 54,
							fontWeight: 700,
							lineHeight: 1.08,
							letterSpacing: -1.5,
						}}
					>
						<span>{title}</span>
						{highlight && <span style={{ color: "#00ffbb" }}>{highlight}</span>}
					</div>
					<div
						style={{
							display: "flex",
							marginTop: 20,
							fontSize: 24,
							fontWeight: 500,
							lineHeight: 1.4,
							maxWidth: 600,
							color: "rgba(255,255,255,0.72)",
						}}
					>
						{subtitle}
					</div>
				</div>

				<div style={{ display: "flex", gap: 34, fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
					<span>Settles in under 5s</span>
					<span>150+ countries</span>
					<span>USDC on Stellar</span>
				</div>
			</div>

			{showPayroll && (
				<div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, paddingRight: 64 }}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: 400,
							padding: 28,
							borderRadius: 28,
							backgroundColor: "#ffffff",
							color: "#1f1f1f",
							boxShadow: "0 30px 80px rgba(85,1,255,0.45)",
						}}
					>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div style={{ display: "flex", flexDirection: "column" }}>
								<span style={{ fontSize: 22, fontWeight: 700 }}>October Payroll</span>
								<span style={{ fontSize: 16, fontWeight: 500, color: "#6b7280", marginTop: 2 }}>24 employees · 11 countries</span>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									fontSize: 15,
									fontWeight: 700,
									color: "#12a150",
									padding: "5px 12px",
									borderRadius: 999,
									backgroundColor: "rgba(18,161,80,0.12)",
								}}
							>
								Settled
							</div>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								marginTop: 20,
								padding: 22,
								borderRadius: 20,
								backgroundColor: "#0d0020",
								color: "#ffffff",
							}}
						>
							<span style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>Total disbursed</span>
							<span style={{ fontSize: 40, fontWeight: 700, marginTop: 4, letterSpacing: -1 }}>$47,200.00</span>
							<div
								style={{
									display: "flex",
									marginTop: 14,
									height: 10,
									borderRadius: 999,
									backgroundColor: "rgba(255,255,255,0.12)",
								}}
							>
								<div
									style={{
										display: "flex",
										width: "92%",
										height: 10,
										borderRadius: 999,
										backgroundImage: "linear-gradient(90deg, #5501ff, #00ffbb, #ff00a6)",
									}}
								/>
							</div>
						</div>
						<div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
							{payouts.map((p) => (
								<div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											width: 34,
											height: 34,
											borderRadius: 999,
											fontSize: 13,
											fontWeight: 700,
											color: "#5501ff",
											backgroundColor: "rgba(85,1,255,0.1)",
										}}
									>
										{p.initials}
									</div>
									<span style={{ display: "flex", flex: 1, fontSize: 17, fontWeight: 500 }}>{p.name}</span>
									<span style={{ fontSize: 17, fontWeight: 700 }}>{p.amount}</span>
									<span style={{ fontSize: 15, fontWeight: 700, color: "#12a150", marginLeft: 8 }}>✓</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
