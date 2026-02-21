"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";
import NotificationItem from "@/components/notifications/NotificationItem";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead } =
    useNotifications();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          <p className="text-sm text-gray-500 mt-1">
            즐겨찾기한 법령 기준의 개정 알림
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:underline"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🔔</p>
          <p className="text-base">알림이 없습니다.</p>
          <p className="text-sm mt-1">
            즐겨찾기한 법령이 개정되면 자동으로 알림을 받습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {unreadCount > 0 && (
            <p className="text-sm font-medium text-blue-600">
              읽지 않은 알림 {unreadCount}개
            </p>
          )}
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
