import { XMLParser } from "fast-xml-parser";
import type { LawSearchResult, LawDetail, Article, LawRevision } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  trimValues: true,
});

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function parseLawSearchXml(xml: string): LawSearchResult[] {
  const obj = parser.parse(xml);
  const laws = obj?.LawSearch?.law;
  if (!laws) return [];

  return toArray(laws).map((law: Record<string, unknown>) => ({
    lawId: String(law["법령ID"] ?? ""),
    lawName: String(law["법령명_한글"] ?? ""),
    lawType: String(law["법령구분명"] ?? ""),
    revisionDate: String(law["개정일자"] ?? ""),
    enforcementDate: String(law["시행일자"] ?? ""),
    department: String(law["소관부처명"] ?? ""),
  }));
}

/** 삭제된 조문 여부 판별 (예: "제29조 삭제 <2021.2.9>") */
function isDeletedArticle(content: string): boolean {
  return /^제\d+조\s*(의\d+)?\s*삭제/.test(content.trim());
}

export function parseLawDetailXml(xml: string): LawDetail | null {
  const obj = parser.parse(xml);
  const law = obj?.법령;
  if (!law) return null;

  const basicInfo = law["기본정보"];
  const articles = toArray(law["조문"]?.["조문단위"])
    .map(
      (jo: Record<string, unknown>, idx: number) => {
        const isChapterHeader = String(jo["조문여부"] ?? "").trim() === "전문";
        const rawContent = sanitizeContent(
          String(jo["조문내용"] ?? "") + buildSubArticles(jo["항"])
        );
        const rawTitle = String(jo["조문제목"] ?? "").trim();
        // 장/절 구분자면 본문이 곧 제목, 일반 조문은 제목 없으면 본문 첫 줄 사용
        const articleTitle = isChapterHeader
          ? rawContent
          : rawTitle || rawContent.split("\n")[0].slice(0, 30) || `조문 ${idx + 1}`;
        return {
          lawId: String(basicInfo?.["법령ID"] ?? ""),
          lawName: String(basicInfo?.["법령명_한글"] ?? ""),
          articleNo: String(jo["조문번호"] ?? ""),
          articleTitle,
          content: rawContent,
          revisionDate: String(basicInfo?.["개정일자"] ?? ""),
          isChapterHeader,
        };
      }
    )
    // 삭제된 조문 필터링
    .filter((a) => a.isChapterHeader || !isDeletedArticle(a.content));

  return {
    lawId: String(basicInfo?.["법령ID"] ?? ""),
    lawName: String(basicInfo?.["법령명_한글"] ?? ""),
    lawType: String(basicInfo?.["법령구분명"] ?? ""),
    revisionDate: String(basicInfo?.["개정일자"] ?? ""),
    enforcementDate: String(basicInfo?.["시행일자"] ?? ""),
    department: String(basicInfo?.["소관부처명"] ?? ""),
    articles,
  };
}

function buildSubArticles(hang: unknown): string {
  if (!hang) return "";
  const items = toArray(hang as Record<string, unknown>);
  return items
    .map((h) => {
      const hr = h as Record<string, unknown>;
      const content = String(hr["항내용"] ?? "");
      const hos = toArray(hr["호"]).map(
        (ho) => `\n    ${(ho as Record<string, unknown>)["호내용"] ?? ""}`
      );
      return `\n  ${content}${hos.join("")}`;
    })
    .join("");
}

/** 행정규칙(고시/훈령) XML 파싱
 * 실제 API 응답 루트 태그: <AdmRulService>
 * 기본정보: <행정규칙기본정보> 하위
 * 조문: 루트 바로 아래 flat <조문내용> 배열 (조문번호 내용에 포함)
 */
