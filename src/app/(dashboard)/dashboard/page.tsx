import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, name } = session.user;

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <h1 className="text-2xl font-bold" data-testid="dashboard-welcome">
        Welcome, {name}
      </h1>

      {(role === "vehicle_owner" || role === "mechanic") && (
        <div
          className="grid gap-4 sm:grid-cols-2"
          data-testid="dashboard-buyer-section"
        >
          <Card>
            <CardHeader>
              <CardTitle>Find a Part</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Search dealer inventories for the spare parts you need.
              </p>
              <Link
                href="/search"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                data-testid="dashboard-search-link"
              >
                Search Parts
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Part Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Can&apos;t find what you need? Create a request and let dealers
                come to you.
              </p>
              <Link
                href="/requests"
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
                data-testid="dashboard-requests-link"
              >
                View Requests
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {role === "mechanic" && (
        <Card data-testid="dashboard-mechanic-section">
          <CardHeader>
            <CardTitle>Client Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Search for parts and create requests on behalf of your clients.
            </p>
          </CardContent>
        </Card>
      )}

      {role === "dealer" && (
        <div
          className="grid gap-4 sm:grid-cols-2"
          data-testid="dashboard-dealer-section"
        >
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Manage your parts inventory — add, edit, and track listings.
              </p>
              <Link
                href="/inventory"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                data-testid="dashboard-inventory-link"
              >
                Manage Inventory
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Incoming Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                View part requests from vehicle owners and mechanics looking for
                parts.
              </p>
              <Link
                href="/requests"
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
                data-testid="dashboard-requests-link"
              >
                View Requests
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
