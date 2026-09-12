import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { partListings } from "@/lib/db/schema";
import { ListingForm } from "@/components/inventory/listing-form";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "dealer") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const listing = await db.query.partListings.findFirst({
    where: and(
      eq(partListings.id, id),
      eq(partListings.dealerId, session.user.id),
    ),
    with: {
      vehicles: true,
    },
  });

  if (!listing) {
    notFound();
  }

  const initialData = {
    listingId: listing.id,
    name: listing.name,
    description: listing.description ?? undefined,
    price: Number(listing.price),
    quantity: listing.quantity,
    condition: listing.condition,
    fulfillmentDays: listing.fulfillmentDays,
    vehicles: listing.vehicles.map((v) => ({
      make: v.make,
      model: v.model,
      yearFrom: v.yearFrom,
      yearTo: v.yearTo,
    })),
  };

  return (
    <div data-testid="inventory-edit-page" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Listing</h1>
        <p className="text-muted-foreground">
          Update your part listing details
        </p>
      </div>

      <ListingForm mode="edit" initialData={initialData} />
    </div>
  );
}
