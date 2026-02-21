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

export function parseLawDetailXml(xml: string): LawDetail | null {
  const obj = parser.parse(xml);
  const law = obj?.법령;
  if (!law) return null;

  const basicInfo = law["기본정보"];
  const articles = toArray(law["조문"]?.["조문단위"]).map(
    (jo: Record<string, unknown>) => ({
      lawId: String(basicInfo?.["법령ID"] ?? ""),
      lawName: String(basicInfo?.["법령명_한글"] ?? ""),
      articleNo: String(jo["조문번호"] ?? ""),
      articleTitle: String(jo["조문제목"] ?? ""),
      content: sanitizeContent(
        String(jo["조문내용"] ?? "") +
        buildSubArticles(jo["항"])
      ),
      revisionDate: String(basicInfo?.["개정일자"] ?? ""),
    })
  );

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

/** 행정규칙(고시/훈령) XML 파싱 */
export function parseAdminRuleDetailXml(xml: string): LawDetail | null {
  const obj = parser.parse(xml);
  // 행정규칙 XML 루트는 "행정규칙" 또는 "AdminRule"
  const rule = obj?.행정규칙 ?? obj?.AdminRule;
  if (!rule) return null;

  const basicInfo = rule["기본정보"] ?? rule;
  const lawId = String(basicInfo["행정규칙ID"] ?? basicInfo["ID"] ?? "");
  const lawName = String(basicInfo["행정규칙명"] ?? basicInfo["법령명"] ?? "");
  const revisionDate = String(basicInfo["발령일자"] ?? basicInfo["개정일자"] ?? "");
  const enforcementDate = String(basicInfo["시행일자"] ?? revisionDate);
  const department = String(basicInfo["발령기관명"] ?? basicInfo["소관부처명"] ?? "");

  // 조문 파싱 (행정규칙은 "조문" 또는 "규정" 구조)
  const joUnit = rule["조문"]?.["조문단위"] ?? rule["규정"]?.["조문단위"];
  const articles = toArray(joUnit).map((jo: Record<string, unknown>) => ({
    lawId,
    lawName,
    articleNo: String(jo["조문번호"] ?? ""),
    articleTitle: String(jo["조문제목"] ?? ""),
    content: sanitizeContent(
      String(jo["조문내용"] ?? "") + buildSubArticles(jo["항"])
    ),
    revisionDate,
  }));

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
