"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useSettingsContext } from "@/lib/providers/SettingsProvider";
import { relativeTime } from "@/lib/utils/date";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: session, status } = useSession();
  const { settings } = useSettingsContext();
  const { unreadCount, notifications, markAsRead, markAllRead, refresh } =
    useNotifications(
      settings.notificationsEnabled,
      settings.pollInterval * 1000
    );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleNotifOpen = () => {
    setNotifOpen((v) => {
      if (!v) refresh(); // 열릴 때 최신 데이터 fetch
      return !v;
    });
    setMenuOpen(false);
  };

  const handleNotifItemClick = async (id: number, lawId: string) => {
    await markAsRead(id);
    setNotifOpen(false);
    router.push(`/laws/${lawId}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center h-14 px-4">
        {/* 로고 - 왼쪽 고정 */}
        <Link
          href="/"
          className="font-bold text-blue-700 text-lg whitespace-nowrap shrink-0 mr-4"
        >
          측량법령 조회
        </Link>

        {/* 검색바 - 가운데 영역 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
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

        {/* 오른쪽 영역: 알림 + 로그인/계정 */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* 알림 (로그인 시만 표시) */}
          {session && (
            <>
              {/* 모바일: 페이지 이동 */}
              <Link
                href="/notifications"
                className="md:hidden relative p-2 text-gray-600 hover:text-gray-900"
                title="알림"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* 데스크탑: 드롭다운 패널 */}
              <div className="hidden md:block relative">
                <button
                  onClick={handleNotifOpen}
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                  title="알림"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    {/* 외부 클릭 닫기 */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotifOpen(false)}
                    />
                    {/* 드롭다운 패널 */}
                    <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            알림
                          </span>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>

                      {/* 알림 목록 */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <p className="text-2xl mb-2">🔔</p>
                            <p className="text-sm text-gray-400">
                              새로운 알림이 없습니다
                            </p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() =>
                                handleNotifItemClick(notif.id, notif.lawId)
                              }
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                                !notif.isRead ? "bg-blue-50" : "bg-white"
                              }`}
                            >
                              {/* 미읽음 파란 점 */}
                              <div className="mt-1.5 shrink-0">
                                {!notif.isRead ? (
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-transparent" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 leading-snug line-clamp-2">
                                  {notif.message}
                                </p>
                                {notif.oldRevisionDate &&
                                  notif.newRevisionDate && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {notif.oldRevisionDate} →{" "}
                                      {notif.newRevisionDate}
                                    </p>
                                  )}
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {relativeTime(notif.createdAt)}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* 하단: 전체 보기 */}
                      <div className="border-t border-gray-100">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="block text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          전체 알림 보기
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* 로그인/유저 영역 */}
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 rounded-full focus:outline-none"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "사용자"}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {session.user?.name?.[0] ?? "U"}
                  </div>
                )}
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      ⭐ 즐겨찾기
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      ⚙️ 설정
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
