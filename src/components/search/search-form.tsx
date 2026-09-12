"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const searchFormSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional(),
  ),
  sortBy: z
    .enum(["price", "distance", "availability", "relevance"])
    .default("relevance"),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export function SearchForm() {
  const [isPending, startTransition] = useTransition();
  const [searchParams, setSearchParams] = useQueryStates(
    {
      query: parseAsString.withDefault(""),
      vehicleMake: parseAsString,
      vehicleModel: parseAsString,
      vehicleYear: parseAsInteger,
      sortBy: parseAsString.withDefault("relevance"),
    },
    { shallow: false },
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema) as never,
    defaultValues: {
      query: searchParams.query ?? "",
      vehicleMake: searchParams.vehicleMake ?? "",
      vehicleModel: searchParams.vehicleModel ?? "",
      vehicleYear: searchParams.vehicleYear ?? undefined,
      sortBy:
        (searchParams.sortBy as SearchFormValues["sortBy"]) ?? "relevance",
    },
  });

  function onSubmit(data: SearchFormValues) {
    startTransition(() => {
      void setSearchParams({
        query: data.query || null,
        vehicleMake: data.vehicleMake || null,
        vehicleModel: data.vehicleModel || null,
        vehicleYear: data.vehicleYear || null,
        sortBy: data.sortBy || null,
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border bg-card p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-4">
          <Label htmlFor="query">Search Parts</Label>
          <Input
            id="query"
            placeholder="e.g. brake pads, alternator, fuel pump..."
            data-testid="search-query"
            {...register("query")}
          />
          {errors.query && (
            <p className="text-sm text-destructive">{errors.query.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleMake">Vehicle Make</Label>
          <Input
            id="vehicleMake"
            placeholder="e.g. Toyota"
            data-testid="search-make"
            {...register("vehicleMake")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleModel">Vehicle Model</Label>
          <Input
            id="vehicleModel"
            placeholder="e.g. Corolla"
            data-testid="search-model"
            {...register("vehicleModel")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleYear">Year</Label>
          <Input
            id="vehicleYear"
            type="number"
            placeholder="e.g. 2020"
            data-testid="search-year"
            {...register("vehicleYear", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select id="sortBy" data-testid="search-sort" {...register("sortBy")}>
            <option value="relevance">Relevance</option>
            <option value="price">Price (Low to High)</option>
            <option value="distance">Distance (Nearest)</option>
            <option value="availability">Availability</option>
          </Select>
        </div>
      </div>

      <Button type="submit" data-testid="search-submit" disabled={isPending}>
        {isPending ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
