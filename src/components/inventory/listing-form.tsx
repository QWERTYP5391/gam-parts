"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addPartListing, updatePartListing } from "@/lib/actions/inventory";

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  yearFrom: z.number().int().min(1900, "Invalid year"),
  yearTo: z.number().int().min(1900, "Invalid year"),
});

const listingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  condition: z.enum(["new", "used", "refurbished"]),
  fulfillmentDays: z.number().int().positive("Must be at least 1 day"),
  vehicles: z.array(vehicleSchema).min(1, "At least one vehicle is required"),
});

type ListingFormValues = z.infer<typeof listingFormSchema>;

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: ListingFormValues & { listingId?: string };
}

export function ListingForm({ mode, initialData }: ListingFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      condition: "new",
      fulfillmentDays: 1,
      vehicles: [{ make: "", model: "", yearFrom: 2020, yearTo: 2024 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "vehicles",
  });

  async function onSubmit(data: ListingFormValues) {
    setServerError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const result = await addPartListing(data);
        if (!result.success) {
          setServerError(result.error);
          return;
        }
      } else {
        if (!initialData?.listingId) {
          setServerError("Missing listing ID for update");
          return;
        }
        const result = await updatePartListing({
          listingId: initialData.listingId,
          ...data,
        });
        if (!result.success) {
          setServerError(result.error);
          return;
        }
      }
      router.push("/inventory");
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Part Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              data-testid="listing-name"
              {...register("name")}
              placeholder="Part name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid="listing-description"
              {...register("description")}
              placeholder="Part description (optional)"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (GMD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                data-testid="listing-price"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                data-testid="listing-quantity"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                id="condition"
                data-testid="listing-condition"
                {...register("condition")}
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </Select>
              {errors.condition && (
                <p className="text-sm text-destructive">
                  {errors.condition.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfillmentDays">Fulfillment Days</Label>
              <Input
                id="fulfillmentDays"
                type="number"
                data-testid="listing-fulfillment"
                {...register("fulfillmentDays", { valueAsNumber: true })}
              />
              {errors.fulfillmentDays && (
                <p className="text-sm text-destructive">
                  {errors.fulfillmentDays.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compatible Vehicles</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="listing-add-vehicle"
              onClick={() =>
                append({ make: "", model: "", yearFrom: 2020, yearTo: 2024 })
              }
            >
              Add Vehicle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.vehicles?.root && (
            <p className="text-sm text-destructive">
              {errors.vehicles.root.message}
            </p>
          )}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-end gap-3 rounded-md border p-3"
            >
              <div className="flex-1 space-y-2">
                <Label>Make</Label>
                <Input
                  data-testid="listing-vehicle-make"
                  {...register(`vehicles.${index}.make`)}
                  placeholder="e.g. Toyota"
                />
                {errors.vehicles?.[index]?.make && (
                  <p className="text-sm text-destructive">
                    {errors.vehicles[index].make.message}
                  </p>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label>Model</Label>
                <Input
                  data-testid="listing-vehicle-model"
                  {...register(`vehicles.${index}.model`)}
                  placeholder="e.g. Corolla"
                />
                {errors.vehicles?.[index]?.model && (
                  <p className="text-sm text-destructive">
                    {errors.vehicles[index].model.message}
                  </p>
                )}
              </div>
              <div className="w-24 space-y-2">
                <Label>Year From</Label>
                <Input
                  type="number"
                  data-testid="listing-vehicle-year-from"
                  {...register(`vehicles.${index}.yearFrom`, {
                    valueAsNumber: true,
                  })}
                />
                {errors.vehicles?.[index]?.yearFrom && (
                  <p className="text-sm text-destructive">
                    {errors.vehicles[index].yearFrom.message}
                  </p>
                )}
              </div>
              <div className="w-24 space-y-2">
                <Label>Year To</Label>
                <Input
                  type="number"
                  data-testid="listing-vehicle-year-to"
                  {...register(`vehicles.${index}.yearTo`, {
                    valueAsNumber: true,
                  })}
                />
                {errors.vehicles?.[index]?.yearTo && (
                  <p className="text-sm text-destructive">
                    {errors.vehicles[index].yearTo.message}
                  </p>
                )}
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="listing-submit"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Listing"
              : "Update Listing"}
        </Button>
      </div>
    </form>
  );
}
