import { NextRequest, NextResponse } from 'next/server';
import { getLawGoClient } from '@/lib/api/lawgo-client';
import { getAllFavorites } from '@/lib/db/favorites';
import { getCachedLaw, invalidateCache, upsertLawCache } from '@/lib/db/cache';
import { markFavoritesChanged } from '@/lib/db/favorites';
import { createChangeNotificationsForLaw } from '@/lib/db/notifications';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await getAllFavorites();
  const uniqueLawIds = [...new Set(favorites.map((f) => f.lawId))];
  const client = getLawGoClient();
  const results: Array<{ lawId: string; changed: boolean; error?: string }> = [];

  for (const lawId of uniqueLawIds) {
    try {
      const latestInfo = await client.getLatestRevisionDate(lawId);
      if (!latestInfo) {
        results.push({ lawId, changed: false, error: '조회 실패' });
        continue;
      }
      const cached = await getCachedLaw(lawId);
      if (cached && cached.revisionDate !== latestInfo.revisionDate) {
        await markFavoritesChanged(lawId, cached.revisionDate ?? '', latestInfo.revisionDate);
        await createChangeNotificationsForLaw(
          lawId,
          latestInfo.lawName,
          cached.revisionDate ?? '',
          latestInfo.revisionDate
        );
        await invalidateCache(lawId);
        results.push({ lawId, changed: true });
      } else if (!cached) {
        const detail = await client.getLawDetail(lawId);
        if (detail) await upsertLawCache(lawId, detail);
        results.push({ lawId, changed: false });
      } else {
        results.push({ lawId, changed: false });
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`법령 확인 실패 (${lawId}):`, e);
      results.push({ lawId, changed: false, error: String(e) });
    }
  }
  return NextResponse.json({ checked: uniqueLawIds.length, results, at: new Date().toISOString() });
}
