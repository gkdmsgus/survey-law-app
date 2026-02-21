"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

// 서버 저장 즐겨찾기 (로그인 시)
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

// localStorage 기반 즐겨찾기 (비로그인 시)
const LOCAL_STORAGE_KEY = "survey-law-favorites-local";

function loadLocalFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Favorite[];
  } catch {
    return [];
  }
}

function saveLocalFavorites(favs: Favorite[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favs));
}

export function useFavorites() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  const fetchServerFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) {
        // 401 등 오류 시 빈 배열
        setFavorites([]);
        return;
      }
      const data = await res.json();
      setFavorites(data.favorites ?? []);
    } catch (e) {
      console.error("즐겨찾기 로드 실패:", e);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 세션 상태에 따라 서버 or 로컬 로드
  useEffect(() => {
    if (status === "loading") return; // 세션 로딩 중 대기

    if (isLoggedIn) {
      // 로그인 상태: 서버에서 즐겨찾기 로드
      fetchServerFavorites();
    } else {
      // 비로그인: localStorage에서 로드
      const local = loadLocalFavorites();
      setFavorites(local);
      setIsLoading(false);
    }
    loadedRef.current = true;
  }, [status, isLoggedIn, fetchServerFavorites]);

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
          throw new Error("즐겨찾기 추가 실패");
        }
        await fetchServerFavorites();
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
          saveLocalFavorites(updated);
          return updated;
        });
      }
    },
    [isLoggedIn, fetchServerFavorites]
  );

  const removeFavorite = useCallback(
    async (id: number | string) => {
      if (isLoggedIn) {
        // 로그인: 서버 삭제
        await fetch(`/api/favorites/${id}`, { method: "DELETE" });
        setFavorites((prev) => prev.filter((f) => f.id !== id));
      } else {
        // 비로그인: localStorage 삭제
        setFavorites((prev) => {
          const updated = prev.filter((f) => String(f.id) !== String(id));
          saveLocalFavorites(updated);
          return updated;
        });
      }
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
      await fetchServerFavorites();
    } else {
      setFavorites(loadLocalFavorites());
    }
  }, [isLoggedIn, fetchServerFavorites]);

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
