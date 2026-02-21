"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LAW_MAP } from "@/lib/constants/laws";
import LawTypeBadge from "@/components/laws/LawTypeBadge";
import ChangeBadge from "@/components/laws/ChangeBadge";
import FavoriteButton from "@/components/laws/FavoriteButton";
import { formatLawDate } from "@/lib/utils/date";
import type { LawDetail, Article } from "@/lib/api/types";

export default function LawDetailPage() {
  const { lawId } = useParams<{ lawId: string }>();
  const [detail, setDetail] = useState<LawDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // 검색 시: 장/절 헤더 제외하고 조문만 필터링
  // 비검색 시: 전체 (헤더 포함) 표시
  const filteredArticles = detail?.articles.filter((a) => {
    if (!searchQuery) return true;
    if (a.isChapterHeader) return false; // 검색 중엔 장/절 헤더 숨김
    return (
      a.articleTitle.includes(searchQuery) ||
      a.content.includes(searchQuery) ||
      a.articleNo.includes(searchQuery)
    );
  });

  const filteredRealCount = filteredArticles?.filter(a => !a.isChapterHeader).length ?? 0;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 브레드크럼 */}
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          홈
        </Link>
        {" / "}
        <Link href="/laws" className="hover:text-blue-600">
          법령
        </Link>
        {" / "}
        <span className="text-gray-900">{detail.lawName}</span>
      </nav>

      {/* 법령 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
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
          </div>
          <FavoriteButton
            lawId={lawId}
            lawName={detail.lawName}
          />
        </div>
      </div>

      {/* 조문 검색 */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="조문 내용에서 검색..."
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 조문 목록 */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          전체 {realArticleCount}개 조문
          {searchQuery && ` · 검색 결과 ${filteredRealCount}개`}
        </p>
        {filteredArticles?.map((article, idx) =>
          article.isChapterHeader ? (
            <ChapterHeader
              key={`chapter-${idx}`}
              title={article.content}
            />
          ) : (
            <ArticleCard
              key={`${article.articleNo}-${idx}`}
              article={article}
              lawId={lawId}
              searchQuery={searchQuery}
            />
          )
        )}
        {filteredArticles?.filter(a => !a.isChapterHeader).length === 0 && searchQuery && (
          <p className="text-center text-gray-400 py-8">
            검색 결과가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

// 장/절/관 구분자 헤더 컴포넌트
function ChapterHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-2 mt-2">
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
  searchQuery,
}: {
  article: Article;
  lawId: string;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(false);

  // 검색어가 있으면 자동 확장
  useEffect(() => {
    if (searchQuery) setExpanded(true);
    else setExpanded(false);
  }, [searchQuery]);

  const highlight = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">
          제{article.articleNo}조
        </span>
        <span className="text-sm font-medium text-gray-900 flex-1 truncate">
          {highlight(article.articleTitle)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/laws/${lawId}/${article.articleNo}`}
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
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans mt-3">
            {searchQuery ? highlight(article.content) : article.content}
          </pre>
        </div>
      )}
    </div>
  );
}
