"use client";

import { useState, useEffect, useCallback } from "react";

export interface SearchFtsResult {
  lawId: string;
  lawName: string;
  articleNo: string;
  articleTitle: string;
  content: string;
}

export interface SearchApiResult {
  lawId: string;
  lawName: string;
  type: string;
}

export interface SearchResults {
  ftsResults: SearchFtsResult[];
  apiResults: SearchApiResult[];
}

const RECENT_SEARCHES_KEY = "survey-law-recent-searches";
const MAX_RECENT = 10;

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/laws/search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error("검색 실패:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query);
      } else {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const submitSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      // 최근 검색어 저장
      const updated = [
        q.trim(),
        ...recentSearches.filter((s) => s !== q.trim()),
      ].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      search(q);
    },
    [recentSearches, search]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    recentSearches,
    submitSearch,
    clearRecentSearches,
  };
}
