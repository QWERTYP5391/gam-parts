"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitQuote } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const quoteSchema = z.object({
  price: z.coerce.number().positive("Price must be positive"),
  isAvailable: z.boolean().default(true),
  fulfillmentDays: z.coerce
    .number()
    .int("Must be a whole number")
    .positive("Must be at least 1 day"),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  requestId: string;
}

export function QuoteForm({ requestId }: QuoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema) as never,
    defaultValues: {
      isAvailable: true,
      fulfillmentDays: 1,
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitQuote({
        requestId,
        price: data.price,
        isAvailable: data.isAvailable,
        fulfillmentDays: data.fulfillmentDays,
        notes: data.notes || undefined,
      });
      if (result.success) {
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      data-testid="quote-form"
    >
      {serverError && (
        <div
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="quote-error"
        >
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="price">Price (GMD)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...register("price")}
          data-testid="quote-price"
          placeholder="0.00"
        />
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="isAvailable"
          type="checkbox"
          {...register("isAvailable")}
          data-testid="quote-available"
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isAvailable">Part is currently available</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fulfillmentDays">Fulfillment Days</Label>
        <Input
          id="fulfillmentDays"
          type="number"
          {...register("fulfillmentDays")}
          data-testid="quote-fulfillment"
          placeholder="1"
        />
        {errors.fulfillmentDays && (
          <p className="text-sm text-destructive">
            {errors.fulfillmentDays.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          data-testid="quote-notes"
          placeholder="Any details about this quote..."
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
        data-testid="quote-submit"
      >
        {isPending ? "Submitting..." : "Submit Quote"}
      </Button>
    </form>
  );
}
