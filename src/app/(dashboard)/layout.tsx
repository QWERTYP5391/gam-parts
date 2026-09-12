import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;

  const roleLabel =
    role === "vehicle_owner"
      ? "Vehicle Owner"
      : role === "mechanic"
        ? "Mechanic"
        : "Dealer";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card" data-testid="dashboard-header">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-lg font-semibold"
              data-testid="dashboard-logo"
            >
              GAM Parts
            </Link>
            <nav
              className="flex items-center gap-4 text-sm"
              data-testid="dashboard-nav"
            >
              {(role === "vehicle_owner" || role === "mechanic") && (
                <>
                  <Link
                    href="/search"
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="nav-search"
                  >
                    Find Parts
                  </Link>
                  <Link
                    href="/requests"
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="nav-requests"
                  >
                    My Requests
                  </Link>
                </>
              )}
              {role === "dealer" && (
                <>
                  <Link
                    href="/inventory"
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="nav-inventory"
                  >
                    Inventory
                  </Link>
                  <Link
                    href="/requests"
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="nav-requests"
                  >
                    Part Requests
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span
              className="text-sm text-muted-foreground"
              data-testid="dashboard-role-label"
            >
              {session.user.name} ({roleLabel})
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                data-testid="logout-button"
              >
                Log Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
