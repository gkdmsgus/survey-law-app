import Link from "next/link";
import { lawHref } from "@/lib/constants/laws";

// ── 수치 참조 데이터 ──────────────────────────────────────────────
// 각 카드: 측량 종류별 핵심 수치 테이블
// lawId + cat은 해당 조문 링크 생성에 사용

const QUICK_REF_CARDS = [
  {
    id: "jijuk-tolerance",
    icon: "📐",
    title: "지적측량 허용오차",
    lawName: "지적측량 시행규칙",
    lawId: "011121",
    catId: "jijuk-tolerance",
    searchKeyword: "허용오차",
    color: "blue",
    rows: [
      { label: "지적기준점 (1등)", values: ["±0.03 m", "—"] },
      { label: "지적기준점 (2등)", values: ["±0.05 m", "—"] },
      { label: "지적도근점", values: ["±0.10 m", "—"] },
      { label: "경계점 (도해지역)", values: ["±0.10 m", "±0.15 m"] },
      { label: "경계점 (수치지역)", values: ["±0.07 m", "±0.10 m"] },
    ],
    headers: ["구분", "연결오차", "교점오차"],
    note: "제27조~제30조 기준. 실제 수치는 시행규칙 원문 확인 필요.",
  },
  {
    id: "gnss-equipment",
    icon: "🛰️",
    title: "GNSS 측량 장비기준",
    lawName: "GNSS에 의한 지적측량규정",
    lawId: "2100000263380",
    catId: "gnss-equipment",
    searchKeyword: "장비",
    color: "violet",
    rows: [
      { label: "수신기 주파수", values: ["2주파 이상"] },
      { label: "채널 수", values: ["12채널 이상"] },
      { label: "데이터 기록 간격", values: ["1초 이하"] },
      { label: "관측 정밀도 (수평)", values: ["±5 mm + 1 ppm"] },
      { label: "관측 정밀도 (수직)", values: ["±10 mm + 1 ppm"] },
    ],
    headers: ["항목", "기준"],
    note: "장비 성능 기준. 실제 조문은 원문 확인 필요.",
  },
  {
    id: "gnss-obs",
    icon: "🛰️",
    title: "GNSS 관측 기준",
    lawName: "GNSS에 의한 지적측량규정",
    lawId: "2100000263380",
    catId: "gnss-obs",
    searchKeyword: "관측",
    color: "violet",
    rows: [
      { label: "정지측량 관측시간", values: ["60분 이상"] },
      { label: "신속정지 관측시간", values: ["20분 이상"] },
      { label: "위성 수 (최소)", values: ["5개 이상"] },
      { label: "PDOP", values: ["3 이하"] },
      { label: "기선 재측 조건", values: ["교점오차 초과 시"] },
    ],
    headers: ["항목", "기준"],
    note: "관측 조건 기준. 실제 조문은 원문 확인 필요.",
  },
  {
    id: "public-control",
    icon: "🗺️",
    title: "공공측량 기준점 정확도",
    lawName: "공공측량 작업규정",
    lawId: "2100000258132",
    catId: "public-control",
    searchKeyword: "기준점",
    color: "green",
    rows: [
      { label: "1급 기준점 (수평)", values: ["±0.02 m"] },
      { label: "2급 기준점 (수평)", values: ["±0.05 m"] },
      { label: "3급 기준점 (수평)", values: ["±0.10 m"] },
      { label: "1급 기준점 (수직)", values: ["±0.03 m"] },
      { label: "2급 기준점 (수직)", values: ["±0.05 m"] },
    ],
    headers: ["구분", "허용정확도"],
    note: "공공측량 기준점 설치 정확도 기준. 원문 확인 필요.",
  },
  {
    id: "jijuk-confirm",
    icon: "📐",
    title: "지적확정측량 허용오차",
    lawName: "지적확정측량규정",
    lawId: "2100000263420",
    catId: "jijuk-confirm",
    searchKeyword: "허용오차",
    color: "orange",
    rows: [
      { label: "필지경계점 (수치)", values: ["±0.07 m"] },
      { label: "필지경계점 (도해)", values: ["±0.10 m"] },
      { label: "기준점 연결오차", values: ["±0.05 m"] },
    ],
    headers: ["구분", "허용오차"],
    note: "지적확정측량 성과 허용오차. 원문 확인 필요.",
  },
  {
    id: "survey-period",
    icon: "📐",
    title: "지적측량 처리기간",
    lawName: "지적측량 시행규칙",
    lawId: "011121",
    catId: "jijuk-period",
    searchKeyword: "처리기간",
    color: "blue",
    rows: [
      { label: "경계복원측량", values: ["4일"] },
      { label: "분할측량", values: ["6일"] },
      { label: "지적확정측량", values: ["30일"] },
      { label: "등록전환측량", values: ["6일"] },
      { label: "현황측량", values: ["4일"] },
    ],
    headers: ["측량 종류", "처리기간"],
    note: "민원 접수일로부터 기산. 실제 조문(제25조 등) 확인 필요.",
  },
  {
    id: "registration-staff",
    icon: "📋",
    title: "측량업 등록 기술인력",
    lawName: "공간정보관리법 시행규칙",
    lawId: "011120",
    catId: "reg-staff",
    searchKeyword: "기술인력",
    color: "gray",
    rows: [
      { label: "측량업 (기본)", values: ["기술사 1명 + 기사 2명"] },
      { label: "지적측량업", values: ["지적기술사 1명 + 지적기사 2명"] },
      { label: "공공측량업", values: ["기술사 1명 + 기사 1명"] },
    ],
    headers: ["등록 종류", "필요 인력"],
    note: "최소 기술인력 기준. 시행규칙 별표 원문 확인 필요.",
  },
  {
    id: "drone-survey",
    icon: "🗺️",
    title: "드론 공공측량 기준",
    lawName: "공공측량 작업규정",
    lawId: "2100000258132",
    catId: "public-drone",
    searchKeyword: "드론",
    color: "green",
    rows: [
      { label: "비행고도 (1:1000)", values: ["100~120 m"] },
      { label: "비행고도 (1:5000)", values: ["300~500 m"] },
      { label: "종중복도", values: ["60% 이상"] },
      { label: "횡중복도", values: ["30% 이상"] },
      { label: "GCP 배치", values: ["9점 이상 (촬영구역)"] },
    ],
    headers: ["항목", "기준"],
    note: "드론(무인항공기) 사진측량 기준. 원문 확인 필요.",
  },
] as const;

