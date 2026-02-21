import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/db/notifications';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await markNotificationRead(Number(id));
  return NextResponse.json({ success: true });
}
