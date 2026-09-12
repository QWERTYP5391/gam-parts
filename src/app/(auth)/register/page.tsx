import Link from "next/link";
import { db } from "@/lib/db";
import { towns } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegisterPage() {
  const allTowns = await db
    .select({ id: towns.id, name: towns.name, region: towns.region })
    .from(towns)
    .orderBy(asc(towns.name));

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle data-testid="register-title">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm towns={allTowns} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline"
              data-testid="register-login-link"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
