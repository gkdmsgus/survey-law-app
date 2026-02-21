"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ChangeBadge from "@/components/laws/ChangeBadge";
import FavoriteButton from "@/components/laws/FavoriteButton";
import { formatLawDate } from "@/lib/utils/date";
import type { Article } from "@/lib/api/types";
import { resolveToId, lawHref } from "@/lib/constants/laws";

export default function ArticleDetailPage() {
  const { lawId: rawLawId, articleNo } = useParams<{
    lawId: string;
    articleNo: string;
  }>();
  const lawId = resolveToId(rawLawId); // 슬러그 → 실제 ID 변환
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/laws/article/${lawId}/${articleNo}`);
        if (!res.ok) throw new Error("조문 조회 실패");
        const data = await res.json();
        setArticle(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setIsLoading(false);
      }
    };
    if (lawId && articleNo) load();
  }, [lawId, articleNo]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-600">{error ?? "조문을 찾을 수 없습니다."}</p>
        <Link
          href={lawHref(lawId)}
          className="text-blue-600 text-sm mt-4 inline-block"
        >
          ← 법령으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 브레드크럼 */}
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">홈</Link>
        {" / "}
        <Link href="/laws" className="hover:text-blue-600">법령</Link>
        {" / "}
        <Link href={lawHref(lawId)} className="hover:text-blue-600">
          {article.lawName}
        </Link>
        {" / "}
        <span className="text-gray-900">제{article.articleNo}조</span>
      </nav>

      {/* 조문 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                제{article.articleNo}조
              </span>
              <ChangeBadge revisionDate={article.revisionDate} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {article.articleTitle || `제${article.articleNo}조`}
            </h1>
            <p className="text-xs text-gray-400">
              {article.lawName} · 개정일: {formatLawDate(article.revisionDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton
              lawId={lawId}
              lawName={article.lawName}
              articleNo={article.articleNo}
              articleTitle={article.articleTitle}
            />
            <Link
              href={lawHref(lawId, articleNo, "history")}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
            >
              개정이력
            </Link>
          </div>
        </div>
      </div>

      {/* 조문 본문 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-loose font-sans">
          {article.content}
        </pre>
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex justify-between text-sm">
        <Link
          href={lawHref(lawId)}
          className="text-blue-600 hover:underline"
        >
          ← 전체 조문 목록
        </Link>
        <Link
          href={lawHref(lawId, articleNo, "history")}
          className="text-gray-500 hover:text-gray-700"
        >
          개정이력 보기 →
        </Link>
      </div>
    </div>
  );
}
