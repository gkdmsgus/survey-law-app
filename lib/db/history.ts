import { getSql } from "./schema";
import type { ArticleSnapshot } from "../api/types";

export async function saveArticleSnapshot(
  lawId: string,
  articleNo: string,
  content: string,
  revisionDate: string
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO article_snapshots (law_id, article_no, content, revision_date, snapshot_at)
    VALUES (${lawId}, ${articleNo}, ${content}, ${revisionDate}, ${Date.now()})
    ON CONFLICT (law_id, article_no, revision_date) DO NOTHING
  `;
}

export async function getArticleSnapshots(
  lawId: string,
  articleNo: string
): Promise<ArticleSnapshot[]> {
  const sql = getSql();
  const rows = await sql<Array<Record<string, unknown>>>`
    SELECT * FROM article_snapshots
    WHERE law_id = ${lawId} AND article_no = ${articleNo}
    ORDER BY snapshot_at DESC
  `;

  return rows.map((r) => ({
    id: r.id as number,
    lawId: r.law_id as string,
    articleNo: r.article_no as string,
    content: r.content as string,
    revisionDate: r.revision_date as string,
    snapshotAt: Number(r.snapshot_at),
  }));
}
