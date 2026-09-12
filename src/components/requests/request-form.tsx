"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPartRequest } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const requestSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z
    .union([z.coerce.number().int().positive(), z.literal("")])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val)),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  notes: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export function RequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema) as never,
    defaultValues: {
      urgency: "medium",
    },
  });

  const onSubmit = (data: RequestFormData) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createPartRequest({
        partName: data.partName,
        vehicleMake: data.vehicleMake || undefined,
        vehicleModel: data.vehicleModel || undefined,
        vehicleYear: data.vehicleYear || undefined,
        urgency: data.urgency,
        notes: data.notes || undefined,
      });
      if (result.success) {
        router.push("/requests");
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      data-testid="request-form"
    >
      {serverError && (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="request-error"
        >
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="partName">Part Name</Label>
        <Input
          id="partName"
          {...register("partName")}
          data-testid="request-part-name"
          placeholder="e.g. Brake pads, alternator, side mirror"
        />
        {errors.partName && (
          <p className="text-sm text-destructive">{errors.partName.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="vehicleMake">Vehicle Make</Label>
          <Input
            id="vehicleMake"
            {...register("vehicleMake")}
            data-testid="request-make"
            placeholder="e.g. Toyota"
          />
          {errors.vehicleMake && (
            <p className="text-sm text-destructive">
              {errors.vehicleMake.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleModel">Vehicle Model</Label>
          <Input
            id="vehicleModel"
            {...register("vehicleModel")}
            data-testid="request-model"
            placeholder="e.g. Corolla"
          />
          {errors.vehicleModel && (
            <p className="text-sm text-destructive">
              {errors.vehicleModel.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleYear">Vehicle Year</Label>
          <Input
            id="vehicleYear"
            type="number"
            {...register("vehicleYear")}
            data-testid="request-year"
            placeholder="e.g. 2018"
          />
          {errors.vehicleYear && (
            <p className="text-sm text-destructive">
              {errors.vehicleYear.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="urgency">Urgency</Label>
        <Select
          id="urgency"
          {...register("urgency")}
          data-testid="request-urgency"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
        {errors.urgency && (
          <p className="text-sm text-destructive">{errors.urgency.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          data-testid="request-notes"
          placeholder="Any additional details about the part you need..."
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        data-testid="request-submit"
      >
        {isPending ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
