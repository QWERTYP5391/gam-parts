export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { partListings } from "@/lib/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteListingButton } from "@/components/inventory/delete-listing-button";

function getStatus(isActive: boolean, quantity: number) {
  if (!isActive) return { label: "Inactive", variant: "secondary" as const };
  if (quantity === 0)
    return { label: "Out of Stock", variant: "destructive" as const };
  return { label: "Active", variant: "default" as const };
}

export default async function InventoryPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "dealer") {
    redirect("/dashboard");
  }

  const listings = await db.query.partListings.findMany({
    where: eq(partListings.dealerId, session.user.id),
    with: {
      images: true,
      vehicles: true,
    },
    orderBy: (partListings, { desc }) => [desc(partListings.updatedAt)],
  });

  return (
    <div data-testid="inventory-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your part listings</p>
        </div>
        <Link href="/inventory/new">
          <Button data-testid="inventory-add-button">Add Part</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Listings ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No listings yet. Add your first part to get started.
            </div>
          ) : (
            <Table data-testid="inventory-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => {
                  const status = getStatus(listing.isActive, listing.quantity);
                  return (
                    <TableRow key={listing.id} data-testid="inventory-row">
                      <TableCell className="font-medium">
                        {listing.name}
                      </TableCell>
                      <TableCell>
                        GMD {Number(listing.price).toFixed(2)}
                      </TableCell>
                      <TableCell>{listing.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {listing.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {listing.updatedAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/inventory/${listing.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <DeleteListingButton listingId={listing.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
