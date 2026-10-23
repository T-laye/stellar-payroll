/** Re-mounts on every navigation, so each page settles in with the same short fade. */
export default function Template({ children }: { children: React.ReactNode }) {
	return <div className="animate-page">{children}</div>;
}
