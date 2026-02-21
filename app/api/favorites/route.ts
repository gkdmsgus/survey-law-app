import { NextRequest, NextResponse } from 'next/server';
import { getAllFavorites, addFavorite, getFavoriteByArticle } from '@/lib/db/favorites';
import { getCachedLaw } from '@/lib/db/cache';
import { saveArticleSnapshot } from '@/lib/db/history';
import type { Article } from '@/lib/api/types';
import { initSchema } from '@/lib/db/schema';
import { auth } from '@/auth';

let schemaInitialized = false;
async function ensureSchema() {
  if (!schemaInitialized) { await initSchema(); schemaInitialized = true; }
}

export async function GET() {
  await ensureSchema();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const favorites = await getAllFavorites(session.user.id);
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const body = await req.json();
  const { lawId, lawName, articleNo, articleTitle } = body;
  if (!lawId || !lawName) {
    return NextResponse.json({ error: 'lawId와 lawName은 필수입니다.' }, { status: 400 });
  }
  const existing = await getFavoriteByArticle(session.user.id, lawId, articleNo ?? null);
  if (existing) {
    return NextResponse.json({ favorite: existing, alreadyExists: true });
  }
  const id = await addFavorite(session.user.id, lawId, lawName, articleNo ?? null, articleTitle ?? null);
  if (articleNo) {
    const cached = await getCachedLaw(lawId);
    if (cached) {
      const detail = JSON.parse(cached.contentJson);
      const article = detail.articles?.find((a: { articleNo: string }) => a.articleNo === articleNo);
      if (article?.revisionDate) {
        await saveArticleSnapshot(lawId, articleNo, article.content, article.revisionDate);
      }
    }
  }
  return NextResponse.json({ id }, { status: 201 });
}
