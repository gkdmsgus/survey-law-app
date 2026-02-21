import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, getUnreadCount, markAllNotificationsRead } from '@/lib/db/notifications';
import { initSchema } from '@/lib/db/schema';
import { auth } from '@/auth';

let schemaInitialized = false;
async function ensureSchema() {
  if (!schemaInitialized) { await initSchema(); schemaInitialized = true; }
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
  const notifications = await getNotifications(session.user.id, unreadOnly);
  const unreadCount = await getUnreadCount(session.user.id);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  await ensureSchema();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  await markAllNotificationsRead(session.user.id);
  return NextResponse.json({ success: true });
}
