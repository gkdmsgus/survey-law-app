"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useSettingsContext } from "@/lib/providers/SettingsProvider";
import ChangeBadge from "@/components/laws/ChangeBadge";
import { formatTimestamp } from "@/lib/utils/date";
import { lawHref } from "@/lib/constants/laws";

export default function FavoritesPage() {
  const { favorites, isLoading, removeFavorite } = useFavorites();
  const { settings } = useSettingsContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-3">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">즐겨찾기</h1>
        <p className="text-sm text-gray-500 mt-1">
          자주 확인하는 법령 기준을 저장해 두세요.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">⭐</p>
          <p className="text-base">즐겨찾기된 항목이 없습니다.</p>
          <p className="text-sm mt-1">
            법령 조문 페이지에서 ☆ 버튼을 눌러 추가하세요.
          </p>
          <Link
            href="/laws"
            className="inline-block mt-4 text-blue-600 hover:underline text-sm"
          >
            법령 목록 보기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {[...favorites]
            .sort((a, b) => {
              if (settings.favoritesSort === "name") {
                return a.lawName.localeCompare(b.lawName, "ko");
              }
              // recent: 최근 추가순 (createdAt 내림차순)
              return b.createdAt - a.createdAt;
            })
            .map((fav) => (
            <div
              key={fav.id}
              className={`bg-white rounded-lg border p-4 flex items-start gap-3 ${
                fav.hasChanges ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {fav.hasChanges && <ChangeBadge isNew />}
                  <Link
                    href={lawHref(fav.lawId, fav.articleNo ?? undefined)}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
                  >
                    {fav.lawName}
                    {fav.articleNo && ` 제${fav.articleNo}조`}
                  </Link>
                </div>
                {fav.articleTitle && (
                  <p className="text-xs text-gray-500 truncate">
                    {fav.articleTitle}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  추가일: {formatTimestamp(fav.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {fav.hasChanges && (
                  <Link
                    href={
                      fav.articleNo
                        ? lawHref(fav.lawId, fav.articleNo, "history")
                        : lawHref(fav.lawId)
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    변경 확인
                  </Link>
                )}
                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  title="즐겨찾기 삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
