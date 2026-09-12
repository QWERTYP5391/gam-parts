"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deletePartListing } from "@/lib/actions/inventory";

interface DeleteListingButtonProps {
  listingId: string;
}

export function DeleteListingButton({ listingId }: DeleteListingButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePartListing({ listingId });
      if (!result.success) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
      data-testid="inventory-delete-button"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
