// 국가법령정보센터 API 응답 도메인 타입

export interface LawSearchResult {
  lawId: string;        // 법령 MST 번호
  lawName: string;      // 법령명
  lawType: string;      // 법률/시행령/시행규칙/행정규칙
  revisionDate: string; // 개정일 (YYYYMMDD)
  enforcementDate: string; // 시행일
  department: string;   // 소관부처
}

export interface Article {
  lawId: string;
  lawName: string;
  articleNo: string;    // 조문번호 (예: "6", "6의2")
  articleTitle: string; // 조문제목
  content: string;      // 조문본문 (HTML 포함 가능)
  revisionDate: string;
  isChapterHeader?: boolean; // 장/절/관 구분자 여부 (조문여부="전문")
}

export interface LawDetail {
  lawId: string;
  lawName: string;
  lawType: string;
  revisionDate: string;
  enforcementDate: string;
  department: string;
  articles: Article[];
  cachedAt?: number; // 법령정보원 조회 시점 (Unix timestamp ms)
}

export interface LawRevision {
  lawId: string;
  revisionDate: string;
  revisionType: string; // 전부개정/일부개정/제정 등
  revisionReason: string;
}

export interface ArticleSnapshot {
  id: number;
  lawId: string;
  articleNo: string;
  content: string;
  revisionDate: string;
  snapshotAt: number; // Unix timestamp
}

export interface Favorite {
  id: number;
  userId: string;
  lawId: string;
  lawName: string;
  articleNo: string | null;
  articleTitle: string | null;
  createdAt: number;
  lastCheckedAt: number | null;
  hasChanges: boolean;
}

export interface Notification {
  id: number;
  userId: string;
  favoriteId: number | null;
  lawId: string;
  lawName: string;
  articleNo: string | null;
  message: string;
  oldRevisionDate: string | null;
  newRevisionDate: string | null;
  isRead: boolean;
  createdAt: number;
}

export interface CachedLaw {
  id: string;
  lawName: string;
  contentJson: string;
  revisionDate: string | null;
  cachedAt: number;
  contentHash: string;
}
