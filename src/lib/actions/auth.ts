"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import type { ActionResponse } from "@/lib/types";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(1, "Phone is required"),
  role: z.enum(["vehicle_owner", "mechanic", "dealer"]),
  townId: z.number().int().positive(),
});

export async function registerUser(
  input: z.infer<typeof registerSchema>,
): Promise<ActionResponse<{ id: string; email: string; role: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { email, password, name, phone, role, townId } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return {
      success: false,
      error: "Email already in use",
      fieldErrors: { email: ["Email already in use"] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      phone,
      role,
      townId,
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!newUser) {
    return { success: false, error: "Failed to create account" };
  }

  revalidatePath("/dashboard");
  return { success: true, data: newUser };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function loginUser(
  input: z.infer<typeof loginSchema>,
): Promise<ActionResponse<{ id: string; email: string; role: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const user = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    return {
      success: true,
      data: { id: user.id, email: user.email, role: user.role },
    };
  } catch {
    return { success: false, error: "Invalid email or password" };
  }
}
