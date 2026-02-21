import {
  parseLawSearchXml,
  parseLawDetailXml,
  parseAdminRuleDetailXml,
  parseLawHistoryXml,
} from "./xml-parser";
import type { LawSearchResult, LawDetail, LawRevision } from "./types";

const BASE_URL = "https://www.law.go.kr/DRF";

export class LawGoClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchXml(
    endpoint: string,
    params: Record<string, string>
  ): Promise<string> {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.set("OC", this.apiKey);
    url.searchParams.set("type", "XML");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 0 }, // 항상 최신 데이터
    });

    if (!res.ok) {
      throw new Error(`법령정보센터 API 오류: ${res.status} ${url.toString()}`);
    }
    return res.text();
  }

  /** 법령 목록 검색 (법령명 키워드) */
  async searchLaws(
    query: string,
    page: number = 1,
    display: number = 20
  ): Promise<LawSearchResult[]> {
    const xml = await this.fetchXml("lawSearch.do", {
      target: "law",
      query,
      page: String(page),
      display: String(display),
    });
    return parseLawSearchXml(xml);
  }

  /** 행정규칙 검색 (고시, 훈령, 예규) */
  async searchAdminRules(
    query: string,
    page: number = 1
  ): Promise<LawSearchResult[]> {
    const xml = await this.fetchXml("lawSearch.do", {
      target: "admrul",
      query,
      page: String(page),
      display: "20",
    });
    return parseLawSearchXml(xml);
  }

  /** 특정 법령 전체 조문 조회 */
  async getLawDetail(lawId: string): Promise<LawDetail | null> {
    const xml = await this.fetchXml("lawService.do", {
      target: "law",
      ID: lawId,
    });
    return parseLawDetailXml(xml);
  }

  /** 행정규칙(고시/훈령) 상세 조회 */
  async getAdminRuleDetail(ruleId: string): Promise<LawDetail | null> {
    // admRulService.do는 짧은 행정규칙ID 사용 시 404
    // lawService.do?target=admrul + 행정규칙일련번호 조합이 올바름
    const xml = await this.fetchXml("lawService.do", {
      target: "admrul",
      ID: ruleId,
    });
    return parseAdminRuleDetailXml(xml);
  }

  /** 법령 또는 행정규칙 상세 조회 (isAdminRule 플래그로 분기) */
  async getLawOrAdminDetail(id: string, isAdminRule: boolean): Promise<LawDetail | null> {
    if (isAdminRule) return this.getAdminRuleDetail(id);
    return this.getLawDetail(id);
  }

  /** 법령 개정이력 조회 */
  async getLawHistory(lawId: string): Promise<LawRevision[]> {
    const xml = await this.fetchXml("lawHistory.do", {
      target: "law",
      ID: lawId,
    });
    return parseLawHistoryXml(xml);
  }

  /** 최신 개정일만 가볍게 조회 (변경감지용) */
  async getLatestRevisionDate(
    lawId: string
  ): Promise<{ revisionDate: string; lawName: string } | null> {
    try {
      const detail = await this.getLawDetail(lawId);
      if (!detail) return null;
      return { revisionDate: detail.revisionDate, lawName: detail.lawName };
    } catch {
      return null;
    }
  }
}

// 싱글톤 인스턴스 (서버사이드 전용)
let _client: LawGoClient | null = null;

export function getLawGoClient(): LawGoClient {
  if (!_client) {
    const key = process.env.LAWGO_API_KEY;
    if (!key) {
      throw new Error("LAWGO_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    _client = new LawGoClient(key);
  }
  return _client;
}
