"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { SearchFtsResult, SearchApiResult } from "@/lib/hooks/useSearch";
import { lawHref } from "@/lib/constants/laws";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [ftsResults, setFtsResults] = useState<SearchFtsResult[]>([]);
  const [apiResults, setApiResults] = useState<SearchApiResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("survey-law-recent-searches");
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [initialQuery]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/laws/search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      setFtsResults(data.ftsResults ?? []);
      setApiResults(data.apiResults ?? []);

      // 최근 검색어 저장
      const recent = JSON.parse(
        localStorage.getItem("survey-law-recent-searches") ?? "[]"
      ) as string[];
      const updated = [q.trim(), ...recent.filter((s) => s !== q.trim())].slice(
        0,
        10
      );
      localStorage.setItem(
        "survey-law-recent-searches",
        JSON.stringify(updated)
      );
      setRecentSearches(updated);
    } catch (e) {
      console.error("검색 실패:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    doSearch(query);
  };

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  const totalResults = ftsResults.length + apiResults.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">법령 검색</h1>

      {/* 검색 폼 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="법령명 또는 기준 검색 (예: 허용오차, GNSS 장비)"
          className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 최근 검색어 */}
      {!initialQuery && recentSearches.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">최근 검색어</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  router.push(`/search?q=${encodeURIComponent(s)}`);
                  doSearch(s);
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">검색 중...</div>
      )}

      {/* 결과 */}
      {!isLoading && initialQuery && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            &quot;{initialQuery}&quot; 검색 결과 총 {totalResults}건
          </p>

          {/* 조문 검색 결과 */}
          {ftsResults.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                조문 내용 ({ftsResults.length}건)
              </h2>
              <div className="space-y-2">
                {ftsResults.map((r, i) => (
                  <Link
                    key={i}
                    href={lawHref(r.lawId, r.articleNo)}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        제{r.articleNo}조
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {r.articleTitle
                          ? highlight(r.articleTitle, initialQuery)
                          : "(제목 없음)"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{r.lawName}</p>
                    <p
                      className="text-sm text-gray-600 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: r.content }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 법령명 검색 결과 */}
          {apiResults.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                법령 ({apiResults.length}건)
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {apiResults.map((r, i) => (
                  <Link
                    key={i}
                    href={lawHref(r.lawId)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {r.type}
                    </span>
                    <span className="text-sm text-gray-900 flex-1">
                      {highlight(r.lawName, initialQuery)}
                    </span>
                    <span className="text-blue-500 text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p>검색 결과가 없습니다.</p>
              <p className="text-xs mt-1">
                법령 캐시가 없으면 법령 페이지를 먼저 방문해주세요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
