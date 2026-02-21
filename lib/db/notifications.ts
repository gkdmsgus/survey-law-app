import { getSql } from "./schema";
import type { Notification } from "../api/types";

export async function createChangeNotification(
  lawId: string,
  lawName: string,
  articleNo: string | null,
  oldRevDate: string | null,
  newRevDate: string | null,
  favoriteId: number | null = null
): Promise<void> {
  const sql = getSql();
  const message = `${lawName}${articleNo ? ` 제${articleNo}조` : ""} 내용이 개정되었습니다. (${oldRevDate ?? "이전"} → ${newRevDate ?? "최신"})`;

  await sql`
    INSERT INTO notifications
      (favorite_id, law_id, law_name, article_no, message, old_revision_date, new_revision_date, created_at)
    VALUES (${favoriteId}, ${lawId}, ${lawName}, ${articleNo}, ${message}, ${oldRevDate}, ${newRevDate}, ${Date.now()})
  `;
}

export async function createChangeNotificationsForLaw(
  lawId: string,
  lawName: string,
  oldRevDate: string,
  newRevDate: string
): Promise<void> {
  const sql = getSql();
  const favorites = await sql<Array<{ id: number; article_no: string | null }>>`
    SELECT id, article_no FROM favorites WHERE law_id = ${lawId}
  `;

  for (const fav of favorites) {
    await createChangeNotification(
      lawId,
      lawName,
      fav.article_no,
      oldRevDate,
      newRevDate,
      fav.id
    );
  }

  if (favorites.length === 0) {
    await createChangeNotification(lawId, lawName, null, oldRevDate, newRevDate);
  }
}

export async function getNotifications(
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<Notification[]> {
  const sql = getSql();
  const rows = unreadOnly
    ? await sql<Array<Record<string, unknown>>>`
        SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC LIMIT ${limit}
      `
    : await sql<Array<Record<string, unknown>>>`
        SELECT * FROM notifications ORDER BY created_at DESC LIMIT ${limit}
      `;
  return rows.map(mapNotification);
}

export async function getUnreadCount(): Promise<number> {
  const sql = getSql();
  const rows = await sql<Array<{ cnt: string }>>`
    SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0
  `;
  return Number(rows[0]?.cnt ?? 0);
}

export async function markNotificationRead(id: number): Promise<void> {
  const sql = getSql();
  await sql`UPDATE notifications SET is_read = 1 WHERE id = ${id}`;
}

export async function markAllNotificationsRead(): Promise<void> {
  const sql = getSql();
  await sql`UPDATE notifications SET is_read = 1`;
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as number,
    favoriteId: row.favorite_id ? (row.favorite_id as number) : null,
    lawId: row.law_id as string,
    lawName: row.law_name as string,
    articleNo: (row.article_no as string) ?? null,
    message: row.message as string,
    oldRevisionDate: (row.old_revision_date as string) ?? null,
    newRevisionDate: (row.new_revision_date as string) ?? null,
    isRead: Boolean(Number(row.is_read)),
    createdAt: Number(row.created_at),
  };
}
