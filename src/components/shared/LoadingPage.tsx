import Logo from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";

export default function LoadingPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-md rounded-4xl border border-border bg-card/95 p-10 text-center shadow-xl shadow-black/5 backdrop-blur-sm">
                <div className="mb-8 flex justify-center">
                    <Logo w="w-36" />
                </div>

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Spinner className="h-7 w-7 text-primary" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-foreground">Loading</h1>
                <p className="text-sm text-muted-foreground">
                    We&apos;re getting everything ready for you.
                </p>
            </div>
        </div>
    );
}
