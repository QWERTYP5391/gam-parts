import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1
          className="mb-4 text-4xl font-bold tracking-tight"
          data-testid="home-title"
        >
          GAM Parts
        </h1>
        <p
          className="mb-8 text-lg text-muted-foreground"
          data-testid="home-description"
        >
          The Gambia&apos;s digital marketplace for automotive spare parts.
          Connect with dealers, mechanics, and vehicle owners to find the parts
          you need.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            data-testid="home-login-link"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            data-testid="home-register-link"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
