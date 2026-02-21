import { NextRequest, NextResponse } from 'next/server';
import { removeFavorite, clearFavoriteChanges } from '@/lib/db/favorites';
import { auth } from '@/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await params;
  await removeFavorite(Number(id), session.user.id);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const { id } = await params;
  await clearFavoriteChanges(Number(id), session.user.id);
  return NextResponse.json({ success: true });
}
