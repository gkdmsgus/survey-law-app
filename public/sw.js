// ── 측량 법령 조회 앱 Service Worker ──────────────────────────────
// 캐시 전략:
//  - 정적 자산: Cache First (빠른 로딩)
//  - 법령 API: Network First + 오프라인 폴백 (최신 데이터 우선)
//  - 페이지: Stale-While-Revalidate (빠른 표시 + 백그라운드 갱신)

const CACHE_VERSION = "v1";
const STATIC_CACHE = `survey-law-static-${CACHE_VERSION}`;
const PAGE_CACHE = `survey-law-pages-${CACHE_VERSION}`;
const API_CACHE = `survey-law-api-${CACHE_VERSION}`;

// 설치 시 사전 캐시할 핵심 정적 자산
const PRECACHE_URLS = [
  "/",
  "/quick-ref",
  "/laws",
  "/favorites",
  "/manifest.json",
];

// ── Install ─────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // 즉시 활성화
  );
});

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE &&
                key !== PAGE_CACHE &&
                key !== API_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // 즉시 모든 클라이언트 제어
  );
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 외부 도메인(API, CDN) 요청은 그냥 통과
  if (url.origin !== self.location.origin) {
    return;
  }

  // POST/DELETE 등 변경 요청은 항상 네트워크
  if (request.method !== "GET") {
    return;
  }

  // ① 법령 API — Network First (최신 데이터 우선, 실패 시 캐시)
  if (url.pathname.startsWith("/api/laws/") || url.pathname.startsWith("/api/icons/")) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // ② 알림/즐겨찾기 API — 항상 네트워크 (캐시 안함)
  if (
    url.pathname.startsWith("/api/notifications") ||
    url.pathname.startsWith("/api/favorites")
  ) {
    return;
  }

  // ③ Next.js 정적 자산 (_next/static) — Cache First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ④ 이미지/폰트 — Cache First
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ⑤ 페이지 — Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
});

// ── 캐시 전략 함수 ─────────────────────────────────────────────────

/** Cache First: 캐시 있으면 캐시 반환, 없으면 네트워크 후 캐시 저장 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("오프라인 상태입니다.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/** Network First: 네트워크 우선, 실패(또는 timeout) 시 캐시 반환 */
async function networkFirst(request, cacheName, timeoutMs = 5000) {
  const cache = await caches.open(cacheName);

  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeoutMs)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // API 요청 실패 시 JSON 오프라인 응답
    if (request.headers.get("accept")?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "오프라인 상태입니다. 캐시된 데이터가 없습니다." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response("오프라인 상태입니다.", { status: 503 });
  }
}

/** Stale-While-Revalidate: 캐시 즉시 반환 + 백그라운드 갱신 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 백그라운드에서 네트워크 갱신
  const networkUpdate = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // 캐시가 있으면 즉시 반환, 없으면 네트워크 대기
  return cached ?? networkUpdate ?? offlinePage();
}

/** 오프라인 폴백 페이지 */
async function offlinePage() {
  const cached = await caches.match("/");
  if (cached) return cached;
  return new Response(
    `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오프라인 - 측량 법령 조회</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; background: #f9fafb; color: #374151; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; }
    a { color: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📡 오프라인</h1>
    <p>인터넷 연결을 확인해주세요.</p>
    <p>이전에 방문한 페이지는 <a href="/">홈으로 돌아가기</a> 후 이용 가능합니다.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// ── 백그라운드 동기화 (선택적) ─────────────────────────────────────
// 알림 체크는 온라인 복귀 시 자동으로 재개됨
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
