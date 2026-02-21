import { NextRequest, NextResponse } from 'next/server';
import { removeFavorite, clearFavoriteChanges } from '@/lib/db/favorites';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await removeFavorite(Number(id));
  return NextResponse.json({ success: true });
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await clearFavoriteChanges(Number(id));
  return NextResponse.json({ success: true });
}
