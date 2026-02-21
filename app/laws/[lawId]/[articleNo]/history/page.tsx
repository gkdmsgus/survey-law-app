"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ArticleHistoryDiff from "@/components/laws/ArticleHistoryDiff";
import type { ArticleSnapshot } from "@/lib/api/types";
import { resolveToId, lawHref } from "@/lib/constants/laws";

export default function ArticleHistoryPage() {
  const { lawId: rawLawId, articleNo } = useParams<{
    lawId: string;
    articleNo: string;
  }>();
  const lawId = resolveToId(rawLawId); // 슬러그 → 실제 ID 변환
  const [snapshots, setSnapshots] = useState<ArticleSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/laws/article/${lawId}/${articleNo}/history`
        );
        const data = await res.json();
        setSnapshots(data.snapshots ?? []);
      } catch (e) {
        console.error("이력 로드 실패:", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (lawId && articleNo) load();
  }, [lawId, articleNo]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 브레드크럼 */}
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">홈</Link>
        {" / "}
        <Link href="/laws" className="hover:text-blue-600">법령</Link>
        {" / "}
        <Link href={lawHref(lawId)} className="hover:text-blue-600">법령 상세</Link>
        {" / "}
        <Link href={lawHref(lawId, articleNo)} className="hover:text-blue-600">
          제{articleNo}조
        </Link>
        {" / "}
        <span className="text-gray-900">개정이력</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          제{articleNo}조 개정이력 비교
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          조문을 방문할 때마다 스냅샷이 자동 저장됩니다.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {/* 버전 선택 드롭다운 영역 */}
            <div className="flex items-center gap-3">
              <div className="h-9 bg-gray-200 rounded-lg flex-1" />
              <div className="h-4 bg-gray-200 rounded w-4" />
              <div className="h-9 bg-gray-200 rounded-lg flex-1" />
            </div>
            {/* 구분선 */}
            <div className="h-px bg-gray-200" />
            {/* diff 본문 라인들 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="h-3.5 bg-gray-200 rounded shrink-0 w-4" />
                <div className="h-3.5 bg-gray-200 rounded" style={{ width: `${45 + (i * 23) % 50}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <ArticleHistoryDiff snapshots={snapshots} />
        )}
      </div>

      <Link
        href={lawHref(lawId, articleNo)}
        className="inline-block text-sm text-blue-600 hover:underline"
      >
        ← 조문으로 돌아가기
      </Link>
    </div>
  );
}