export function parseAdminRuleDetailXml(xml: string): LawDetail | null {
  const obj = parser.parse(xml);
  // 실제 API 응답 루트는 AdmRulService
  const rule = obj?.AdmRulService ?? obj?.행정규칙 ?? obj?.AdminRule;
  if (!rule) return null;

  const basicInfo = rule["행정규칙기본정보"] ?? rule["기본정보"] ?? rule;
  const lawId = String(
    basicInfo["행정규칙일련번호"] ?? basicInfo["행정규칙ID"] ?? basicInfo["ID"] ?? ""
  );
  const lawName = String(
    basicInfo["행정규칙명"] ?? basicInfo["법령명"] ?? ""
  );
  const revisionDate = String(
    basicInfo["발령일자"] ?? basicInfo["개정일자"] ?? ""
  );
  const enforcementDate = String(basicInfo["시행일자"] ?? revisionDate);
  const department = String(
    basicInfo["소관부처명"] ?? basicInfo["발령기관명"] ?? ""
  );

  // 조문 파싱 방식 1: AdmRulService의 flat <조문내용> 배열
  const flatContents = rule["조문내용"];

  if (flatContents !== undefined) {
    // flat 구조: 조문내용이 루트 바로 아래에 배열로 존재
    const contents = toArray(flatContents) as (string | number | Record<string, unknown>)[];
    const articles: Article[] = contents
      .map((raw, idx) => {
        const text = sanitizeContent(String(raw));
        if (!text) return null;

        // 장/절/관 구분자 판별: "제N장", "제N절", "제N관" 또는 숫자 없이 "총칙" 등
        const isChapterHeader =
          /^제\d+장/.test(text) ||
          /^제\d+절/.test(text) ||
          /^제\d+관/.test(text) ||
          /^부\s*칙/.test(text) ||
          // 조문번호("제N조")로 시작하지 않는 짧은 텍스트 (장/절 제목)
          (!/^제\d+조/.test(text) && text.length < 30 && idx > 0);

        // 조문번호 추출 ("제1조(목적)" → "1", "제1조의2" → "1의2")
        const articleNoMatch = text.match(/^제(\d+조(?:의\d+)?)/);
        const articleNo = articleNoMatch ? articleNoMatch[1] : String(idx + 1);

        // 제목: 첫 줄 (조문번호+괄호 제목 포함)
        const firstLine = text.split("\n")[0];
        const articleTitle = isChapterHeader
          ? text
          : firstLine.slice(0, 50) || `조문 ${idx + 1}`;

        const article: Article = {
          lawId,
          lawName,
          articleNo,
          articleTitle,
          content: text,
          revisionDate,
          isChapterHeader,
        };
        return article;
      })
      .filter((a): a is Article => a !== null && (!!a.isChapterHeader || !isDeletedArticle(a.content)));

    return {
      lawId,
      lawName,
      lawType: String(basicInfo["행정규칙구분"] ?? basicInfo["법령구분명"] ?? "행정규칙"),
      revisionDate,
      enforcementDate,
      department,
      articles,
    };
  }

  // 조문 파싱 방식 2: 기존 조문단위 구조 (폴백)
  const joUnit = rule["조문"]?.["조문단위"] ?? rule["규정"]?.["조문단위"];
  const articles = toArray(joUnit)
    .map((jo: Record<string, unknown>, idx: number) => {
      const isChapterHeader = String(jo["조문여부"] ?? "").trim() === "전문";
      const rawContent = sanitizeContent(
        String(jo["조문내용"] ?? "") + buildSubArticles(jo["항"])
      );
      const rawTitle = String(jo["조문제목"] ?? "").trim();
      const articleTitle = isChapterHeader
        ? rawContent
        : rawTitle || rawContent.split("\n")[0].slice(0, 30) || `조문 ${idx + 1}`;
      return {
        lawId,
        lawName,
        articleNo: String(jo["조문번호"] ?? ""),
        articleTitle,
        content: rawContent,
        revisionDate,
        isChapterHeader,
      };
    })
    .filter((a) => a.isChapterHeader || !isDeletedArticle(a.content));

  return {
    lawId,
    lawName,
    lawType: String(basicInfo["행정규칙구분"] ?? "행정규칙"),
    revisionDate,
    enforcementDate,
    department,
    articles,
  };
}

export function parseLawHistoryXml(xml: string): LawRevision[] {
  const obj = parser.parse(xml);
  const history = obj?.법령이력?.법령이력목록;
  if (!history) return [];

  return toArray(history).map((item: Record<string, unknown>) => ({
    lawId: String(item["법령ID"] ?? ""),
    revisionDate: String(item["개정일자"] ?? ""),
    revisionType: String(item["개정구분"] ?? ""),
    revisionReason: String(item["개정이유"] ?? ""),
  }));
}

export function sanitizeContent(content: string): string {
  // HTML 태그 제거 후 공백 정리
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
