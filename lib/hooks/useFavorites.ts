"use client";

import { useState, useEffect, useCallback } from "react";
import type { Favorite } from "../api/types";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/favorites");
      const data = await res.json();
      setFavorites(data.favorites ?? []);
    } catch (e) {
      console.error("즐겨찾기 로드 실패:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

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
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawId, lawName, articleNo, articleTitle }),
      });
      if (res.ok) {
        await fetchFavorites();
      }
    },
    [fetchFavorites]
  );

  const removeFavorite = useCallback(
    async (id: number) => {
      await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    },
    []
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

  return {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refresh: fetchFavorites,
  };
}
