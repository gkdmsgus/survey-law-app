import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSql();
  const result = await sql`DELETE FROM law_cache`;
  const deleted = result.count ?? 0;

  return NextResponse.json({
    ok: true,
    deleted,
    at: new Date().toISOString(),
  });
}