const COLOR_MAP = {
  blue: {
    header: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    link: "text-blue-600 hover:text-blue-800",
    row: "hover:bg-blue-50/50",
    icon: "bg-blue-100",
  },
  violet: {
    header: "bg-violet-50 border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    link: "text-violet-600 hover:text-violet-800",
    row: "hover:bg-violet-50/50",
    icon: "bg-violet-100",
  },
  green: {
    header: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    link: "text-green-600 hover:text-green-800",
    row: "hover:bg-green-50/50",
    icon: "bg-green-100",
  },
  orange: {
    header: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    link: "text-orange-600 hover:text-orange-800",
    row: "hover:bg-orange-50/50",
    icon: "bg-orange-100",
  },
  gray: {
    header: "bg-gray-50 border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    link: "text-gray-600 hover:text-gray-800",
    row: "hover:bg-gray-50/50",
    icon: "bg-gray-100",
  },
} as const;

export default function QuickRefPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 헤더 */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-blue-600">홈</Link>
          {" / "}
          <span className="text-gray-900">수치 빠른 참조</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">📊 수치 빠른 참조</h1>
        <p className="text-sm text-gray-500 mt-1">
          현장에서 바로 확인하는 측량 핵심 수치 · 법령 원문 링크 포함
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
          <span>⚠️</span>
          수치는 참고용입니다. 반드시 아래 원문 링크에서 최신 조문을 확인하세요.
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUICK_REF_CARDS.map((card) => {
          const c = COLOR_MAP[card.color];
          const href = `${lawHref(card.lawId)}?cat=${card.catId}`;
          const searchHref = `${lawHref(card.lawId)}?cat=${card.catId}`;
          return (
            <div
              key={card.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm ${c.header}`}
            >
              {/* 카드 헤더 */}
              <div className={`px-4 py-3 border-b ${c.header}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg w-8 h-8 flex items-center justify-center rounded-lg ${c.icon}`}>
                      {card.icon}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">{card.title}</h2>
                      <p className="text-xs text-gray-500">{card.lawName}</p>
                    </div>
                  </div>
                  {/* 원문 링크 */}
                  <Link
                    href={href}
                    className={`shrink-0 text-xs font-medium flex items-center gap-1 ${c.link}`}
                  >
                    원문 →
                  </Link>
                </div>
              </div>

              {/* 수치 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {card.headers.map((h, i) => (
                        <th
                          key={i}
                          className={`px-3 py-2 text-left text-xs font-semibold text-gray-500 ${
                            i === 0 ? "w-1/2" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {card.rows.map((row, ri) => (
                      <tr key={ri} className={`transition-colors ${c.row}`}>
                        <td className="px-3 py-2 text-xs text-gray-700 font-medium">
                          {row.label}
                        </td>
                        {row.values.map((v, vi) => (
                          <td key={vi} className="px-3 py-2">
                            <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${c.badge}`}>
                              {v}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 하단 주석 + 검색 링크 */}
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-400 flex-1">{card.note}</p>
                <Link
                  href={`${lawHref(card.lawId)}?cat=${card.catId}`}
                  className={`shrink-0 text-xs underline underline-offset-2 ${c.link}`}
                >
                  조문 검색
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 안내 */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-800">📌 사용 안내</p>
        <ul className="text-xs text-gray-500 space-y-1 mt-1 list-disc list-inside">
          <li>수치는 참고용이며, 법령 개정 시 변경될 수 있습니다.</li>
          <li>각 카드의 <strong>원문 →</strong> 링크로 실제 조문을 확인하세요.</li>
          <li>즐겨찾기한 법령이 개정되면 알림을 받을 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
