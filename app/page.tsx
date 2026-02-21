import Link from "next/link";
import { SURVEY_LAWS, CATEGORY_TREE } from "@/lib/constants/laws";
import LawTypeBadge from "@/components/laws/LawTypeBadge";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">측량 법령 기준 조회</h1>
        <p className="mt-1 text-gray-500 text-sm">
          국가법령정보센터와 실시간 연동 · 개정 시 자동 알림
        </p>
      </div>

      {/* 빠른 검색 */}
      <div className="bg-blue-700 rounded-xl p-6 text-white">
        <h2 className="font-semibold text-lg mb-3">빠른 검색</h2>
        <div className="flex flex-wrap gap-2">
          {[
            "지적측량 허용오차",
            "GNSS 장비기준",
            "공공측량 기준점",
            "드론측량",
            "측량업 등록",
            "지적확정측량",
          ].map((kw) => (
            <Link
              key={kw}
              href={`/search?q=${encodeURIComponent(kw)}`}
              className="bg-blue-600 hover:bg-blue-500 text-sm px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              {kw}
            </Link>
          ))}
        </div>
      </div>

      {/* 카테고리 바로가기 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          측량 종류별 기준
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORY_TREE.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold text-gray-800">{cat.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.children?.slice(0, 4).map((child) => (
                  <Link
                    key={child.id}
                    href={child.lawId ? `/laws/${child.lawId}` : "#"}
                    className="text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 px-2 py-1 rounded transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 주요 법령 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">주요 법령</h2>
          <Link href="/laws" className="text-sm text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {SURVEY_LAWS.map((law) => (
            <Link
              key={law.id}
              href={`/laws/${law.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <LawTypeBadge type={law.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {law.name}
                </p>
                <p className="text-xs text-gray-400">{law.department}</p>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
