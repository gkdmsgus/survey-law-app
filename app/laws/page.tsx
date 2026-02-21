import Link from "next/link";
import { SURVEY_LAWS, CATEGORY_TREE } from "@/lib/constants/laws";
import LawTypeBadge from "@/components/laws/LawTypeBadge";

export default function LawsPage() {
  const typeOrder = ["법률", "시행령", "시행규칙", "고시", "훈령", "예규"];
  const typeGroups: Record<string, typeof SURVEY_LAWS> = {};
  for (const law of SURVEY_LAWS) {
    if (!typeGroups[law.type]) typeGroups[law.type] = [];
    typeGroups[law.type].push(law);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">측량 관련 법령</h1>
        <p className="text-sm text-gray-500 mt-1">
          공간정보관리법 체계 하의 주요 측량 법령 및 행정규칙
        </p>
      </div>

      {typeOrder
        .filter((t) => typeGroups[t])
        .map((type) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <LawTypeBadge type={type} />
              <h2 className="text-base font-semibold text-gray-700">{type}</h2>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {typeGroups[type].map((law) => (
                <Link
                  key={law.id}
                  href={`/laws/${law.id}`}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {law.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {law.department} · 관련:{" "}
                      {law.categories.join(", ")}
                    </p>
                  </div>
                  <span className="text-blue-500 text-sm shrink-0">
                    조문 보기 →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

      {/* 카테고리 탐색 */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          기준 항목별 탐색
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORY_TREE.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span>{cat.icon}</span>
                <span className="font-semibold text-gray-800">{cat.label}</span>
              </div>
              <div className="space-y-1">
                {cat.children?.map((child) => (
                  <Link
                    key={child.id}
                    href={child.lawId ? `/laws/${child.lawId}` : "#"}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 px-2 rounded hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-gray-300">›</span>
                    {child.label}
                    {child.lawId && (
                      <span className="ml-auto text-xs text-gray-400">
                        {SURVEY_LAWS.find((l) => l.id === child.lawId)
                          ?.shortName ?? ""}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
