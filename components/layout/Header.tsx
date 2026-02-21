"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { unreadCount } = useNotifications();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 px-4 h-14">
        {/* 로고 */}
        <Link
          href="/"
          className="font-bold text-blue-700 text-lg whitespace-nowrap shrink-0"
        >
          측량법령 조회
        </Link>

        {/* 검색바 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="법령명 또는 기준 검색 (예: 지적측량 허용오차)"
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
              🔍
            </span>
          </div>
        </form>

        {/* 알림 */}
        <Link
          href="/notifications"
          className="relative p-2 text-gray-600 hover:text-gray-900"
          title="알림"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
