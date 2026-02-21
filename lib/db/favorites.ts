import { getSql } from "./schema";
import type { Favorite } from "../api/types";

export async function getAllFavorites(): Promise<Favorite[]> {
  const sql = getSql();
  const rows = await sql<Array<Record<string, unknown>>>`
    SELECT * FROM favorites ORDER BY created_at DESC
  `;
  return rows.map(mapFavorite);
}

export async function getFavoriteByArticle(
  lawId: string,
  articleNo: string | null
): Promise<Favorite | null> {
  const sql = getSql();
  const rows = articleNo
    ? await sql<Array<Record<string, unknown>>>`
        SELECT * FROM favorites WHERE law_id = ${lawId} AND article_no = ${articleNo}
      `
    : await sql<Array<Record<string, unknown>>>`
        SELECT * FROM favorites WHERE law_id = ${lawId} AND article_no IS NULL
      `;
  return rows[0] ? mapFavorite(rows[0]) : null;
}

export async function addFavorite(
  lawId: string,
  lawName: string,
  articleNo: string | null,
  articleTitle: string | null
): Promise<number> {
  const sql = getSql();
  const rows = await sql<Array<{ id: number }>>`
    INSERT INTO favorites (law_id, law_name, article_no, article_title, created_at)
    VALUES (${lawId}, ${lawName}, ${articleNo}, ${articleTitle}, ${Date.now()})
    RETURNING id
  `;
  return rows[0].id;
}

export async function removeFavorite(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM favorites WHERE id = ${id}`;
}

export async function markFavoritesChanged(
  lawId: string,
  oldRevDate: string,
  newRevDate: string
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE favorites
    SET has_changes = 1, last_checked_at = ${Date.now()}
    WHERE law_id = ${lawId}
  `;
}

export async function clearFavoriteChanges(id: number): Promise<void> {
  const sql = getSql();
  await sql`UPDATE favorites SET has_changes = 0 WHERE id = ${id}`;
}

function mapFavorite(row: Record<string, unknown>): Favorite {
  return {
    id: row.id as number,
    lawId: row.law_id as string,
    lawName: row.law_name as string,
    articleNo: (row.article_no as string) ?? null,
    articleTitle: (row.article_title as string) ?? null,
    createdAt: Number(row.created_at),
    lastCheckedAt: row.last_checked_at ? Number(row.last_checked_at) : null,
    hasChanges: Boolean(Number(row.has_changes)),
  };
}
