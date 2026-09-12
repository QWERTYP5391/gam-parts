"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import type { ActionResponse } from "@/lib/types";

// Internal utility — not a Server Action
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link ?? null,
  });
}

const getNotificationsSchema = z.object({
  unreadOnly: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export async function getNotifications(
  input: z.infer<typeof getNotificationsSchema>,
): Promise<
  ActionResponse<{
    notifications: {
      id: string;
      type: string;
      title: string;
      message: string;
      link: string | null;
      isRead: boolean;
      createdAt: Date;
    }[];
    unreadCount: number;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = getNotificationsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { unreadOnly, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(notifications.userId, session.user.id)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const results = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const [unreadResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
      ),
    );

  return {
    success: true,
    data: {
      notifications: results,
      unreadCount: unreadResult?.count ?? 0,
    },
  };
}

const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export async function markNotificationRead(
  input: z.infer<typeof markNotificationReadSchema>,
): Promise<ActionResponse<{ id: string; isRead: true }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = markNotificationReadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, parsed.data.notificationId),
        eq(notifications.userId, session.user.id),
      ),
    )
    .returning({ id: notifications.id });

  if (result.length === 0) {
    return { success: false, error: "Notification not found" };
  }

  revalidatePath("/dashboard");
  return { success: true, data: { id: result[0]!.id, isRead: true } };
}
