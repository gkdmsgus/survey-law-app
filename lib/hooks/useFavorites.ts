"use client";

import { useState, useEffect, useCallback } from "react";

// 즐겨찾기 타입 (localStorage + 서버 공용)
export interface Favorite {
  id: number | string;
  lawId: string;
  lawName: string;
  articleNo: string | null;
  articleTitle: string | null;
  createdAt: number;
  lastCheckedAt: number | null;
  hasChanges: boolean;
}

// localStorage 키
const LOCAL_KEY = "survey-law-favorites-v2";

function loadLocal(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Favorite[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(favs: Favorite[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favs));
  } catch {
    // 스토리지 가득 찬 경우 무시
  }
}

// /api/auth/session 으로 로그인 여부 확인 (next-auth useSession 미사용)
async function fetchSessionUserId(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user?.id as string) ?? null;
  } catch {
    return null;
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 초기화: 세션 확인 후 로컬 or 서버 로드
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const userId = await fetchSessionUserId();
        if (cancelled) return;

        if (userId) {
          setIsLoggedIn(true);
          const res = await fetch("/api/favorites");
          if (!cancelled && res.ok) {
            const data = await res.json();
            setFavorites(data.favorites ?? []);
          } else if (!cancelled) {
            setFavorites(loadLocal());
          }
        } else {
          setIsLoggedIn(false);
          setFavorites(loadLocal());
        }
      } catch {
        if (!cancelled) setFavorites(loadLocal());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const isFavorite = useCallback(
    (lawId: string, articleNo?: string | null) =>
      favorites.some(
        (f) =>
          f.lawId === lawId &&
          (articleNo ? f.articleNo === articleNo : !f.articleNo)
      ),
    [favorites]
  );

  const addFavorite = useCallback(
    async (
      lawId: string,
      lawName: string,
      articleNo?: string | null,
      articleTitle?: string | null
    ) => {
      if (isLoggedIn) {
        // 로그인: 서버 저장
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lawId, lawName, articleNo, articleTitle }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "즐겨찾기 추가 실패");
        }
        // 목록 다시 불러오기
        const listRes = await fetch("/api/favorites");
        if (listRes.ok) {
          const data = await listRes.json();
          setFavorites(data.favorites ?? []);
        }
      } else {
        // 비로그인: localStorage 저장
        const id = `local__${lawId}__${articleNo ?? ""}__${Date.now()}`;
        const newFav: Favorite = {
          id,
          lawId,
          lawName,
          articleNo: articleNo ?? null,
          articleTitle: articleTitle ?? null,
          createdAt: Date.now(),
          lastCheckedAt: null,
          hasChanges: false,
        };
        setFavorites((prev) => {
          const updated = [newFav, ...prev];
          saveLocal(updated);
          return updated;
        });
      }
    },
    [isLoggedIn]
  );

  const removeFavorite = useCallback(
    async (id: number | string) => {
      if (isLoggedIn) {
        const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
        if (!res.ok) {
          throw new Error("즐겨찾기 삭제 실패");
        }
      }
      // 로컬 상태 즉시 업데이트
      setFavorites((prev) => {
        const updated = prev.filter((f) => String(f.id) !== String(id));
        if (!isLoggedIn) saveLocal(updated);
        return updated;
      });
    },
    [isLoggedIn]
  );

  const toggleFavorite = useCallback(
    async (
      lawId: string,
      lawName: string,
      articleNo?: string | null,
      articleTitle?: string | null
    ) => {
      const existing = favorites.find(
        (f) =>
          f.lawId === lawId &&
          (articleNo ? f.articleNo === articleNo : !f.articleNo)
      );
      if (existing) {
        await removeFavorite(existing.id);
      } else {
        await addFavorite(lawId, lawName, articleNo, articleTitle);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const refresh = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites ?? []);
        }
      } catch {
        // 무시
      }
    } else {
      setFavorites(loadLocal());
    }
  }, [isLoggedIn]);

  return {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refresh,
  };
}
