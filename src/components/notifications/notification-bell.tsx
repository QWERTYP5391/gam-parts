"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getNotifications,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = () => {
    startTransition(async () => {
      const result = await getNotifications({
        unreadOnly: false,
        page: 1,
        limit: 10,
      });
      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = (notificationId: string) => {
    startTransition(async () => {
      await markNotificationRead({ notificationId });
      loadNotifications();
    });
  };

  return (
    <div className="relative" data-testid="notification-bell">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        data-testid="notification-bell-button"
        className="relative"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground"
            data-testid="notification-count"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 rounded-md border bg-popover shadow-lg"
          data-testid="notification-dropdown"
        >
          <div className="border-b p-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b p-3 text-sm ${
                    n.isRead ? "opacity-60" : "bg-accent/30"
                  }`}
                  data-testid="notification-item"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-muted-foreground">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 text-xs text-primary hover:underline"
                        data-testid="notification-mark-read"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
