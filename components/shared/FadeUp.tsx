import { useEffect, useRef, useState } from "react";

// ─── Shared: scroll-triggered fade-up ────────────────────────────────────────
export default function FadeUp({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ob = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setInView(true);
                    ob.disconnect();
                }
            },
            { threshold: 0.1 },
        );
        ob.observe(el);
        return () => ob.disconnect();
    }, []);
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}