import { searchParts } from "@/lib/actions/search";
import { SearchForm } from "@/components/search/search-form";
import { SearchResults } from "@/components/search/search-results";

interface SearchPageProps {
  searchParams: Promise<{
    query?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.query ?? "";
  const vehicleMake = params.vehicleMake;
  const vehicleModel = params.vehicleModel;
  const vehicleYear = params.vehicleYear
    ? parseInt(params.vehicleYear, 10)
    : undefined;
  const sortBy =
    (params.sortBy as "price" | "distance" | "availability" | "relevance") ??
    "relevance";
  const page = params.page ? parseInt(params.page, 10) : 1;

  let results = null;
  let suggestion: string | null = null;
  let total = 0;
  let totalPages = 0;

  if (query) {
    const response = await searchParts({
      query,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      sortBy,
      page,
      limit: 20,
    });

    if (response.success) {
      results = response.data.results;
      suggestion = response.data.suggestion;
      total = response.data.total;
      totalPages = response.data.totalPages;
    }
  }

  return (
    <div className="space-y-6" data-testid="search-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Parts</h1>
        <p className="text-muted-foreground">
          Find auto parts from dealers across The Gambia
        </p>
      </div>

      <SearchForm />

      {suggestion && query && (
        <p className="text-sm text-muted-foreground">
          Did you mean{" "}
          <a
            href={`/search?query=${encodeURIComponent(suggestion)}&sortBy=${sortBy}`}
            className="font-medium text-primary underline"
          >
            {suggestion}
          </a>
          ?
        </p>
      )}

      {query && results !== null && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "result" : "results"} found
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            )}
          </div>
          <SearchResults results={results} />
        </>
      )}
    </div>
  );
}
