import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// 연결 풀 싱글톤 (서버리스 환경에서 연결 재사용)
let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    _sql = postgres(connectionString, {
      ssl: "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _sql;
}

// DB 초기화 (Neon에서 테이블 없으면 생성)
export async function initSchema(): Promise<void> {
  const sql = getSql();

  // users 테이블 (Google OAuth)
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      image TEXT,
      created_at BIGINT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS law_cache (
      id TEXT PRIMARY KEY,
      law_name TEXT NOT NULL,
      content_json TEXT NOT NULL,
      revision_date TEXT,
      cached_at BIGINT NOT NULL,
      content_hash TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS article_snapshots (
      id SERIAL PRIMARY KEY,
      law_id TEXT NOT NULL,
      article_no TEXT NOT NULL,
      content TEXT NOT NULL,
      revision_date TEXT NOT NULL,
      snapshot_at BIGINT NOT NULL,
      UNIQUE(law_id, article_no, revision_date)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      law_id TEXT NOT NULL,
      law_name TEXT NOT NULL,
      article_no TEXT,
      article_title TEXT,
      created_at BIGINT NOT NULL,
      last_checked_at BIGINT,
      has_changes INTEGER DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      favorite_id INTEGER REFERENCES favorites(id) ON DELETE SET NULL,
      law_id TEXT NOT NULL,
      law_name TEXT NOT NULL,
      article_no TEXT,
      message TEXT NOT NULL,
      old_revision_date TEXT,
      new_revision_date TEXT,
      is_read INTEGER DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;

  // 기존 테이블에 user_id 컬럼 추가 (이미 있으면 무시)
  await sql`ALTER TABLE favorites ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`;
}

// 사용자 upsert (로그인 시 호출)
export async function upsertUser(
  id: string,
  email: string,
  name: string | null,
  image: string | null
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO users (id, email, name, image, created_at)
    VALUES (${id}, ${email}, ${name}, ${image}, ${Date.now()})
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      image = EXCLUDED.image
  `;
}
