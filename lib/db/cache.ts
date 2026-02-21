import crypto from "crypto";
import { getSql } from "./schema";
import type { CachedLaw, LawDetail } from "../api/types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

export async function getCachedLaw(lawId: string): Promise<CachedLaw | null> {
  const sql = getSql();
  const rows = await sql<CachedLaw[]>`
    SELECT id, law_name as "lawName", content_json as "contentJson",
           revision_date as "revisionDate", cached_at as "cachedAt",
           content_hash as "contentHash"
    FROM law_cache WHERE id = ${lawId}
  `;
  return rows[0] ?? null;
}

export function isCacheValid(cached: CachedLaw): boolean {
  return Date.now() - Number(cached.cachedAt) < CACHE_TTL_MS;
}

export async function upsertLawCache(
  lawId: string,
  detail: LawDetail
): Promise<string> {
  const sql = getSql();
  const contentJson = JSON.stringify(detail);
  const contentHash = crypto
    .createHash("sha256")
    .update(contentJson)
    .digest("hex");

  await sql`
    INSERT INTO law_cache (id, law_name, content_json, revision_date, cached_at, content_hash)
    VALUES (${lawId}, ${detail.lawName}, ${contentJson}, ${detail.revisionDate}, ${Date.now()}, ${contentHash})
    ON CONFLICT(id) DO UPDATE SET
      law_name = EXCLUDED.law_name,
      content_json = EXCLUDED.content_json,
      revision_date = EXCLUDED.revision_date,
      cached_at = EXCLUDED.cached_at,
      content_hash = EXCLUDED.content_hash
  `;

  return contentHash;
}

export async function invalidateCache(lawId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM law_cache WHERE id = ${lawId}`;
}

export async function hashEqual(
  cached: CachedLaw,
  detail: LawDetail
): Promise<boolean> {
  const contentJson = JSON.stringify(detail);
  const newHash = crypto
    .createHash("sha256")
    .update(contentJson)
    .digest("hex");
  return cached.contentHash === newHash;
}

export async function searchArticlesFts(
  query: string,
  limit: number = 30
): Promise<
  Array<{
    lawId: string;
    lawName: string;
    articleNo: string;
    articleTitle: string;
    content: string;
  }>
> {
  // PostgreSQL에서는 FTS5 대신 ILIKE 또는 pg tsvector 사용
  // 간단한 구현: law_cache의 content_json에서 검색
  const sql = getSql();
  const rows = await sql<
    Array<{
      id: string;
      law_name: string;
      content_json: string;
    }>
  >`
    SELECT id, law_name, content_json
    FROM law_cache
    WHERE content_json ILIKE ${"%" + query + "%"}
    LIMIT ${limit * 3}
  `;

  const results: Array<{
    lawId: string;
    lawName: string;
    articleNo: string;
    articleTitle: string;
    content: string;
  }> = [];

  const lowerQuery = query.toLowerCase();

  for (const row of rows) {
    try {
      const detail = JSON.parse(row.content_json) as LawDetail;
      for (const article of detail.articles) {
        const text =
          (article.articleTitle ?? "") + " " + (article.content ?? "");
        if (text.toLowerCase().includes(lowerQuery)) {
          results.push({
            lawId: row.id,
            lawName: row.law_name,
            articleNo: article.articleNo,
            articleTitle: article.articleTitle ?? "",
            content: highlightSnippet(article.content ?? "", query),
          });
          if (results.length >= limit) break;
        }
      }
      if (results.length >= limit) break;
    } catch {
      // JSON 파싱 실패 무시
    }
  }

  return results;
}

function highlightSnippet(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 120) + "...";
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 80);
  const snippet = content.slice(start, end);
  return (start > 0 ? "..." : "") + snippet + (end < content.length ? "..." : "");
}
