"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORY_TREE, type CategoryNode, resolveToId, lawHref } from "@/lib/constants/laws";
import { useState, useRef, useEffect, Suspense } from "react";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/quick-ref", label: "수치 참조", icon: "📊" },
  { href: "/calculator", label: "오차 계산기", icon: "📏" },
  { href: "/search", label: "검색", icon: "🔍" },
  { href: "/favorites", label: "즐겨찾기", icon: "⭐" },
  { href: "/notifications", label: "알림", icon: "🔔" },
];

function SidebarInner({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 법령 페이지의 lawId 추출 (/laws/[slug] 또는 /laws/[slug]/...)
  // 슬러그로 들어올 수 있으니 resolveToId로 실제 ID로 변환
  const lawIdMatch = pathname.match(/^\/laws\/([^/]+)/);
  const activeLawId = lawIdMatch ? resolveToId(lawIdMatch[1]) : null;
  // ?cat= 파라미터로 카테고리 아이템 구별
  const activeCatId = searchParams.get("cat");
  // 조문 상세/이력 페이지 (/laws/[id]/[articleNo] 또는 /laws/[id]/[articleNo]/history)
  // 이 경우엔 cat 파라미터 없이 lawId만 있으므로 사이드바 폴백 활성화 끔
  const isArticleDetailPage = !!pathname.match(/^\/laws\/[^/]+\/[^/]+/);

  const sidebarContent = (
    <>
      {/* 기본 메뉴 */}
      <nav className="p-3 border-b border-gray-200">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-500 pl-[9px]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 카테고리 트리 */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          측량 기준 찾기
        </p>
        {CATEGORY_TREE.map((node) => (
          <CategoryTreeNode
            key={node.id}
            node={node}
            activeLawId={activeLawId}
            activeCatId={activeCatId}
            isArticleDetailPage={isArticleDetailPage}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </div>

      {/* 법령 목록 바로가기 + 설정 */}
      <div className="p-3 border-t border-gray-200 mt-auto space-y-1">
        <Link
          href="/laws"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === "/laws"
              ? "bg-blue-50 text-blue-700 font-medium border-l-[3px] border-blue-500 pl-[9px]"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>📚</span>
          전체 법령 목록
        </Link>
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === "/settings"
              ? "bg-blue-50 text-blue-700 font-medium border-l-[3px] border-blue-500 pl-[9px]"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>⚙️</span>
          설정
        </Link>
      </div>
    </>
  );

  return <>{sidebarContent}</>;
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // 스와이프 감지
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 60) setMobileOpen(false);
    touchStartX.current = null;
  };

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
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
          <Suspense>
            <SidebarInner mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          </Suspense>
        </aside>
      )}

      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-gray-200 bg-gray-50 flex-col h-full overflow-y-auto">
        <Suspense>
          <SidebarInner mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        </Suspense>
      </aside>
    </>
  );
}

function CategoryTreeNode({
  node,
  activeLawId,
  activeCatId,
  isArticleDetailPage,
  onNavigate,
}: {
  node: CategoryNode;
  activeLawId: string | null;
  activeCatId: string | null;
  isArticleDetailPage: boolean;
  onNavigate: () => void;
}) {
  const hasChildren = node.children && node.children.length > 0;

  // 이 노드 하위에 현재 활성 카테고리가 있는지 확인
  // activeCatId가 있으면 catId 기준, 없으면 lawId 기준 (fallback)
  // 단, 조문 상세/이력 페이지에서는 cat 없는 lawId 폴백 사용 안 함 (중복 표시 방지)
  const isChildActive = hasChildren
    ? node.children!.some((child) =>
        activeCatId
          ? child.id === activeCatId
          : !isArticleDetailPage && child.lawId === activeLawId
      )
    : false;

  const [open, setOpen] = useState(isChildActive);

  // 활성 자식이 있으면 자동으로 열기
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (!hasChildren) {
    // 링크에 ?cat=노드id 추가해서 같은 lawId 내 카테고리를 구별 (슬러그 사용)
    const href = node.lawId ? `${lawHref(node.lawId)}?cat=${node.id}` : "#";
    // activeCatId가 있으면 catId로 판단, 없으면 lawId로 판단
    // 조문 상세 페이지에서는 cat 없는 폴백 끔 (중복 표시 방지)
    const isActive = activeCatId
      ? node.id === activeCatId
      : !isArticleDetailPage && node.lawId === activeLawId;
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-1.5 pl-5 pr-2 py-1.5 text-sm rounded-md transition-colors ${
          isActive
            ? "text-blue-700 font-semibold bg-blue-50 border-l-[3px] border-blue-500 pl-[17px]"
            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
        }`}
      >
        <span className={isActive ? "text-blue-400" : "text-gray-400"}>
          {isActive ? "▶" : "└"}
        </span>
        {node.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isChildActive
            ? "text-blue-700 bg-blue-50"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span>{node.icon}</span>
        <span className="flex-1 text-left">{node.label}</span>
        <span className={`text-xs ${isChildActive ? "text-blue-400" : "text-gray-400"}`}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div className="ml-2">
          {node.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              activeLawId={activeLawId}
              activeCatId={activeCatId}
              isArticleDetailPage={isArticleDetailPage}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
