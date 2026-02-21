"use client";

import { useState, useEffect, useCallback } from "react";
import type { Notification } from "../api/types";

export function useNotifications(
  notificationsEnabled: boolean = true,
  pollInterval: number = 30000
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      const res = await fetch(
        `/api/notifications${unreadOnly ? "?unread=true" : ""}`
      );
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e) {
      console.error("알림 로드 실패:", e);
    }
  }, []);

  // 초기 로드 + polling (enabled & interval 반영)
  useEffect(() => {
    if (!notificationsEnabled) return;
    fetchNotifications();
    const interval = setInterval(
      () => fetchNotifications(true),
      pollInterval
    );
    return () => clearInterval(interval);
  }, [fetchNotifications, notificationsEnabled, pollInterval]);

  const markAsRead = useCallback(async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
