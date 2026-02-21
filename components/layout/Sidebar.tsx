"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/constants/laws";
import { useState, useRef } from "react";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/search", label: "검색", icon: "🔍" },
  { href: "/favorites", label: "즐겨찾기", icon: "⭐" },
  { href: "/notifications", label: "알림", icon: "🔔" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 스와이프 감지
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 60) setMobileOpen(false); // 왼쪽으로 60px 이상 스와이프 → 닫기
    touchStartX.current = null;
  };

  const sidebarContent = (
    <>
      {/* 기본 메뉴 */}
      <nav className="p-3 border-b border-gray-200">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 카테고리 트리 */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          측량 기준 찾기
        </p>
        {CATEGORY_TREE.map((node) => (
          <CategoryTreeNode key={node.id} node={node} onNavigate={() => setMobileOpen(false)} />
        ))}
      </div>

      {/* 법령 목록 바로가기 */}
      <div className="p-3 border-t border-gray-200 mt-auto">
        <Link
          href="/laws"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
        >
          <span>📚</span>
          전체 법령 목록
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* 모바일 햄버거 버튼 - 메뉴 닫혔을 때만 표시 */}
      {!mobileOpen && (
        <button
          className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-xl"
          onClick={() => setMobileOpen(true)}
          aria-label="메뉴 열기"
        >
          ☰
        </button>
      )}

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed left-0 top-0 z-50 w-72 h-full bg-white border-r border-gray-200 flex flex-col overflow-y-auto shadow-xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-blue-700">메뉴</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          {sidebarContent}
        </aside>
      )}

      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-gray-200 bg-gray-50 flex-col h-full overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  );
}

function CategoryTreeNode({ node, onNavigate }: { node: CategoryNode; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    const href = node.lawId ? `/laws/${node.lawId}` : "#";
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="flex items-center gap-1.5 pl-6 pr-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
      >
        <span className="text-gray-400">└</span>
        {node.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <span>{node.icon}</span>
        <span className="flex-1 text-left">{node.label}</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="ml-2">
          {node.children!.map((child) => (
            <CategoryTreeNode key={child.id} node={child} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
