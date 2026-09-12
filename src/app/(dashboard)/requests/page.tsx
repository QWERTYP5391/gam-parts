export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { partRequests } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function RequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;
  const isRequester = role === "vehicle_owner" || role === "mechanic";

  let requests;

  if (isRequester) {
    requests = await db
      .select()
      .from(partRequests)
      .where(eq(partRequests.requesterId, session.user.id))
      .orderBy(desc(partRequests.createdAt));
  } else {
    // Dealers see open and quoted requests
    requests = await db
      .select()
      .from(partRequests)
      .where(inArray(partRequests.status, ["open", "quoted"]))
      .orderBy(desc(partRequests.createdAt));
  }

  return (
    <div className="space-y-6" data-testid="requests-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isRequester ? "My Part Requests" : "Incoming Part Requests"}
        </h1>
        {isRequester && (
          <Link href="/requests/new">
            <Button data-testid="new-request-button">New Request</Button>
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isRequester
              ? "You have no part requests yet. Create one to get quotes from dealers."
              : "No open part requests at the moment."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="block"
            >
              <Card
                className="transition-colors hover:bg-accent/50"
                data-testid="request-row"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {request.partName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={urgencyVariant[request.urgency]}>
                        {request.urgency}
                      </Badge>
                      <Badge variant={statusVariant[request.status]}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {request.vehicleMake && (
                      <span>
                        {request.vehicleMake}
                        {request.vehicleModel ? ` ${request.vehicleModel}` : ""}
                        {request.vehicleYear ? ` (${request.vehicleYear})` : ""}
                      </span>
                    )}
                    <span>
                      Posted{" "}
                      {request.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
