import { NextRequest, NextResponse } from "next/server";
import { getLawGoClient } from "@/lib/api/lawgo-client";
import { LAW_MAP } from "@/lib/constants/laws";
import {
  getCachedLaw,
  isCacheValid,
  upsertLawCache,
  hashEqual,
} from "@/lib/db/cache";
import { markFavoritesChanged } from "@/lib/db/favorites";
import { createChangeNotificationsForLaw } from "@/lib/db/notifications";
import { initSchema } from "@/lib/db/schema";

let schemaInitialized = false;
async function ensureSchema() {
  if (!schemaInitialized) {
    await initSchema();
    schemaInitialized = true;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lawId: string }> }
) {
  await ensureSchema();
  const { lawId } = await params;
  const cached = await getCachedLaw(lawId);
  if (cached && isCacheValid(cached)) {
    const data = JSON.parse(cached.contentJson);
    return NextResponse.json({ ...data, cachedAt: cached.cachedAt });
  }
  try {
    const client = getLawGoClient();
    const lawInfo = LAW_MAP.get(lawId);
    const isAdminRule = lawInfo?.isAdminRule ?? false;
    const detail = await client.getLawOrAdminDetail(lawId, isAdminRule);
    if (!detail) {
      return NextResponse.json({ error: '법령을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (cached && !(await hashEqual(cached, detail))) {
      const oldRevDate = cached.revisionDate ?? '';
      await markFavoritesChanged(lawId, oldRevDate, detail.revisionDate);
      await createChangeNotificationsForLaw(lawId, detail.lawName, oldRevDate, detail.revisionDate);
    }
    const now = Date.now();
    await upsertLawCache(lawId, detail);
    return NextResponse.json({ ...detail, cachedAt: now });
  } catch (e) {
    console.error('법령 조회 실패:', e);
    if (cached) {
      const data = JSON.parse(cached.contentJson);
      return NextResponse.json({ ...data, cachedAt: cached.cachedAt });
    }
    return NextResponse.json({ error: '법령 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}