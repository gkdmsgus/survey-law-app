import { NextRequest, NextResponse } from 'next/server';
import { getLawGoClient } from '@/lib/api/lawgo-client';
import { searchArticlesFts } from '@/lib/db/cache';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }
  const q = query.trim();
  const ftsResults = await searchArticlesFts(q);
  let apiResults: Array<{ lawId: string; lawName: string; type: string }> = [];
  try {
    const client = getLawGoClient();
    const [lawResults, adminResults] = await Promise.all([
      client.searchLaws(q, 1, 10),
      client.searchAdminRules(q, 1),
    ]);
    apiResults = [
      ...lawResults.map((l) => ({ lawId: l.lawId, lawName: l.lawName, type: l.lawType })),
      ...adminResults.map((l) => ({ lawId: l.lawId, lawName: l.lawName, type: l.lawType })),
    ];
  } catch (e) {
    console.error('법령정보센터 검색 실패:', e);
  }
  return NextResponse.json({ ftsResults, apiResults });
}
