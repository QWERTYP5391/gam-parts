export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { partRequests, quotes, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { QuoteForm } from "@/components/requests/quote-form";
import { AcceptQuoteButton } from "./accept-quote-button";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "outline",
  quoted: "secondary",
  accepted: "default",
  fulfilled: "default",
};

const urgencyVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

const quoteStatusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  accepted: "default",
  declined: "destructive",
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const request = await db.query.partRequests.findFirst({
    where: eq(partRequests.id, id),
    with: {
      requester: true,
      quotes: {
        with: {
          dealer: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const isRequester = request.requesterId === session.user.id;
  const isDealer = session.user.role === "dealer";

  // Check if dealer already quoted
  const dealerQuote = isDealer
    ? request.quotes.find((q) => q.dealerId === session.user.id)
    : null;

  const canQuote =
    isDealer &&
    !dealerQuote &&
    request.status !== "accepted" &&
    request.status !== "fulfilled";

  return (
    <div className="space-y-6" data-testid="request-detail-page">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{request.partName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={urgencyVariant[request.urgency]}>
                {request.urgency} urgency
              </Badge>
              <Badge variant={statusVariant[request.status]}>
                {request.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(request.vehicleMake ||
            request.vehicleModel ||
            request.vehicleYear) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Vehicle
              </h3>
              <p className="text-sm">
                {[
                  request.vehicleMake,
                  request.vehicleModel,
                  request.vehicleYear,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            </div>
          )}

          {request.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Notes
              </h3>
              <p className="text-sm">{request.notes}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Requested by
            </h3>
            <p className="text-sm">{request.requester.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Posted
            </h3>
            <p className="text-sm">
              {request.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quotes section - visible to the requester */}
      {isRequester && request.quotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Quotes ({request.quotes.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {request.quotes.map((quote) => (
              <Card key={quote.id} data-testid="quote-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {quote.dealer.name}
                    </CardTitle>
                    <Badge variant={quoteStatusVariant[quote.status]}>
                      {quote.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-lg font-bold">
                      GMD {Number(quote.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Available
                    </span>
                    <span className="text-sm">
                      {quote.isAvailable ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fulfillment
                    </span>
                    <span className="text-sm">
                      {quote.fulfillmentDays} day
                      {quote.fulfillmentDays !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {quote.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Notes
                      </span>
                      <p className="text-sm">{quote.notes}</p>
                    </div>
                  )}
                </CardContent>
                {quote.status === "pending" &&
                  request.status !== "accepted" && (
                    <CardFooter>
                      <AcceptQuoteButton quoteId={quote.id} />
                    </CardFooter>
                  )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dealer's own quote */}
      {isDealer && dealerQuote && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Quote</h2>
          <Card data-testid="quote-card">
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-lg font-bold">
                  GMD {Number(dealerQuote.price).toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={quoteStatusVariant[dealerQuote.status]}>
                  {dealerQuote.status}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  Fulfillment
                </span>
                <span className="text-sm">
                  {dealerQuote.fulfillmentDays} day
                  {dealerQuote.fulfillmentDays !== 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quote form for dealers who haven't quoted yet */}
      {canQuote && (
        <div className="mx-auto max-w-md space-y-4">
          <h2 className="text-lg font-semibold">Submit a Quote</h2>
          <Card>
            <CardContent className="pt-6">
              <QuoteForm requestId={request.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
