import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/lib/actions/search";

interface SearchResultsProps {
  results: SearchResult[];
}

const conditionVariant: Record<
  "new" | "used" | "refurbished",
  "default" | "secondary" | "outline"
> = {
  new: "default",
  used: "secondary",
  refurbished: "outline",
};

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return `GMD ${num.toLocaleString("en-GM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-semibold">No results found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not find any parts matching your search. You can create a
          Part Request and dealers will reach out to you.
        </p>
        <Link
          href="/requests/new"
          className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Part Request
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((result) => (
        <Card key={result.id} data-testid="search-result-card">
          {result.images.length > 0 && (
            <div className="relative aspect-video overflow-hidden rounded-t-xl">
              <Image
                src={result.images[0]!.url}
                alt={result.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{result.name}</CardTitle>
              <Badge variant={conditionVariant[result.condition]}>
                {result.condition}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">
                  {formatPrice(result.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dealer</span>
                <span>{result.dealerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span>
                  {result.dealerTown}, {result.dealerRegion}
                </span>
              </div>
              {result.distanceKm !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span>{result.distanceKm} km</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Stock</span>
                <span>
                  {result.quantity} {result.quantity === 1 ? "unit" : "units"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fulfillment</span>
                <span>
                  {result.fulfillmentDays}{" "}
                  {result.fulfillmentDays === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match</span>
                <span>{Math.round(result.matchScore * 100)}%</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Updated {formatDate(result.updatedAt)}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
