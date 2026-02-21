"use client";

import { relativeTime } from "@/lib/utils/date";
import type { Notification } from "@/lib/api/types";

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: number) => void;
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead && onRead) {
      onRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        notification.isRead
          ? "bg-white border-gray-200"
          : "bg-blue-50 border-blue-200 hover:bg-blue-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">
          {notification.isRead ? "📋" : "🔔"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug">
            {notification.message}
          </p>
          {notification.oldRevisionDate && notification.newRevisionDate && (
            <p className="text-xs text-gray-500 mt-1">
              {notification.oldRevisionDate} → {notification.newRevisionDate}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {relativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}
