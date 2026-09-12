import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/inventory/listing-form";

export default async function NewListingPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "dealer") {
    redirect("/dashboard");
  }

  return (
    <div data-testid="inventory-new-page" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Part</h1>
        <p className="text-muted-foreground">
          Create a new part listing for your inventory
        </p>
      </div>

      <ListingForm mode="create" />
    </div>
  );
}
