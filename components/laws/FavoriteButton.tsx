"use client";

import { useState } from "react";
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
  const [isWorking, setIsWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const active = isFavorite(lawId, articleNo);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleClick = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await toggleFavorite(lawId, lawName, articleNo, articleTitle);
      showToast(active ? "즐겨찾기에서 제거했습니다" : "즐겨찾기에 추가했습니다 ⭐");
    } catch {
      showToast("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isWorking}
        title={active ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
          active
            ? "bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <span>{isWorking ? "⏳" : active ? "⭐" : "☆"}</span>
        {active ? "즐겨찾기 됨" : "즐겨찾기"}
      </button>

      {/* 토스트 메시지 */}
      {toast && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-50">
          {toast}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
