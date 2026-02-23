"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { LAW_MAP, CATEGORY_TREE, resolveToId, lawHref } from "@/lib/constants/laws";
import LawTypeBadge from "@/components/laws/LawTypeBadge";
import ChangeBadge from "@/components/laws/ChangeBadge";
import FavoriteButton from "@/components/laws/FavoriteButton";
import { formatLawDate, formatTimestamp } from "@/lib/utils/date";
import { useSettingsContext } from "@/lib/providers/SettingsProvider";
import { useFavorites } from "@/lib/hooks/useFavorites";
import type { LawDetail, Article } from "@/lib/api/types";

export default function LawDetailPage() {
  const { lawId: rawLawId } = useParams<{ lawId: string }>();
  const lawId = resolveToId(rawLawId); // 슬러그 → 실제 ID 변환
  const searchParams = useSearchParams();
  const catId = searchParams.get("cat");
  const { settings } = useSettingsContext();
  const [detail, setDetail] = useState<LawDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIdx, setSearchResultIdx] = useState(0); // 현재 포커스된 검색 결과 인덱스
  const [tocOpen, setTocOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string>("");
  const articleRefs = useRef<Map<number, HTMLDivElement>>(new Map()); // 검색 결과 ref 맵

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/laws/${lawId}`);
        if (!res.ok) throw new Error("법령 조회 실패");
        const data = await res.json();
        setDetail(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setIsLoading(false);
      }
    };
    if (lawId) load();
  }, [lawId]);

  const lawInfo = LAW_MAP.get(lawId);

  // 실제 조문 수 (장/절 구분자 제외)
  const realArticleCount = detail?.articles.filter(a => !a.isChapterHeader).length ?? 0;

  // 장/절 헤더만 추출 (목차용)
  const chapterHeaders = detail?.articles.filter(a => a.isChapterHeader) ?? [];

  // 검색 시: 장/절 헤더 제외하고 조문만 필터링
  const filteredArticles = detail?.articles.filter((a) => {
    if (!searchQuery) return true;
    if (a.isChapterHeader) return false;
    return (
      a.articleTitle.includes(searchQuery) ||
      a.content.includes(searchQuery) ||
      a.articleNo.includes(searchQuery)
    );
  });

  // 검색 결과 조문만 (네비게이션용 - 헤더 제외)
  const searchResultArticles = filteredArticles?.filter(a => !a.isChapterHeader) ?? [];
  const filteredRealCount = searchResultArticles.length;

  // cat 파라미터 변경 시 해당 카테고리 label로 자동 검색
  useEffect(() => {
    if (!catId || !detail) return;
    for (const parent of CATEGORY_TREE) {
      const child = parent.children?.find(
        (c) => c.id === catId && c.lawId === lawId
      );
      if (child) {
        setSearchQuery(child.label);
        return;
      }
    }
  }, [catId, lawId, detail]);

  // 검색어 변경 시 인덱스 초기화 + 첫 결과로 스크롤
  useEffect(() => {
    setSearchResultIdx(0);
    articleRefs.current.clear();
  }, [searchQuery]);

  // 검색 결과 이동 (이전/다음)
  const goToResult = useCallback((idx: number) => {
    const total = filteredRealCount;
    if (total === 0) return;
    const next = (idx + total) % total;
    setSearchResultIdx(next);
    // 해당 조문으로 스크롤
    const el = articleRefs.current.get(next);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [filteredRealCount]);

  // 장/절 헤더 클릭 시 해당 위치로 스크롤
  const scrollToChapter = (title: string) => {
    const id = `chapter-${title.trim().replace(/\s+/g, "-")}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveChapter(title.trim());
    setTocOpen(false);
  };

  // 스크롤 시 현재 장/절 감지
  useEffect(() => {
    if (!chapterHeaders.length) return;
    const handleScroll = () => {
      const scrollY = window.scrollY ?? document.documentElement.scrollTop;
      let current = "";
      for (const ch of chapterHeaders) {
        const id = `chapter-${ch.content.trim().replace(/\s+/g, "-")}`;
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = ch.content.trim();
        }
      }
      setActiveChapter(current);
    };
    // main 스크롤 컨테이너 (layout의 overflow-y-auto main)
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
      return () => mainEl.removeEventListener("scroll", handleScroll);
    }
  }, [chapterHeaders]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 bg-gray-200 rounded w-6" />
          <div className="h-3.5 bg-gray-200 rounded w-1" />
          <div className="h-3.5 bg-gray-200 rounded w-8" />
          <div className="h-3.5 bg-gray-200 rounded w-1" />
          <div className="h-3.5 bg-gray-200 rounded w-32" />
        </div>
        {/* 법령 헤더 카드 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        {/* 검색바 */}
        <div className="h-10 bg-gray-200 rounded-lg" />
        {/* 조문 카드들 */}
        <div className="h-3.5 bg-gray-200 rounded w-20" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="h-5 bg-gray-200 rounded w-14 shrink-0" />
            <div className="h-4 bg-gray-200 rounded flex-1" style={{ width: `${55 + (i * 13) % 35}%` }} />
            <div className="h-4 bg-gray-200 rounded w-8 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-600">
          {error ?? "법령을 찾을 수 없습니다."}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          LAWGO_API_KEY가 설정되어 있는지 확인하세요.
        </p>
        <Link href="/laws" className="text-blue-600 text-sm mt-4 inline-block">
          ← 법령 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 목차 - 오른쪽 고정 (검색 중이 아닐 때만 표시) */}
      {!searchQuery && chapterHeaders.length > 0 && (
        <TableOfContents
          chapters={chapterHeaders}
          onClickChapter={scrollToChapter}
          isOpen={tocOpen}
          onToggle={() => setTocOpen(v => !v)}
          activeChapter={activeChapter}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 브레드크럼 */}
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">홈</Link>
          {" / "}
          <Link href="/laws" className="hover:text-blue-600">법령</Link>
          {" / "}
          <span className="text-gray-900">{detail.lawName}</span>
        </nav>

        {/* 법령 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-3 justify-between flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <LawTypeBadge type={lawInfo?.type ?? detail.lawType} />
                <ChangeBadge revisionDate={detail.revisionDate} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">{detail.lawName}</h1>
              <p className="text-sm text-gray-500">
                소관부처: {detail.department} ·{" "}
                개정일: {formatLawDate(detail.revisionDate)} ·{" "}
                시행일: {formatLawDate(detail.enforcementDate)}
              </p>
              {detail.cachedAt && (
                <p className="text-xs text-gray-400">
                  📡 법제처 기준 {formatTimestamp(detail.cachedAt)} 조회
                </p>
              )}
            </div>
            <FavoriteButton lawId={lawId} lawName={detail.lawName} />
          </div>
        </div>

        {/* 조문 검색 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.shiftKey ? goToResult(searchResultIdx - 1) : goToResult(searchResultIdx + 1);
                }
                if (e.key === "Escape") setSearchQuery("");
              }}
              placeholder="조문 내용 검색 (Enter: 다음, Shift+Enter: 이전)"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          {/* 이전/다음 버튼 (검색 중일 때만 표시) */}
          {searchQuery && filteredRealCount > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => goToResult(searchResultIdx - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 text-sm"
                title="이전 결과"
              >
                ▲
              </button>
              <span className="text-xs text-gray-500 w-14 text-center">
                {searchResultIdx + 1} / {filteredRealCount}
              </span>
              <button
                onClick={() => goToResult(searchResultIdx + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 text-sm"
                title="다음 결과"
              >
                ▼
              </button>
            </div>
          )}
        </div>

        {/* 조문 목록 */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            전체 {realArticleCount}개 조문
            {searchQuery && ` · 검색 결과 ${filteredRealCount}개`}
          </p>
          {(() => {
            let resultIdx = -1; // 검색 결과 조문 인덱스 카운터
            return filteredArticles?.map((article, idx) =>
              article.isChapterHeader ? (
                <ChapterHeader
                  key={`chapter-${idx}`}
                  title={article.content}
                />
              ) : (
                (() => {
                  if (searchQuery) resultIdx++;
                  const currentResultIdx = resultIdx;
                  const isFocused = searchQuery ? currentResultIdx === searchResultIdx : false;
                  return (
                    <ArticleCard
                      key={`${article.articleNo}-${idx}`}
                      article={article}
                      lawId={lawId}
                      lawName={detail.lawName}
                      searchQuery={searchQuery}
                      defaultExpanded={settings.articleExpanded}
                      isFocused={isFocused}
                      refCallback={(el) => {
                        if (el && searchQuery) articleRefs.current.set(currentResultIdx, el);
                      }}
                    />
                  );
                })()
              )
            );
          })()}
          {filteredRealCount === 0 && searchQuery && (
            <p className="text-center text-gray-400 py-8">
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 오른쪽 고정 목차 컴포넌트 (노션 스타일)
function TableOfContents({
  chapters,
  onClickChapter,
  isOpen,
  onToggle,
  activeChapter,
}: {
  chapters: Article[];
  onClickChapter: (title: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  activeChapter: string;
}) {
  // 장/절/관 들여쓰기 레벨 계산
  const getIndent = (title: string) => {
    const t = title.trim();
    if (t.startsWith("제") && t.includes("장")) return 0;
    if (t.startsWith("제") && t.includes("절")) return 1;
    if (t.startsWith("제") && t.includes("관")) return 2;
    return 0;
  };

  return (
    <>
      {/* ── 데스크탑: 오른쪽 고정, 호버 시 패널 슬라이드 ── */}
      <div className="hidden lg:block fixed right-0 top-1/3 z-30 group">
        {/* 평소: 짧은 선들만 표시 */}
        <div className="flex flex-col items-end gap-1 py-3 px-2 cursor-pointer group-hover:opacity-0 group-hover:pointer-events-none transition-opacity duration-200">
          {chapters.slice(0, Math.min(chapters.length, 8)).map((ch, i) => {
            const indent = getIndent(ch.content.trim());
            const isActive = activeChapter === ch.content.trim();
            return (
              <div
                key={i}
                style={{ width: `${28 - indent * 6}px` }}
                className={`h-[3px] rounded-full transition-colors ${
                  isActive ? "bg-gray-700" : "bg-gray-300"
                }`}
              />
            );
          })}
        </div>

        {/* 호버 시: 전체 패널 슬라이드 인 */}
        <div className="absolute right-0 top-0 w-52 bg-white border border-gray-200 rounded-l-xl shadow-xl overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-x-4 group-hover:translate-x-0">
          {/* 헤더 */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 tracking-wide">목차</span>
          </div>
          {/* 목차 항목 */}
          <div className="py-1.5 max-h-[60vh] overflow-y-auto">
            {chapters.map((ch, i) => {
              const title = ch.content.trim();
              const indent = getIndent(title);
              const isActive = activeChapter === title;
              return (
                <button
                  key={i}
                  onClick={() => onClickChapter(ch.content)}
                  style={{ paddingLeft: `${12 + indent * 12}px` }}
                  className={`w-full text-left text-xs py-1.5 pr-3 rounded-none transition-colors block leading-snug
                    ${isActive
                      ? "text-blue-600 font-semibold bg-blue-50 border-r-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }
                    ${indent === 0 ? "font-medium" : ""}
                  `}
                >
                  {indent > 0 && (
                    <span className="text-gray-300 mr-1">{"·".repeat(indent)}</span>
                  )}
                  {title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 모바일/태블릿: 하단 플로팅 버튼 + 팝업 ── */}
      <div className="lg:hidden fixed right-4 bottom-20 z-30">
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <div className="fixed inset-0 z-20" onClick={onToggle} />
            {/* 목차 팝업 */}
            <div className="absolute bottom-14 right-0 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
                </svg>
                <span className="text-xs font-semibold text-gray-500">목차</span>
              </div>
              <div className="py-1.5 max-h-64 overflow-y-auto">
                {chapters.map((ch, i) => {
                  const title = ch.content.trim();
                  const indent = getIndent(title);
                  const isActive = activeChapter === title;
                  return (
                    <button
                      key={i}
                      onClick={() => onClickChapter(ch.content)}
                      style={{ paddingLeft: `${12 + indent * 12}px` }}
                      className={`w-full text-left text-xs py-2 pr-3 transition-colors block leading-snug
                        ${isActive
                          ? "text-blue-600 font-semibold bg-blue-50 border-r-2 border-blue-500"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                        ${indent === 0 ? "font-medium" : ""}
                      `}
                    >
                      {indent > 0 && (
                        <span className="text-gray-300 mr-1">{"·".repeat(indent)}</span>
                      )}
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        {/* 플로팅 버튼 */}
        <button
          onClick={onToggle}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-colors
            ${isOpen ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}
          `}
          aria-label="목차"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
          </svg>
        </button>
      </div>
    </>
  );
}

// 장/절/관 구분자 헤더 컴포넌트 (id 추가로 스크롤 타겟 역할)
function ChapterHeader({ title }: { title: string }) {
  const id = `chapter-${title.trim().replace(/\s+/g, "-")}`;
  return (
    <div id={id} className="flex items-center gap-3 py-2 mt-2 scroll-mt-4">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap px-2">
        {title.trim()}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function ArticleCard({
  article,
  lawId,
  lawName,
  searchQuery,
  defaultExpanded = false,
  isFocused = false,
  refCallback,
}: {
  article: Article;
  lawId: string;
  lawName: string;
  searchQuery: string;
  defaultExpanded?: boolean;
  isFocused?: boolean;
  refCallback?: (el: HTMLDivElement | null) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [favWorking, setFavWorking] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isArticleFav = isFavorite(lawId, article.articleNo);

  useEffect(() => {
    if (searchQuery) setExpanded(true);
    else setExpanded(defaultExpanded);
  }, [searchQuery, defaultExpanded]);

  const handleFavClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favWorking) return;
    setFavWorking(true);
    try {
      await toggleFavorite(lawId, lawName, article.articleNo, article.articleTitle);
    } finally {
      setFavWorking(false);
    }
  };

  const highlight = (text: string) => {
    if (!searchQuery) return <>{text}</>;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 rounded px-0.5">{p}</mark>
          ) : (
            p
          )
        )}
      </>
    );
  };

  return (
    <div
      ref={refCallback}
      className={`rounded-xl overflow-hidden transition-all ${
        isFocused
          ? "ring-1 ring-blue-400 shadow-md shadow-blue-100 bg-white"
          : "shadow-sm hover:shadow-md bg-white"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${
          isFocused ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
        }`}>
          제{article.articleNo}조
        </span>
        <span className="text-sm font-medium text-gray-900 flex-1 truncate">
          {highlight(article.articleTitle)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {/* 조문 즐겨찾기 버튼 */}
          <button
            onClick={handleFavClick}
            disabled={favWorking}
            title={isArticleFav ? "즐겨찾기 해제" : "이 조문 즐겨찾기"}
            className={`text-base transition-colors disabled:opacity-50 ${
              isArticleFav ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
            }`}
          >
            {favWorking ? "⏳" : isArticleFav ? "⭐" : "☆"}
          </button>
          <Link
            href={lawHref(lawId, article.articleNo)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline"
          >
            상세
          </Link>
          <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="overflow-x-auto mt-3">
            <pre className="text-sm text-gray-700 whitespace-pre leading-relaxed font-sans min-w-0">
              {highlight(article.content)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
