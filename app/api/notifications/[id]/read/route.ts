import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/db/notifications';
import { auth } from '@/auth';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await params;
  await markNotificationRead(Number(id), session.user.id);
  return NextResponse.json({ success: true });
}
