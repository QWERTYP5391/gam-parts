import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RequestForm } from "@/components/requests/request-form";

export default async function NewRequestPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "dealer") {
    redirect("/requests");
  }

  return (
    <div className="mx-auto max-w-2xl" data-testid="new-request-page">
      <Card>
        <CardHeader>
          <CardTitle>Create Part Request</CardTitle>
          <CardDescription>
            Describe the part you need and dealers will send you quotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
