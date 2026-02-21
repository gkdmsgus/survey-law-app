import { NextRequest, NextResponse } from 'next/server';
import { getCachedLaw } from '@/lib/db/cache';
import { saveArticleSnapshot } from '@/lib/db/history';
import type { Article } from '@/lib/api/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lawId: string; articleNo: string }> }
) {
  const { lawId, articleNo } = await params;
  const cached = await getCachedLaw(lawId);
  if (!cached) {
    return NextResponse.json(
      { error: '법령 캐시가 없습니다. 먼저 법령을 조회해주세요.' },
      { status: 404 }
    );
  }
  const detail = JSON.parse(cached.contentJson);
  const article: Article | undefined = detail.articles?.find(
    (a: Article) => a.articleNo === articleNo
  );
  if (!article) {
    return NextResponse.json({ error: '해당 조문을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (article.revisionDate) {
    await saveArticleSnapshot(lawId, articleNo, article.content, article.revisionDate);
  }
  return NextResponse.json(article);
}
