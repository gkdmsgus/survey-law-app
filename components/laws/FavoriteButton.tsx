"use client";

import { useFavorites } from "@/lib/hooks/useFavorites";

interface FavoriteButtonProps {
  lawId: string;
  lawName: string;
  articleNo?: string | null;
  articleTitle?: string | null;
}

export default function FavoriteButton({
  lawId,
  lawName,
  articleNo,
  articleTitle,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(lawId, articleNo);

  return (
    <button
      onClick={() => toggleFavorite(lawId, lawName, articleNo, articleTitle)}
      title={active ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border transition-colors ${
        active
          ? "bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span>{active ? "⭐" : "☆"}</span>
      {active ? "즐겨찾기 됨" : "즐겨찾기"}
    </button>
  );
}
