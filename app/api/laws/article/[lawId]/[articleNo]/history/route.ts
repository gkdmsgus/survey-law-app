import { NextRequest, NextResponse } from 'next/server';
import { getArticleSnapshots } from '@/lib/db/history';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lawId: string; articleNo: string }> }
) {
  const { lawId, articleNo } = await params;
  const snapshots = await getArticleSnapshots(lawId, articleNo);
  return NextResponse.json({ snapshots });
}
